import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { useProjetos } from "@/hooks/useProjetos";
import { ProjetosTable } from "@/components/projetos/ProjetosTable";
import { ProjetoForm } from "@/components/projetos/ProjetoForm";
import { ProjetoDeleteDialog } from "@/components/projetos/ProjetoDeleteDialog";
import { useAuth } from "@/contexts/AuthContext";

const Projetos = () => {
  const {
    projetos, loading, currentProjeto, isModalOpen, isDeleteDialogOpen, isSaving,
    openModal, confirmDelete, handleInputChange, handleSelectChange,
    handleSubmit, handleDelete, setIsModalOpen, setIsDeleteDialogOpen,
  } = useProjetos();
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("projetos", "pode_incluir");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Gerencie seus projetos e acompanhe receitas e despesas por projeto"
        buttonLabel={canIncluir ? "Novo Projeto" : undefined}
        onButtonClick={canIncluir ? () => openModal() : undefined}
        showButton={canIncluir}
      />

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando...</div>
      ) : (
        <ProjetosTable projetos={projetos} onEdit={openModal} onDelete={confirmDelete} />
      )}

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
