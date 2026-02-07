import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM settings").all() as any[];

    const settings = rows.reduce(
      (acc, row) => {
        acc[row.key] = row.value === "true";
        return acc;
      },
      {} as Record<string, boolean>,
    );

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(body)) {
      upsert.run(key, String(value));
    }

    const rows = db.prepare("SELECT * FROM settings").all() as any[];
    const settings = rows.reduce(
      (acc, row) => {
        acc[row.key] = row.value === "true";
        return acc;
      },
      {} as Record<string, boolean>,
    );

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
