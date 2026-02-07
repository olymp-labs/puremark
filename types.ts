export interface Bookmark {
  id: string;
  title: string;
  url: string;
  tags?: string[];
  faviconUrl?: string;
  clicks?: number; // Simulate frequency
  createdAt: number;
  updatedAt: number;
}

export type SearchMode = "idle" | "searching";

export interface AppSettings {
  autoDetectClipboardLinks: boolean;
}
