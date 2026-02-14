
import React from "react";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import ContasBancariasTable from "@/components/contas-bancarias/ContasBancariasTable";
import ContaBancariaForm from "@/components/contas-bancarias/ContaBancariaForm";
import ContaBancariaDeleteDialog from "@/components/contas-bancarias/ContaBancariaDeleteDialog";
import ContasBancariasSearch from "@/components/contas-bancarias/ContasBancariasSearch";
import PageHeader from "@/components/common/PageHeader";

const ContasBancarias = () => {
  const {
    contasBancarias,
    loading,
    formData,
    openModal,
    openDeleteModal,
    selectedId,
    searchQuery,
    handleInputChange,
    handleOpenModal,
    handleCloseModal,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleSave,
    handleDelete,
    handleExportCSV,
    handleExportPDF,
    handleSearchChange,
  } = useContasBancarias();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Bancárias"
        description="Gerencie as contas bancárias do sistema."
        buttonLabel="Nova Conta Bancária"
        onButtonClick={() => handleOpenModal()}
      />
      
      <ContasBancariasSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />
      
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

export default ContasBancarias;
