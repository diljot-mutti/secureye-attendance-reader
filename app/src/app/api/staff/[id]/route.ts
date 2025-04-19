import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, context: { params: Params }) {
  const { id } = await context.params;
  try {
    const { staffName, active } = await request.json();

    if (!staffName) {
      return NextResponse.json({ error: "Staff name is required" }, { status: 400 });
    }

    const [result] = await pool.query("UPDATE staff SET staffName = ?, active = ? WHERE id = ?", [
      staffName,
      active,
      id,
    ]);

    return NextResponse.json({ message: "Staff updated successfully", result });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}
