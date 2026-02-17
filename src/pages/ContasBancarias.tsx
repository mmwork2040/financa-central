
import React from "react";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import ContasBancariasTable from "@/components/contas-bancarias/ContasBancariasTable";
import ContaBancariaForm from "@/components/contas-bancarias/ContaBancariaForm";
import ContaBancariaDeleteDialog from "@/components/contas-bancarias/ContaBancariaDeleteDialog";
import ContasBancariasSearch from "@/components/contas-bancarias/ContasBancariasSearch";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { ValuesVisibilityProvider } from "@/contexts/ValuesVisibilityContext";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

const ContasBancariasContent = () => {
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("contas_bancarias", "pode_incluir");
  const canAlterar = canPerformAction("contas_bancarias", "pode_alterar");
  const canExcluir = canPerformAction("contas_bancarias", "pode_excluir");
  const { visible, toggle } = useValuesVisibility();

  const {
    contasBancarias, loading, formData, openModal, openDeleteModal, selectedId, searchQuery,
    handleInputChange, handleOpenModal, handleCloseModal, handleOpenDeleteModal, handleCloseDeleteModal,
    handleSave, handleDelete, handleExportCSV, handleExportPDF, handleSearchChange,
  } = useContasBancarias();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Bancárias"
        description="Gerencie as contas bancárias do sistema."
        buttonLabel="Nova Conta Bancária"
        onButtonClick={() => handleOpenModal()}
        showButton={canIncluir}
      />
      
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <ContasBancariasSearch
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        <Button variant="ghost" size="sm" onClick={toggle} className="gap-2 text-muted-foreground">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {visible ? "Ocultar" : "Exibir"}
        </Button>
      </div>
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando contas bancárias...</p>
        </div>
      ) : contasBancarias.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhuma conta bancária encontrada</p>
        </div>
      ) : (
        <ContasBancariasTable
          contasBancarias={contasBancarias}
          onEdit={handleOpenModal}
          onDelete={handleOpenDeleteModal}
          canEdit={canAlterar}
          canDelete={canExcluir}
        />
      )}
      
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Total de registros: {contasBancarias.length}
        </p>
      </div>

      <ContaBancariaForm
        open={openModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        formData={formData}
        handleInputChange={handleInputChange}
        isEditing={!!selectedId}
      />

      <ContaBancariaDeleteDialog
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        onDelete={handleDelete}
      />
    </div>
  );
};

const ContasBancarias = () => {
  return (
    <ValuesVisibilityProvider>
      <ContasBancariasContent />
    </ValuesVisibilityProvider>
  );
};

export default ContasBancarias;
