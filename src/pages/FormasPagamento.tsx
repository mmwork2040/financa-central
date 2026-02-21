
import React, { useState } from "react";
import { useFormasPagamento, FormaPagamento } from "@/hooks/useFormasPagamento";
import { CreditCard } from "lucide-react";
import FormasPagamentoSearch from "@/components/formas-pagamento/FormasPagamentoSearch";
import FormasPagamentoTable from "@/components/formas-pagamento/FormasPagamentoTable";
import FormaPagamentoForm from "@/components/formas-pagamento/FormaPagamentoForm";
import DeleteConfirmationDialog from "@/components/formas-pagamento/DeleteConfirmationDialog";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/contexts/AuthContext";

const FormasPagamento = () => {
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("formas_pagamento", "pode_incluir");
  const canAlterar = canPerformAction("formas_pagamento", "pode_alterar");
  const canExcluir = canPerformAction("formas_pagamento", "pode_excluir");

  const {
    loading,
    formasPagamento,
    searchQuery,
    handleSearch,
    saveFormaPagamento,
    deleteFormaPagamento,
    exportData
  } = useFormasPagamento();

  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [formData, setFormData] = useState<{ descricao: string }>({ descricao: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({ descricao: "" });
    setSelectedId(null);
  };

  const handleOpenModal = (forma?: FormaPagamento) => {
    if (forma) {
      setFormData({ descricao: forma.descricao });
      setSelectedId(forma.id);
    } else {
      resetForm();
    }
    setOpenModal(true);
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedId(id);
    setOpenDeleteModal(true);
  };

  const handleSave = async () => {
    const success = await saveFormaPagamento(formData.descricao, selectedId || undefined);
    if (success) {
      setOpenModal(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    
    const success = await deleteFormaPagamento(selectedId);
    if (success) {
      setOpenDeleteModal(false);
      setSelectedId(null);
    }
  };

  const handleInputChange = (value: string) => {
    setFormData({ ...formData, descricao: value });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formas de Pagamento"
        description="Gerencie as formas de pagamento do sistema."
        buttonLabel="Nova Forma de Pagamento" 
        onButtonClick={() => handleOpenModal()}
        showButton={canIncluir}
        icon={CreditCard}
      />
      
      <FormasPagamentoSearch 
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onExport={exportData}
      />
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando formas de pagamento...</p>
        </div>
      ) : formasPagamento.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhuma forma de pagamento encontrada</p>
        </div>
      ) : (
        <FormasPagamentoTable 
          formasPagamento={formasPagamento}
          onEdit={handleOpenModal}
          onDelete={handleOpenDeleteModal}
          canEdit={canAlterar}
          canDelete={canExcluir}
        />
      )}
      
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Total de registros: {formasPagamento.length}
        </p>
      </div>

      <FormaPagamentoForm 
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        descricao={formData.descricao}
        onDescricaoChange={handleInputChange}
        onSave={handleSave}
        isEditing={!!selectedId}
      />

      <DeleteConfirmationDialog 
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default FormasPagamento;
