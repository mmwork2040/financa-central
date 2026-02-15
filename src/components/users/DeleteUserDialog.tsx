
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export const DeleteUserDialog = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Confirmar Exclusão",
  description = "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
  confirmLabel = "Excluir",
}: DeleteUserDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
