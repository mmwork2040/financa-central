
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Filter, Plus, Receipt } from "lucide-react";
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Lançamentos</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground shrink-0" title={visible ? "Ocultar valores" : "Exibir valores"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setOpenFilterModal(true)}>
          <Filter className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          <span className="sm:hidden">Filtrar</span>
        </Button>
        <ExportDropdown onExport={handleExport} />
        {canIncluir && (
          <Button size="sm" onClick={() => handleOpenModal()} className="ml-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>
    </div>
  );
};
