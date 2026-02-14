
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ExportDropdown from "@/components/common/ExportDropdown";
import { useUsersContext } from "@/contexts/UsersContext";

interface UsersSearchProps {
  onExport: (format: 'csv' | 'pdf') => void;
}

export const UsersSearch = ({ onExport }: UsersSearchProps) => {
  const { searchQuery, setSearchQuery } = useUsersContext();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="w-full sm:w-3/4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <ExportDropdown onExport={onExport} />
      </div>
    </div>
  );
};
