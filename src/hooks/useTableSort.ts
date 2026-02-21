import { useState, useMemo } from "react";

type SortDir = "asc" | "desc";

export function useTableSort<T>(items: T[]) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      // Handle numbers
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Handle booleans
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        return sortDir === "asc" ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }

      // Handle dates
      if (sortKey.includes("created_at") || sortKey.includes("updated_at") || sortKey.includes("data")) {
        const da = new Date(aVal || 0).getTime();
        const db = new Date(bVal || 0).getTime();
        return sortDir === "asc" ? da - db : db - da;
      }

      // Strings
      const aStr = (aVal ?? "").toString().toLowerCase();
      const bStr = (bVal ?? "").toString().toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  return { sortedItems, sortKey, sortDir, toggleSort };
}
