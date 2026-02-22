
import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Ban } from "lucide-react";

interface SupportDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  onCancel?: () => Promise<boolean>;
  recordName: string;
  isPending?: boolean;
}

const SupportDeleteDialog: React.FC<SupportDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  recordName,
  isPending = false,
}) => {
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(motivo);
      setMotivo("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setCancelling(true);
    try {
      const success = await onCancel();
      if (success) onClose();
    } finally {
      setCancelling(false);
    }
  };

  if (isPending) {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitação em andamento</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe uma solicitação de exclusão pendente para "{recordName}". 
              Aguarde o retorno da equipe de suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {onCancel && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelando...</>
                ) : (
                  <><Ban className="h-4 w-4 mr-2" /> Cancelar Solicitação</>
                )}
              </Button>
            )}
            <AlertDialogCancel disabled={cancelling}>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Solicitar exclusão ao suporte</AlertDialogTitle>
          <AlertDialogDescription>
            Este registro foi cadastrado automaticamente via integração. 
            Ao confirmar, uma notificação será enviada à equipe de suporte. 
            Quando a solicitação for atendida, o registro será excluído automaticamente. 
            Basta atualizar a página para confirmar a exclusão de "{recordName}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="motivo">Motivo (opcional)</Label>
          <Textarea
            id="motivo"
            placeholder="Descreva o motivo da exclusão..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="mt-1"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirm(); }}
            disabled={submitting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
            ) : (
              "Solicitar Exclusão"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SupportDeleteDialog;
