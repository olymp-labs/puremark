"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark as BookmarkIcon, List, MoreHorizontal, Search, Settings, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { BookmarkItem } from "@/components/BookmarkItem";
import { BookmarkManager } from "@/components/BookmarkManager";
import { EditModal } from "@/components/EditModal";
import { SettingsModal } from "@/components/SettingsModal";
import { useSearch } from "@/hooks/useSearch";
import type { AppSettings, Bookmark } from "@/types";

const App: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [editingItem, setEditingItem] = useState<Bookmark | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    autoDetectClipboardLinks: true,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchBookmarks();
    fetchSettings();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch("/api/bookmarks");
      const data = await res.json();
      setBookmarks(data);
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleEdit = (item: Bookmark) => {
    setPendingDeleteId(null);
    setIsAddingNew(false);
    setEditingItem(item);
  };

  const handleDelete = async (item: Bookmark) => {
    if (pendingDeleteId === item.id) {
      try {
        await fetch(`/api/bookmarks/${item.id}`, { method: "DELETE" });
        setBookmarks((prev) => prev.filter((b) => b.id !== item.id));
        setPendingDeleteId(null);
      } catch (error) {
        console.error("Failed to delete bookmark:", error);
      }
    } else {
      setPendingDeleteId(item.id);
    }
    inputRef.current?.focus();
  };

  const handleDeleteById = async (id: string) => {
    try {
      await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    }
  };

  const handleSave = async (updatedItem: Bookmark) => {
    const now = Date.now();
    const itemWithTimestamp = { ...updatedItem, updatedAt: now };

    try {
      if (isAddingNew) {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemWithTimestamp),
        });
        const newItem = await res.json();
        setBookmarks((prev) => [{ ...newItem, createdAt: now }, ...prev]);
      } else {
        await fetch(`/api/bookmarks/${itemWithTimestamp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemWithTimestamp),
        });
        setBookmarks((prev) =>
          prev.map((b) => (b.id === itemWithTimestamp.id ? itemWithTimestamp : b)),
        );
      }
      setEditingItem(null);
      setIsAddingNew(false);
      if (!showManager) {
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("Failed to save bookmark:", error);
    }
  };

  const handleClick = async (item: Bookmark) => {
    try {
      await fetch(`/api/bookmarks/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: true, displayedIds }),
      });
      setBookmarks((prev) =>
        prev.map((b) => {
          if (b.id === item.id) {
            return { ...b, clicks: (b.clicks || 0) + 1 };
          } else if (displayedIds.includes(b.id)) {
            return { ...b, clicks: Math.max(0, (b.clicks || 0) - 1) };
          }
          return b;
        }),
      );
      window.location.href = item.url;
    } catch (error) {
      console.error("Failed to increment clicks:", error);
      window.location.href = item.url;
    }
  };

  const handleSettingsUpdate = async (newSettings: AppSettings) => {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const normalizeUrl = (url: string): string => {
    let normalized = url.trim();

    try {
      const urlObj = new URL(normalized);
      if (urlObj.pathname === "/") {
        urlObj.pathname = "";
      }
      normalized = urlObj.toString();
    } catch {}

    return normalized;
  };

  const extractDomainName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname;

      if (hostname.startsWith("www.")) hostname = hostname.slice(4);

      const parts = hostname.split(".");

      if (parts.length > 1) {
        parts.pop();
      }

      return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    } catch (e) {
      return "New Bookmark";
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (editingItem || showSettings || showManager) return;

      if (!settings.autoDetectClipboardLinks) return;

      const clipboardText = e.clipboardData?.getData("text") || "";

      const urlRegex = /^(https?:\/\/[^\s]+)/;

      if (urlRegex.test(clipboardText)) {
        e.preventDefault();

        const normalizedUrl = normalizeUrl(clipboardText);
        const name = extractDomainName(normalizedUrl);

        const newBookmark: Bookmark = {
          id: crypto.randomUUID(),
          title: name,
          url: normalizedUrl,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setIsAddingNew(true);
        setEditingItem(newBookmark);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [settings.autoDetectClipboardLinks, editingItem, showSettings, showManager]);

  const { results, displayedIds, selectedIndex, handleKeyDown } = useSearch(
    query,
    bookmarks,
    handleEdit,
    handleDelete,
    handleClick,
  );

  useEffect(() => {
    setPendingDeleteId(null);
  }, [selectedIndex, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (editingItem || showSettings || showManager) return;

    const focusInput = () => inputRef.current?.focus();
    focusInput();

    const handleClick = (e: MouseEvent) => {
      if (editingItem || showSettings || showManager || isMenuOpen) return;
      if (menuRef.current?.contains(e.target as Node)) return;

      if (document.getSelection()?.toString().length === 0) {
        focusInput();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (editingItem || showSettings || showManager) return;

      if (e.key === "Escape") {
        if (isMenuOpen) {
          setIsMenuOpen(false);
          return;
        }
        if (pendingDeleteId) {
          setPendingDeleteId(null);
          return;
        }
        setQuery("");
        return;
      }

      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement !== inputRef.current
      ) {
        focusInput();
      }

      handleKeyDown(e);
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleKeyDown, editingItem, pendingDeleteId, showSettings, showManager, isMenuOpen]);

  const hasResults = results.length > 0;
  const showResults = query.length >= 2;
  const maxClicks = hasResults ? Math.max(...results.map((r) => r.clicks || 0)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-neutral-600">
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-[#050505] text-neutral-200 selection:bg-blue-500/30 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="absolute top-6 right-6 z-20" ref={menuRef}>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-2 rounded-full transition-all ${isMenuOpen ? "bg-neutral-800 text-white" : "text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900"}`}
        >
          <MoreHorizontal className="w-5 h-5" />
        </motion.button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 mt-2 w-48 bg-neutral-925 border border-neutral-800 rounded-xl shadow-xl overflow-hidden"
            >
              <button
                onClick={() => {
                  setShowManager(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors first:rounded-t-xl"
              >
                <List className="w-4 h-4" />
                Manage Bookmarks
              </button>
              <button
                onClick={() => {
                  setShowSettings(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors last:rounded-b-xl"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-2xl px-6 relative z-10 flex flex-col items-center">
        <AnimatePresence mode="popLayout">
          {!showResults && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 48 }}
              exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col items-center overflow-hidden origin-bottom"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl mb-6">
                <BookmarkIcon className="w-8 h-8 text-neutral-400" />
              </div>
              <h1 className="text-3xl font-light tracking-tight text-neutral-400">PureMark</h1>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="w-full relative group"
        >
          <motion.div
            animate={
              isFocused || showResults
                ? {
                    borderColor: [
                      "rgba(59, 130, 246, 0.2)",
                      "rgba(59, 130, 246, 0.5)",
                      "rgba(59, 130, 246, 0.2)",
                    ],
                    boxShadow: [
                      "0 0 0 1px rgba(59, 130, 246, 0.05), 0 2px 8px rgba(59, 130, 246, 0.02)",
                      "0 0 0 3px rgba(59, 130, 246, 0.15), 0 10px 30px rgba(59, 130, 246, 0.2)",
                      "0 0 0 1px rgba(59, 130, 246, 0.05), 0 2px 8px rgba(59, 130, 246, 0.02)",
                    ],
                  }
                : {
                    borderColor: "rgba(38, 38, 38, 1)",
                    boxShadow: "0 0 0 0px rgba(0,0,0,0), 0 0 0 0 rgba(0,0,0,0)",
                  }
            }
            whileHover={
              !(isFocused || showResults)
                ? {
                    borderColor: "rgba(64, 64, 64, 1)",
                  }
                : {}
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative overflow-hidden rounded-2xl bg-[#0f0f0f] border shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
          >
            <div className="flex items-center h-16 px-6">
              <Search
                className={`w-5 h-5 transition-colors duration-200 ${showResults ? "text-blue-400" : "text-neutral-600"}`}
              />

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                className="w-full h-full bg-transparent border-none outline-none text-xl px-4 placeholder-neutral-700 text-neutral-200 caret-transparent"
                placeholder="Type to search..."
                autoComplete="off"
                autoFocus
                disabled={!!editingItem || showSettings || showManager}
              />

              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full hover:bg-neutral-800 text-neutral-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {showResults && !editingItem && !showSettings && !showManager && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="border-t border-neutral-800/50 bg-[#0a0a0a]/50 backdrop-blur-sm"
                >
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                    {hasResults ? (
                      results.map((item, index) => (
                        <BookmarkItem
                          key={item.id}
                          item={item}
                          isSelected={index === selectedIndex}
                          isPendingDelete={pendingDeleteId === item.id}
                          onClick={() => handleClick(item)}
                          maxClicks={maxClicks}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-12 text-center text-neutral-500"
                      >
                        <p>No results for "{query}"</p>
                        <p className="text-xs mt-2 text-neutral-700">Try a different search term</p>
                      </motion.div>
                    )}
                  </div>

                  {hasResults && (
                    <div className="px-4 py-2 bg-neutral-900/30 border-t border-white/5 flex justify-between items-center text-[10px] text-neutral-500 uppercase tracking-widest font-medium">
                      <span>{results.length} Bookmarks found</span>
                      <div className="flex gap-3 items-center">
                        <span className="flex items-center gap-1">
                          <span className="bg-neutral-800 px-1 rounded">↑</span>{" "}
                          <span className="bg-neutral-800 px-1 rounded">↓</span> Navigate
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="bg-neutral-800 px-1 rounded">⌃ E</span> Edit
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="bg-neutral-800 px-1 rounded">⇧ Del</span>{" "}
                          {pendingDeleteId ? "Confirm" : "Delete"}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="bg-neutral-800 px-1 rounded">↵</span> Open
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {!showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-neutral-600 text-sm font-light text-center space-y-2"
          >
            <p>Just start typing</p>
            <p>Or paste a link to add a bookmark</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdate={handleSettingsUpdate}
            onClose={() => {
              setShowSettings(false);
              inputRef.current?.focus();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManager && (
          <BookmarkManager
            bookmarks={bookmarks}
            onClose={() => {
              setShowManager(false);
              inputRef.current?.focus();
            }}
            onDelete={handleDeleteById}
            onEdit={handleEdit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <EditModal
            bookmark={editingItem}
            isNew={isAddingNew}
            onSave={handleSave}
            onCancel={() => {
              setEditingItem(null);
              setIsAddingNew(false);
              if (!showManager) {
                inputRef.current?.focus();
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
