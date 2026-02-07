import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "db.sqlite");

export async function GET() {
  if (process.env.DB_ALLOW_EXPORT === "false") {
    return NextResponse.json({ error: "Database export is disabled" }, { status: 403 });
  }

  try {
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: "Database file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(DB_PATH);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `puremark-db-${timestamp}.sqlite`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export database:", error);
    return NextResponse.json({ error: "Failed to export database" }, { status: 500 });
  }
}
