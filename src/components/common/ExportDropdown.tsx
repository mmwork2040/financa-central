
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, FileType } from "lucide-react";

interface ExportDropdownProps {
  onExport: (format: 'csv' | 'pdf') => void;
  label?: string;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ onExport, label = "Exportar" }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onExport('csv')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
          <FileText className="mr-2 h-4 w-4 text-green-600" />
          <span>Exportar CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
          <FileType className="mr-2 h-4 w-4 text-red-600" />
          <span>Visualizar PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;
