import fs from "fs";
import { type NextRequest, NextResponse } from "next/server";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "db.sqlite");

export async function POST(request: NextRequest) {
  if (process.env.DB_ALLOW_IMPORT === "false") {
    return NextResponse.json({ error: "Database import is disabled" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".sqlite") && !file.name.endsWith(".db")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a .sqlite or .db file" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(DB_PATH, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to import database:", error);
    return NextResponse.json({ error: "Failed to import database" }, { status: 500 });
  }
}
