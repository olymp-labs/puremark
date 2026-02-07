import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bookmark } from "../types";

const getClickRating = (clicks: number, max: number): number => {
  if (max === 0) return 0;
  const ratio = clicks / max;
  if (ratio === 1) return 3;
  if (ratio >= 0.67) return 2;
  if (ratio >= 0.33) return 1;
  return 0;
};

export const useSearch = (
  query: string,
  data: Bookmark[],
  onEdit?: (item: Bookmark) => void,
  onDelete?: (item: Bookmark) => void,
  onClick?: (item: Bookmark) => void,
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter logic
  const results = useMemo(() => {
    // Only search if query has at least 2 characters to reduce jumping
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.url.toLowerCase().includes(lowerQuery) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );

    // Check if any bookmark has clicks
    const hasClicks = filtered.some((item) => (item.clicks || 0) > 0);

    if (hasClicks) {
      const maxClicks = Math.max(...filtered.map((item) => item.clicks || 0));

      // Sort by click rating (descending), keeping original order for same ratings
      const sorted = [...filtered].sort((a, b) => {
        const ratingA = getClickRating(a.clicks || 0, maxClicks);
        const ratingB = getClickRating(b.clicks || 0, maxClicks);

        if (ratingA !== ratingB) {
          return ratingB - ratingA; // Higher rating first
        }

        // Same rating - keep original order by index in filtered array
        return filtered.indexOf(a) - filtered.indexOf(b);
      });

      return sorted.slice(0, 8);
    }

    // No clicks - return filtered results as is
    return filtered.slice(0, 8);
  }, [query, data]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation logic
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if no results
      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          if (onClick) {
            onClick(selected);
          } else {
            window.location.href = selected.url;
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        // Edit shortcut
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected && onEdit) {
          onEdit(selected);
        }
      } else if (e.shiftKey && (e.key === "Delete" || e.key === "Backspace")) {
        // Delete shortcut (Shift + Delete/Backspace)
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected && onDelete) {
          onDelete(selected);
        }
      }
    },
    [results, selectedIndex, onEdit, onDelete, onClick],
  );

  const displayedIds = results.map((item) => item.id);

  return { results, displayedIds, selectedIndex, handleKeyDown };
};
