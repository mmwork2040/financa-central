import React from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortableTableHeadProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDir: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}

const SortableTableHead: React.FC<SortableTableHeadProps> = ({
  label, sortKey, currentSortKey, currentSortDir, onSort, className = "",
}) => {
  const Icon = currentSortKey !== sortKey
    ? ArrowUpDown
    : currentSortDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={`cursor-pointer select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={`h-3 w-3 ${currentSortKey !== sortKey ? "opacity-40" : ""}`} />
      </span>
    </TableHead>
  );
};

export default SortableTableHead;
