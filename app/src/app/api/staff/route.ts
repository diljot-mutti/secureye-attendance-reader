import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM staff");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, staffName, active } = body;

    // Validate required fields
    if (!id || !staffName) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    // Check if staff ID already exists
    const [existingStaff] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);

    if (Array.isArray(existingStaff) && existingStaff.length > 0) {
      return NextResponse.json({ error: "Staff ID already exists" }, { status: 400 });
    }

    // Insert new staff member
    await db.query("INSERT INTO staff (id, staffName, active) VALUES (?, ?, ?)", [id, staffName, active]);

    return NextResponse.json({ message: "Staff member added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error adding staff:", error);
    return NextResponse.json({ error: "Failed to add staff member" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, staffName, active } = body;

    if (!id || !staffName) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    await db.query("UPDATE staff SET staffName = ?, active = ? WHERE id = ?", [staffName, active, id]);

    return NextResponse.json({ message: "Staff member updated successfully" });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    await db.query("DELETE FROM staff WHERE id = ?", [id]);

    return NextResponse.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
