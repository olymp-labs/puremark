import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type React from "react";
import type { Bookmark } from "../types";

interface Props {
  item: Bookmark;
  isSelected: boolean;
  isPendingDelete?: boolean;
  onClick: () => void;
  maxClicks?: number;
}

export const BookmarkItem: React.FC<Props> = ({
  item,
  isSelected,
  isPendingDelete,
  onClick,
  maxClicks,
}) => {
  const getClickRating = (clicks: number, max: number): number => {
    if (max === 0) return 0;
    const ratio = clicks / max;
    if (ratio === 1) return 3;
    if (ratio >= 0.67) return 2;
    if (ratio >= 0.33) return 1;
    return 0;
  };

  const showRating = maxClicks !== undefined && maxClicks > 0;
  const rating = showRating ? getClickRating(item.clicks || 0, maxClicks) : 0;
  let faviconUrl =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1ZWExZjQiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtcXVlc3Rpb24tbWFyay1pY29uIGx1Y2lkZS1maWxlLXF1ZXN0aW9uLW1hcmsiPjxwYXRoIGQ9Ik02IDIyYTIgMiAwIDAgMS0yLTJWNGEyIDIgMCAwIDEgMi0yaDhhMi40IDIuNCAwIDAgMSAxLjcwNC43MDZsMy41ODggMy41ODhBMi40IDIuNCAwIDAgMSAyMCA4djEyYTIgMiAwIDAgMS0yIDJ6Ii8+PHBhdGggZD0iTTEyIDE3aC4wMSIvPjxwYXRoIGQ9Ik05LjEgOWEzIDMgMCAwIDEgNS44MiAxYzAgMi0zIDMtMyAzIi8+PC9zdmc+";
  if (item.faviconUrl) {
    faviconUrl = item.faviconUrl;
  } else {
    const url = new URL(item.url);
    if (url && url.hostname) {
      faviconUrl = `https://favicon.vemetric.com/${url.hostname}`;
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200
        group border
        ${
          isPendingDelete
            ? "bg-red-900/20 border-red-500/50"
            : isSelected
              ? "bg-neutral-800 border-transparent"
              : "hover:bg-neutral-900 border-transparent hover:border-neutral-800"
        }
      `}
    >
      {/* Selection Indicator Bar */}
      {isSelected && !isPendingDelete && (
        <motion.div
          layoutId="selection-indicator"
          className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Pending Delete Indicator Bar */}
      {isPendingDelete && (
        <motion.div
          layoutId="delete-indicator"
          className="absolute left-0 top-2 bottom-2 w-1 bg-red-500 rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Icon */}
      <div
        className={`
        relative shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border overflow-hidden transition-colors
        ${isPendingDelete ? "bg-red-950/50 border-red-900" : "bg-neutral-950 border-neutral-800"}
      `}
      >
        {isPendingDelete ? (
          <Trash2 className="w-5 h-5 text-red-500" />
        ) : (
          <img
            src={faviconUrl}
            alt=""
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            onError={(e) => {
              (e.target as HTMLImageElement).classList.add("hidden");
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3
            className={`font-medium truncate text-lg transition-colors duration-100 ${isPendingDelete ? "text-red-200" : isSelected ? "text-white" : "text-neutral-300"}`}
          >
            {item.title}
          </h3>
          {isPendingDelete ? (
            <span className="text-xs text-red-400 font-medium uppercase tracking-wider animate-pulse">
              Confirm Delete
            </span>
          ) : (
            showRating && (
              <div className="flex gap-1">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index < rating ? "bg-blue-400" : "bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
            )
          )}
        </div>
        <p
          className={`text-sm truncate transition-colors ${isPendingDelete ? "text-red-400/70" : "text-neutral-500"}`}
        >
          {item.url}
        </p>
      </div>
    </div>
  );
};
