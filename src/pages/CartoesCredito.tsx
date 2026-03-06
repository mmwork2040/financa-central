import React from "react";
import { useCartoesCredito } from "@/hooks/useCartoesCredito";
import { useAuth } from "@/contexts/AuthContext";
import { CartoesCreditoTable } from "@/components/cartoes-credito/CartoesCreditoTable";
import { CartaoCreditoFormDialog } from "@/components/cartoes-credito/CartaoCreditoForm";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CartoesCredito = () => {
  const { empresaId } = useAuth();
  const {
    cartoes,
    loading,
    formData,
    setFormData,
    editingId,
    openModal,
    setOpenModal,
    openDeleteModal,
    setOpenDeleteModal,
    openNew,
    openEdit,
    save,
    confirmDelete,
    handleDelete,
  } = useCartoesCredito();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões de Crédito"
        description="Gerencie seus cartões de crédito e controle suas faturas"
        icon={CreditCard}
        buttonLabel="Novo Cartão"
        onButtonClick={openNew}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <CartoesCreditoTable
          cartoes={cartoes}
          onEdit={openEdit}
          onDelete={confirmDelete}
        />
      )}

      <CartaoCreditoFormDialog
        open={openModal}
        onOpenChange={setOpenModal}
        formData={formData}
        setFormData={setFormData}
        onSave={() => empresaId && save(empresaId)}
        isEditing={!!editingId}
      />

      <AlertDialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cartão? Lançamentos vinculados perderão a referência ao cartão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CartoesCredito;
