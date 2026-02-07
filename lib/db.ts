import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "db.sqlite");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    console.log("Initializing database at:", DB_PATH);
    try {
      db = new Database(DB_PATH);
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      initializeDatabase(db);
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      faviconUrl TEXT,
      clicks INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_title ON bookmarks(title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id TEXT NOT NULL,
      tag_name TEXT NOT NULL,
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tags_bookmark_id ON tags(bookmark_id);
    CREATE INDEX IF NOT EXISTS idx_tags_tag_name ON tags(tag_name COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const settingsCount = database.prepare("SELECT COUNT(*) as count FROM settings").get() as {
    count: number;
  };

  if (settingsCount.count === 0) {
    const insert = database.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    insert.run("autoDetectClipboardLinks", "true");
  }

  if (process.env.DB_PREFILL === "true") {
    const bookmarksCount = database.prepare("SELECT COUNT(*) as count FROM bookmarks").get() as {
      count: number;
    };

    if (bookmarksCount.count === 0) {
      insertInitialBookmarks(database);
    }
  }
}

function insertInitialBookmarks(database: Database.Database) {
  console.log("Pre-filling database with initial bookmarks...");
  const time = Date.now();

  const createBookmark = (title: string, url: string, tags: string[]) => {
    const id = crypto.randomUUID();
    const bookmark = {
      id,
      title,
      url,
      faviconUrl: null,
      clicks: 0,
      createdAt: time,
      updatedAt: time,
    };

    database
      .prepare(
        "INSERT INTO bookmarks (id, title, url, faviconUrl, clicks, createdAt, updatedAt) VALUES (@id, @title, @url, @faviconUrl, @clicks, @createdAt, @updatedAt)",
      )
      .run(bookmark);

    const insertTag = database.prepare("INSERT INTO tags (bookmark_id, tag_name) VALUES (?, ?)");
    tags.forEach((tag) => {
      insertTag.run(id, tag);
    });
  };

  const bookmarks: Array<[string, string, string[]]> = [
    ["Google", "https://google.com", ["google.com"]],
    ["Youtube", "https://youtube.com", ["youtube.com"]],
    ["Facebook", "https://facebook.com", ["facebook.com"]],
    ["Instagram", "https://instagram.com", ["instagram.com"]],
    ["Chatgpt", "https://chatgpt.com", ["chatgpt.com"]],
    ["X", "https://x.com", ["x.com"]],
    ["Reddit", "https://reddit.com", ["reddit.com"]],
    ["Whatsapp", "https://whatsapp.com", ["whatsapp.com"]],
    ["Wikipedia", "https://wikipedia.org", ["wikipedia.org"]],
    ["Bing", "https://bing.com", ["bing.com"]],
    ["Yahoo", "https://yahoo.co.jp", ["yahoo.co.jp"]],
    ["Tiktok", "https://tiktok.com", ["tiktok.com"]],
    ["Yahoo", "https://yahoo.com", ["yahoo.com"]],
    ["Yandex", "https://yandex.ru", ["yandex.ru"]],
    ["Amazon", "https://amazon.com", ["amazon.com"]],
    ["Bet", "https://bet.br", ["bet.br"]],
    ["Baidu", "https://baidu.com", ["baidu.com"]],
    ["Linkedin", "https://linkedin.com", ["linkedin.com"]],
    ["Naver", "https://naver.com", ["naver.com"]],
    ["Office", "https://office.com", ["office.com"]],
    ["Netflix", "https://netflix.com", ["netflix.com"]],
    ["Live", "https://live.com", ["live.com"]],
    ["Temu", "https://temu.com", ["temu.com"]],
    ["Pinterest", "https://pinterest.com", ["pinterest.com"]],
    ["Bilibili", "https://bilibili.com", ["bilibili.com"]],
    ["Dzen", "https://dzen.ru", ["dzen.ru"]],
    ["Microsoft", "https://microsoft.com", ["microsoft.com"]],
    ["Gemini Google", "https://gemini.google.com", ["gemini.google.com"]],
    ["Twitch", "https://twitch.tv", ["twitch.tv"]],
    ["Sharepoint", "https://sharepoint.com", ["sharepoint.com"]],
    ["Canva", "https://canva.com", ["canva.com"]],
    ["News Yahoo", "https://news.yahoo.co.jp", ["news.yahoo.co.jp"]],
    ["Vk", "https://vk.com", ["vk.com"]],
    ["Mail", "https://mail.ru", ["mail.ru"]],
    ["Samsung", "https://samsung.com", ["samsung.com"]],
    ["Weather", "https://weather.com", ["weather.com"]],
    ["Globo", "https://globo.com", ["globo.com"]],
    ["Fandom", "https://fandom.com", ["fandom.com"]],
    ["T", "https://t.me", ["t.me"]],
    ["Duckduckgo", "https://duckduckgo.com", ["duckduckgo.com"]],
    ["Zoom", "https://zoom.us", ["zoom.us"]],
    ["Nytimes", "https://nytimes.com", ["nytimes.com"]],
    ["Ebay", "https://ebay.com", ["ebay.com"]],
    ["Espn", "https://espn.com", ["espn.com"]],
    ["Roblox", "https://roblox.com", ["roblox.com"]],
    ["Aliexpress", "https://aliexpress.com", ["aliexpress.com"]],
    ["Discord", "https://discord.com", ["discord.com"]],
    ["Docomo Ne", "https://docomo.ne.jp", ["docomo.ne.jp"]],
    ["Amazon", "https://amazon.in", ["amazon.in"]],
    ["Bbc", "https://bbc.co.uk", ["bbc.co.uk"]],
    ["Spotify", "https://spotify.com", ["spotify.com"]],
    ["Amazon", "https://amazon.co.jp", ["amazon.co.jp"]],
    ["Instructure", "https://instructure.com", ["instructure.com"]],
    ["Apple", "https://apple.com", ["apple.com"]],
    ["Ozon", "https://ozon.ru", ["ozon.ru"]],
    ["Booking", "https://booking.com", ["booking.com"]],
    ["Walmart", "https://walmart.com", ["walmart.com"]],
    ["Github", "https://github.com", ["github.com"]],
    ["Msn", "https://msn.com", ["msn.com"]],
    ["Paypal", "https://paypal.com", ["paypal.com"]],
    ["Ya", "https://ya.ru", ["ya.ru"]],
    ["Bbc", "https://bbc.com", ["bbc.com"]],
    ["Imdb", "https://imdb.com", ["imdb.com"]],
    ["Telegram", "https://telegram.org", ["telegram.org"]],
    ["Cnn", "https://cnn.com", ["cnn.com"]],
    ["Amazon", "https://amazon.de", ["amazon.de"]],
    ["Share", "https://share.google", ["share.google"]],
    ["Rakuten", "https://rakuten.co.jp", ["rakuten.co.jp"]],
    ["Brave", "https://brave.com", ["brave.com"]],
    ["Etsy", "https://etsy.com", ["etsy.com"]],
    ["Quora", "https://quora.com", ["quora.com"]],
    ["Office365", "https://office365.com", ["office365.com"]],
    ["Rutube", "https://rutube.ru", ["rutube.ru"]],
    ["Amazon", "https://amazon.co.uk", ["amazon.co.uk"]],
    ["Qq", "https://qq.com", ["qq.com"]],
    ["Indeed", "https://indeed.com", ["indeed.com"]],
    ["Wildberries", "https://wildberries.ru", ["wildberries.ru"]],
    ["Cricbuzz", "https://cricbuzz.com", ["cricbuzz.com"]],
    ["Ok", "https://ok.ru", ["ok.ru"]],
    ["Daum", "https://daum.net", ["daum.net"]],
    ["Openai", "https://openai.com", ["openai.com"]],
    ["Shein", "https://shein.com", ["shein.com"]],
    ["Music Youtube", "https://music.youtube", ["music.youtube"]],
    ["Deepseek", "https://deepseek.com", ["deepseek.com"]],
    ["Disneyplus", "https://disneyplus.com", ["disneyplus.com"]],
    ["Namu", "https://namu.wiki", ["namu.wiki"]],
    ["Chat Deepseek", "https://chat.deepseek.com", ["chat.deepseek.com"]],
    ["Adobe", "https://adobe.com", ["adobe.com"]],
    ["Douyin", "https://douyin.com", ["douyin.com"]],
    ["Avito", "https://avito.ru", ["avito.ru"]],
    ["Usps", "https://usps.com", ["usps.com"]],
    ["Pixiv", "https://pixiv.net", ["pixiv.net"]],
  ];

  bookmarks.forEach(([title, url, tags]) => {
    createBookmark(title, url, tags);
  });

  console.log(`Database pre-filled with ${bookmarks.length} bookmarks`);
}
