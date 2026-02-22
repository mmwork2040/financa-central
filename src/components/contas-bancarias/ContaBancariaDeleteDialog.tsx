
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ContaBancariaDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const ContaBancariaDeleteDialog: React.FC<ContaBancariaDeleteDialogProps> = ({
  open,
  onClose,
  onDelete,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir esta conta bancária? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Excluindo...</> : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContaBancariaDeleteDialog;
