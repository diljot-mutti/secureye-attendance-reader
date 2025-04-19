import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { parse } from "csv-parse/sync";

interface CsvRecord {
  staffId: string;
  timestamp: string;
}

function validateRecord(record: CsvRecord): string | null {
  // Validate staffId
  if (!record.staffId || isNaN(Number(record.staffId))) {
    return `Invalid staffId: ${record.staffId}`;
  }

  // Validate timestamp
  const timestamp = new Date(record.timestamp);
  if (isNaN(timestamp.getTime())) {
    return `Invalid timestamp: ${record.timestamp}`;
  }

  // Validate timestamp is not in the future
  if (timestamp > new Date()) {
    return `Future timestamp not allowed: ${record.timestamp}`;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    // Get the CSV content from request body
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvContent = await file.text();

    // Parse CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }) as CsvRecord[];

    // Validate all records
    const validationErrors: { record: CsvRecord; error: string }[] = [];
    const validRecords: CsvRecord[] = [];

    records.forEach((record) => {
      const error = validateRecord(record);
      if (error) {
        validationErrors.push({ record, error });
      } else {
        validRecords.push(record);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          validationErrors,
          validRecordsCount: validRecords.length,
        },
        { status: 400 }
      );
    }

    if (validRecords.length === 0) {
      return NextResponse.json(
        {
          error: "No valid records to import",
        },
        { status: 400 }
      );
    }

    // Prepare the insert query
    const query = `
      INSERT INTO attendance_logs (staffId, timestamp)
      VALUES ?
    `;

    // Transform records to match table structure
    const values = validRecords.map((record) => [record.staffId, record.timestamp]);

    // Execute the bulk insert
    await pool.query(query, [values]);

    return NextResponse.json({
      message: "Import successful",
      recordsImported: values.length,
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json({ error: "Failed to import CSV data" }, { status: 500 });
  }
}
