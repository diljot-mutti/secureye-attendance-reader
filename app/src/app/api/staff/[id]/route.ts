import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { staffName, active } = await request.json();

    if (!staffName) {
      return NextResponse.json({ error: "Staff name is required" }, { status: 400 });
    }

    const [result] = await pool.query("UPDATE staff SET staffName = ?, active = ? WHERE id = ?", [
      staffName,
      active,
      params.id,
    ]);

    return NextResponse.json({ message: "Staff updated successfully", result });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const [result] = await pool.query("DELETE FROM staff WHERE id = ?", [params.id]);

    return NextResponse.json({ message: "Staff deleted successfully", result });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
