
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ExportDropdown from "@/components/common/ExportDropdown";
import { useUsersContext } from "@/contexts/UsersContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface UsersSearchProps {
  onExport: (format: 'csv' | 'pdf') => void;
}

const statusFilterOptions = [
  { value: "todos", label: "Todos os status" },
  { value: "trial", label: "Trial" },
  { value: "ativo", label: "Ativo" },
  { value: "vencido", label: "Vencido" },
  { value: "cancelled", label: "Cancelado" },
  { value: "expired", label: "Expirado" },
  { value: "expirado", label: "Expirados (calculado)" },
];

export const UsersSearch = ({ onExport }: UsersSearchProps) => {
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter } = useUsersContext();

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="w-full sm:flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusFilterOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <ExportDropdown onExport={onExport} />
      </div>
    </div>
  );
};
