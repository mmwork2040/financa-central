
import React, { useState } from "react";
import { Fornecedor } from "@/types/fornecedor.types";
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
import { Loader2 } from "lucide-react";

interface DeleteFornecedorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor: Fornecedor;
  onDelete: () => void;
}

const DeleteFornecedorDialog: React.FC<DeleteFornecedorDialogProps> = ({
  isOpen,
  onOpenChange,
  fornecedor,
  onDelete,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o fornecedor "{fornecedor.nome}"?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
            {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Excluindo...</> : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteFornecedorDialog;
