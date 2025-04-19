import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const staffId = searchParams.get("staffId");

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
    }

    // Calculate start and end dates for the month
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    let query = `
      SELECT 
        DATE(timestamp) as date,
        staffId,
        MIN(timestamp) as first_entry,
        MAX(timestamp) as last_entry,
        GROUP_CONCAT(timestamp) as all_entries
      FROM attendance_logs
      WHERE timestamp BETWEEN ? AND ?
    `;

    const params: (Date | string)[] = [startDate, endDate];

    if (staffId) {
      query += " AND staffId = ?";
      params.push(staffId);
    }

    query += " GROUP BY DATE(timestamp), staffId ORDER BY date ASC";

    const [rows] = await pool.query(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    return NextResponse.json({ error: "Failed to fetch attendance logs" }, { status: 500 });
  }
}
