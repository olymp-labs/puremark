import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { increment, displayedIds } = body;

    if (increment) {
      if (
        !displayedIds ||
        !Array.isArray(displayedIds) ||
        displayedIds.length === 0 ||
        displayedIds.length > 8
      ) {
        return NextResponse.json({ error: "Invalid displayed IDs" }, { status: 400 });
      }

      const db = getDb();

      db.prepare("UPDATE bookmarks SET clicks = clicks + 1 WHERE id = ?").run(id);

      const placeholders = displayedIds.map(() => "?").join(",");
      db.prepare(
        `UPDATE bookmarks SET clicks = MAX(0, clicks - 1) WHERE id IN (${placeholders}) AND id != ?`,
      ).run(...displayedIds, id);

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

      return NextResponse.json(row);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to increment clicks" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, url, tags, faviconUrl } = body;

    if (!isValidUrl(url)) {
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

    const now = Date.now();

    const db = getDb();

    const updateBookmark = db.prepare(`
      UPDATE bookmarks
      SET title = ?, url = ?, faviconUrl = ?, updatedAt = ?
      WHERE id = ?
    `);

    updateBookmark.run(title, url, faviconUrl || null, now, id);

    db.prepare("DELETE FROM tags WHERE bookmark_id = ?").run(id);

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

    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("DELETE FROM bookmarks WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 });
  }
}
