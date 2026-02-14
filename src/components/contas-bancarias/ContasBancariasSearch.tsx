
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ExportDropdown from "@/components/common/ExportDropdown";

interface ContasBancariasSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const ContasBancariasSearch: React.FC<ContasBancariasSearchProps> = ({
  searchQuery,
  onSearchChange,
  onExportCSV,
  onExportPDF,
}) => {
  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      onExportCSV();
    } else {
      onExportPDF();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="w-full sm:w-3/4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contas bancárias..."
          value={searchQuery}
          onChange={onSearchChange}
          className="pl-10 w-full"
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <ExportDropdown onExport={handleExport} />
      </div>
    </div>
  );
};

export default ContasBancariasSearch;
