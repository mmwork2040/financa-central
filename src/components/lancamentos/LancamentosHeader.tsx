
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Filter, Plus } from "lucide-react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import ExportDropdown from "@/components/common/ExportDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

export const LancamentosHeader = () => {
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("lancamentos", "pode_incluir");
  const { visible, toggle } = useValuesVisibility();

  const { 
    handleOpenModal, 
    setOpenFilterModal, 
    exportToCSV, 
    exportToPDF 
  } = useLancamentosContext();

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold">Lançamentos</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground" title={visible ? "Ocultar valores" : "Exibir valores"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="outline" onClick={() => setOpenFilterModal(true)}>
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
        <ExportDropdown onExport={handleExport} />
        {canIncluir && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        )}
      </div>
    </div>
  );
};
