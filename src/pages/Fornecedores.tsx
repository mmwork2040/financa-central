
import React from "react";
import { useFornecedores } from "@/hooks/useFornecedores";
import { Truck } from "lucide-react";
import { FormModal } from "@/components/modals/FormModal";
import PageHeader from "@/components/common/PageHeader";
import FornecedorForm from "@/components/fornecedores/FornecedorForm";
import FornecedoresActions from "@/components/fornecedores/FornecedoresActions";
import FornecedoresTable from "@/components/fornecedores/FornecedoresTable";
import DeleteFornecedorDialog from "@/components/fornecedores/DeleteFornecedorDialog";
import { useAuth } from "@/contexts/AuthContext";

const Fornecedores = () => {
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("fornecedores", "pode_incluir");
  const canAlterar = canPerformAction("fornecedores", "pode_alterar");
  const canExcluir = canPerformAction("fornecedores", "pode_excluir");

  const {
    fornecedores,
    currentFornecedor,
    loading,
    isSaving,
    isModalOpen,
    isDeleteDialogOpen,
    searchQuery,
    setSearchQuery,
    openModal,
    confirmDelete,
    handleInputChange,
    handleCheckboxChange,
    handleSubmit,
    handleDelete,
    setIsModalOpen,
    setIsDeleteDialogOpen,
    handleExportCSV,
    handleExportPDF,
    cpfCnpjInput,
    telefoneInput
  } = useFornecedores();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fornecedores"
        description="Gerencie os fornecedores do sistema."
        buttonLabel="Novo Fornecedor"
        onButtonClick={() => openModal()}
        showButton={canIncluir}
        icon={Truck}
      />

      <FornecedoresActions 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
      ) : fornecedores.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
        </div>
      ) : (
        <FornecedoresTable 
          fornecedores={fornecedores}
          onEdit={openModal}
          onDelete={confirmDelete}
          canEdit={canAlterar}
          canDelete={canExcluir}
        />
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {fornecedores.length} fornecedores
        </p>
      </div>

      {/* Modal de Cadastro/Edição */}
      <FormModal
        title={currentFornecedor.id ? "Editar Fornecedor" : "Novo Fornecedor"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={isSaving}
      >
        <FornecedorForm
          currentFornecedor={currentFornecedor}
          handleInputChange={handleInputChange}
          handleCheckboxChange={handleCheckboxChange}
          cpfCnpjInput={cpfCnpjInput}
          telefoneInput={telefoneInput}
        />
      </FormModal>

      {/* Dialog de Confirmação de Exclusão */}
      <DeleteFornecedorDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        fornecedor={currentFornecedor}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Fornecedores;
