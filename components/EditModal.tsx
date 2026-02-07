import { motion } from "framer-motion";
import { Plus, Save, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { Bookmark } from "../types";

interface Props {
  bookmark: Bookmark;
  onSave: (updated: Bookmark) => void;
  onCancel: () => void;
  isNew?: boolean;
}

export const EditModal: React.FC<Props> = ({ bookmark, onSave, onCancel, isNew = false }) => {
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [tags, setTags] = useState(() => {
    const filteredTags = bookmark.tags?.filter((tag) => !isTagMatchUrl(tag, bookmark.url));
    return filteredTags?.join(", ") || "";
  });
  const [faviconUrl, setFaviconUrl] = useState(bookmark.faviconUrl || "");
  const [urlError, setUrlError] = useState("");
  const [faviconError, setFaviconError] = useState("");
  const [tagsError, setTagsError] = useState("");

  function isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  function isValidImageUrl(urlString: string): boolean {
    if (!urlString.trim()) return true;
    if (!isValidUrl(urlString)) return false;
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".bmp"];
    const lowerUrl = urlString.toLowerCase();
    return allowedExtensions.some((ext) => lowerUrl.endsWith(ext));
  }

  function isValidTagsInput(input: string): boolean {
    const allowedChars = /^[a-zA-Z0-9\s\-_,äöüÄÖÜßéèêàáâóòôúùûéèëïöü]*$/;
    return allowedChars.test(input);
  }

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl && !isValidUrl(newUrl)) {
      setUrlError("Invalid URL");
    } else {
      setUrlError("");
    }
    setTags((currentTags) => {
      const tagsList = currentTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const filteredTags = tagsList.filter((tag) => !isTagMatchUrl(tag, newUrl));
      return filteredTags.join(", ");
    });
  };

  const handleFaviconChange = (newUrl: string) => {
    setFaviconUrl(newUrl);
    if (newUrl && !isValidImageUrl(newUrl)) {
      setFaviconError("Favicon must be a valid image URL");
    } else {
      setFaviconError("");
    }
  };

  const handleTagsChange = (newTags: string) => {
    setTags(newTags);
    if (newTags && !isValidTagsInput(newTags)) {
      setTagsError("Tags can only contain letters, numbers, spaces, hyphens and underscores");
    } else {
      setTagsError("");
    }
  };

  function isTagMatchUrl(tag: string, url: string): boolean {
    try {
      const urlObj = new URL(url);
      const tagLower = tag.toLowerCase().trim();
      const urlLower = url.toLowerCase().trim();

      if (tagLower === urlLower) return true;

      if (tagLower === urlObj.hostname) return true;

      if (tagLower.startsWith("http://") || tagLower.startsWith("https://")) {
        try {
          const tagUrl = new URL(tag);
          if (tagUrl.href.replace(/\/$/, "") === urlObj.href.replace(/\/$/, "")) {
            return true;
          }
        } catch {}
      }

      return false;
    } catch {
      return false;
    }
  }

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!isValidUrl(url)) {
      setUrlError("Invalid URL");
      hasError = true;
    }

    if (faviconUrl && !isValidImageUrl(faviconUrl)) {
      setFaviconError("Favicon must be a valid image URL");
      hasError = true;
    }

    if (tags && !isValidTagsInput(tags)) {
      setTagsError("Tags can only contain letters, numbers, spaces, hyphens and underscores");
      hasError = true;
    }

    if (hasError) return;

    onSave({
      ...bookmark,
      title,
      url,
      faviconUrl: faviconUrl.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-md bg-neutral-925 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-medium text-white">
            {isNew ? "Add Bookmark" : "Edit Bookmark"}
          </h2>
          <button
            onClick={onCancel}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
              Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={`w-full bg-[#0a0a0a] border rounded-lg px-3 py-2 text-neutral-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all ${
                urlError ? "border-red-500" : "border-neutral-800"
              }`}
            />
            {urlError && <p className="text-xs text-red-500">{urlError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
              Favicon URL (optional)
            </label>
            <input
              type="text"
              value={faviconUrl}
              onChange={(e) => handleFaviconChange(e.target.value)}
              placeholder="e.g. https://example.com/icon.png"
              className={`w-full bg-[#0a0a0a] border rounded-lg px-3 py-2 text-neutral-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-neutral-700 ${
                faviconError ? "border-red-500" : "border-neutral-800"
              }`}
            />
            {faviconError && <p className="text-xs text-red-500">{faviconError}</p>}
            {!faviconError && (
              <p className="text-[10px] text-neutral-600">
                Leave empty to use auto-generated favicon from the URL
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
              Aliases (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="e.g. work, social, daily"
              className={`w-full bg-[#0a0a0a] border rounded-lg px-3 py-2 text-neutral-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-neutral-700 ${
                tagsError ? "border-red-500" : "border-neutral-800"
              }`}
            />
            {tagsError && <p className="text-xs text-red-500">{tagsError}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <span>Cancel</span>
              <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100 transition-opacity border border-neutral-700 rounded px-1">
                ESC
              </span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all group"
            >
              {isNew ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isNew ? "Add" : "Save"}</span>
              <span className="text-[10px] font-mono bg-white/20 px-1.5 rounded text-white/90">
                ↵
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
