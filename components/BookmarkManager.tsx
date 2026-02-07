import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Pencil, Trash2, X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { Bookmark } from "../types";

interface Props {
  bookmarks: Bookmark[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (item: Bookmark) => void;
}

type SortKey = "title" | "url" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

export const BookmarkManager: React.FC<Props> = ({ bookmarks, onClose, onDelete, onEdit }) => {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    // Clear delete state on interaction
    setPendingDeleteId(null);
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const handleDeleteClick = (id: string) => {
    if (pendingDeleteId === id) {
      onDelete(id);
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(id);
    }
  };

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === "string" && typeof valB === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [bookmarks, sortKey, sortDirection]);

  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj && urlObj.hostname) {
        return `https://favicon.vemetric.com/${urlObj.hostname}`;
      }
    } catch {}
    return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1ZWExZjQiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtcXVlc3Rpb24tbWFyay1pY29uIGx1Y2lkZS1maWxlLXF1ZXN0aW9uLW1hcmsiPjxwYXRoIGQ9Ik02IDIyYTIgMiAwIDAgMS0yLTJWNGEyIDIgMCAwIDEgMi0yaDhhMi40IDIuNCAwIDAgMSAxLjcwNC43MDZsMy41ODggMy41ODhBMi40IDIuNCAwIDAgMSAyMCA4djEyYTIgMiAwIDAgMS0yIDJ6Ii8+PHBhdGggZD0iTTEyIDE3aC4wMSIvPjxwYXRoIGQ9Ik05LjEgOWEzIDMgMCAwIDEgNS44MiAxYzAgMi0zIDMtMyAzIi8+PC9zdmc+";
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl h-[80vh] bg-neutral-925 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={() => setPendingDeleteId(null)} // Click inside clears pending delete
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-925">
          <div>
            <h2 className="text-xl font-medium text-white">Bookmark Manager</h2>
            <p className="text-sm text-neutral-500">{bookmarks.length} saved items</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          <div
            className="col-span-4 cursor-pointer hover:text-neutral-300 flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleSort("title");
            }}
          >
            Name
            {sortKey === "title" &&
              (sortDirection === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              ))}
          </div>
          <div
            className="col-span-4 cursor-pointer hover:text-neutral-300 flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleSort("url");
            }}
          >
            URL
            {sortKey === "url" &&
              (sortDirection === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              ))}
          </div>
          <div
            className="col-span-2 cursor-pointer hover:text-neutral-300 flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleSort("createdAt");
            }}
          >
            Added
            {sortKey === "createdAt" &&
              (sortDirection === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              ))}
          </div>
          <div className="col-span-2 flex justify-end">Actions</div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedBookmarks.map((bookmark) => {
            const isPendingDelete = pendingDeleteId === bookmark.id;
            return (
              <div
                key={bookmark.id}
                className={`
                    grid grid-cols-12 gap-4 px-6 py-3 border-b border-neutral-800/50 transition-colors group items-center
                    ${isPendingDelete ? "bg-red-900/10" : "hover:bg-neutral-900/40"}
                `}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Name & Icon */}
                <div className="col-span-4 flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                    <img
                      src={bookmark.faviconUrl || getFaviconUrl(bookmark.url)}
                      className="w-full h-full object-cover opacity-70"
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).classList.add("hidden");
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${isPendingDelete ? "text-red-200" : "text-neutral-200"}`}
                    >
                      {bookmark.title}
                    </div>
                  </div>
                </div>

                {/* URL */}
                <div className="col-span-4 overflow-hidden">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-neutral-500 hover:text-blue-400 truncate block hover:underline"
                  >
                    {bookmark.url}
                  </a>
                </div>

                {/* Added Date */}
                <div className="col-span-2 text-xs text-neutral-600 font-mono">
                  {formatDate(bookmark.createdAt)}
                </div>

                {/* Actions */}
                <div
                  className={`col-span-2 flex justify-end gap-2 transition-opacity ${isPendingDelete ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                >
                  <button
                    onClick={() => onEdit(bookmark)}
                    className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(bookmark.id)}
                    className={`
                        p-1.5 rounded transition-all flex items-center gap-2
                        ${
                          isPendingDelete
                            ? "bg-red-600 text-white hover:bg-red-500 px-3"
                            : "hover:bg-red-900/30 text-neutral-400 hover:text-red-400"
                        }
                      `}
                    title={isPendingDelete ? "Confirm Delete" : "Delete"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isPendingDelete && (
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Confirm
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {sortedBookmarks.length === 0 && (
            <div className="p-12 text-center text-neutral-600">No bookmarks found.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
