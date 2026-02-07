import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function normalizeUrl(url: string): string {
  let normalized = url.trim();

  try {
    const urlObj = new URL(normalized);
    if (urlObj.pathname === "/") {
      urlObj.pathname = "";
    }
    normalized = urlObj.toString();
  } catch {}

  return normalized;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidImageUrl(urlString: string): boolean {
  if (!urlString || !urlString.trim()) return true;
  if (!isValidUrl(urlString)) return false;
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".bmp"];
  const lowerUrl = urlString.toLowerCase();
  return allowedExtensions.some((ext) => lowerUrl.endsWith(ext));
}

function isValidTag(tag: string): boolean {
  const allowedChars = /^[a-zA-Z0-9\-_äöüÄÖÜßéèêàáâóòôúùûéèëïöü]+$/;
  return allowedChars.test(tag.trim());
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(`
      SELECT
        b.*,
        GROUP_CONCAT(t.tag_name, ',') as tags
      FROM bookmarks b
      LEFT JOIN tags t ON b.id = t.bookmark_id
      GROUP BY b.id
      ORDER BY b.createdAt DESC
    `)
      .all() as any[];

    const bookmarks = rows.map((row) => ({
      ...row,
      tags: row.tags ? row.tags.split(",") : [],
    }));

    return NextResponse.json(bookmarks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, url, tags, faviconUrl } = body;

    const normalizedUrl = normalizeUrl(url);

    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (faviconUrl && !isValidImageUrl(faviconUrl)) {
      return NextResponse.json({ error: "Favicon must be a valid image URL" }, { status: 400 });
    }

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (!isValidTag(tag)) {
          return NextResponse.json(
            { error: "Tags can only contain letters, numbers, spaces, hyphens and underscores" },
            { status: 400 },
          );
        }
      }
    }

    const db = getDb();

    const existingBookmark = db
      .prepare("SELECT id FROM bookmarks WHERE url = ? COLLATE NOCASE")
      .get(normalizedUrl);
    if (existingBookmark) {
      return NextResponse.json({ error: "Bookmark with this URL already exists" }, { status: 409 });
    }

    const now = Date.now();

    const insertBookmark = db.prepare(`
      INSERT INTO bookmarks (id, title, url, faviconUrl, clicks, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertBookmark.run(id, title, normalizedUrl, faviconUrl || null, 0, now, now);

    if (tags && tags.length > 0) {
      const insertTag = db.prepare("INSERT INTO tags (bookmark_id, tag_name) VALUES (?, ?)");
      tags.forEach((tag: string) => {
        insertTag.run(id, tag);
      });
    }

    const row = db
      .prepare(`
      SELECT
        b.*,
        GROUP_CONCAT(t.tag_name, ',') as tags
      FROM bookmarks b
      LEFT JOIN tags t ON b.id = t.bookmark_id
      WHERE b.id = ?
      GROUP BY b.id
    `)
      .get(id) as any;

    if (row) {
      row.tags = row.tags ? row.tags.split(",") : [];
    }

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 });
  }
}
