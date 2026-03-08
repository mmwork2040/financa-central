import React, { useState, useMemo, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useProjetos } from "@/hooks/useProjetos";
import { ProjetosTable } from "@/components/projetos/ProjetosTable";
import { ProjetoForm } from "@/components/projetos/ProjetoForm";
import { ProjetoDeleteDialog } from "@/components/projetos/ProjetoDeleteDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FolderKanban, Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import ExportDropdown from "@/components/common/ExportDropdown";
import { exportToCSV, generatePDFView } from "@/utils/exportUtils";
import { formatCurrency } from "@/utils/format";

const statusLabel = (s: string) => {
  if (s === "ativo") return "Ativo";
  if (s === "concluido") return "Concluído";
  return "Cancelado";
};

const Projetos = () => {
  const {
    projetos, loading, currentProjeto, isModalOpen, isDeleteDialogOpen, isSaving,
    openModal, confirmDelete, handleInputChange, handleSelectChange,
    handleSubmit, handleDelete, setIsModalOpen, setIsDeleteDialogOpen,
  } = useProjetos();
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("projetos", "pode_incluir");
  const { visible, toggle } = useValuesVisibility();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjetos = useMemo(() => {
    if (!searchQuery.trim()) return projetos;
    const q = searchQuery.toLowerCase();
    return projetos.filter((p) => p.nome.toLowerCase().includes(q));
  }, [projetos, searchQuery]);

  const headers = { nome: "Nome", status: "Status", orcamento: "Orçamento", descricao: "Descrição" };

  const handleExport = useCallback((format: 'csv' | 'pdf') => {
    const exportData = filteredProjetos.map((p) => ({
      nome: p.nome,
      status: statusLabel(p.status),
      orcamento: formatCurrency(p.orcamento),
      descricao: p.descricao || "-",
    }));
    if (format === "csv") {
      exportToCSV(exportData, headers, "projetos");
    } else {
      generatePDFView(exportData, headers, "Relatório de Projetos");
    }
  }, [filteredProjetos]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Gerencie seus projetos e acompanhe receitas e despesas por projeto"
        buttonLabel={canIncluir ? "Novo Projeto" : undefined}
        onButtonClick={canIncluir ? () => openModal() : undefined}
        showButton={canIncluir}
        icon={FolderKanban}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-3/4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <ExportDropdown onExport={handleExport} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando projetos...</p>
        </div>
      ) : filteredProjetos.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhum projeto encontrado</p>
        </div>
      ) : (
        <ProjetosTable projetos={filteredProjetos} onEdit={openModal} onDelete={confirmDelete} />
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {filteredProjetos.length} projetos
        </p>
      </div>

      <ProjetoForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProjeto={currentProjeto}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />

      <ProjetoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        projetoNome={currentProjeto?.nome || ""}
      />
    </div>
  );
};

export default Projetos;
