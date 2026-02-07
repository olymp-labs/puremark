import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    allowExport: process.env.DB_ALLOW_EXPORT !== "false",
    allowImport: process.env.DB_ALLOW_IMPORT !== "false",
    dbPrefill: process.env.DB_PREFILL === "true",
  });
}
