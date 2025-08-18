import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface CSVRecord {
  userId: string; // numeric string expected; will be coerced to number
  timestamp: string; // e.g. "2024-01-15 09:00:00"
  verifyMode?: string; // ignored
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records }: { records: CSVRecord[] } = body ?? {};

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No records provided" }, { status: 400 });
    }

    // Normalize and in-memory dedupe by (staffId, timestamp) to cut down volume
    const uniqueKeyToTuple = new Map<string, [number, string]>();
    for (const r of records) {
      const staffIdNum = Number(r.userId);
      // Skip obviously invalid rows
      if (!Number.isFinite(staffIdNum) || !r.timestamp) continue;
      const key = `${staffIdNum}|${r.timestamp}`;
      if (!uniqueKeyToTuple.has(key)) {
        uniqueKeyToTuple.set(key, [staffIdNum, r.timestamp]);
      }
    }

    const tuples = Array.from(uniqueKeyToTuple.values());
    if (tuples.length === 0) {
      return NextResponse.json({ error: "No valid records to import" }, { status: 400 });
    }

    // Batch INSERT IGNORE to let a UNIQUE KEY (staffId, timestamp) drop duplicates at the DB level
    // Chunk size chosen to balance packet size and round trips
    const BATCH_SIZE = 1000;
    let inserted = 0;

    for (let i = 0; i < tuples.length; i += BATCH_SIZE) {
      const batch = tuples.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => "(?, ?)").join(",");
      const flatValues: (number | string | Date)[] = [];
      for (const [staffId, ts] of batch) {
        flatValues.push(staffId, ts);
      }

      const sql = `INSERT IGNORE INTO attendance_logs (staffId, timestamp) VALUES ${placeholders}`;
      const [result] = await pool.query(sql, flatValues);
      // @ts-expect-error mysql2 OkPacket has affectedRows
      inserted += (result?.affectedRows as number) ?? 0;
    }

    const totalInput = records.length;
    const uniqueInput = tuples.length;
    const skippedFromClientDedupe = totalInput - uniqueInput;
    const skippedFromDbDedupe = uniqueInput - inserted;

    return NextResponse.json({
      message: "Import completed",
      totalRecords: totalInput,
      uniqueAfterClientDedupe: uniqueInput,
      newRecordsInserted: inserted,
      skippedAsClientDuplicates: skippedFromClientDedupe,
      skippedAsExistingInDb: skippedFromDbDedupe,
    });
  } catch (error) {
    console.error("Error importing records:", error);
    return NextResponse.json({ error: "Failed to import records" }, { status: 500 });
  }
}
