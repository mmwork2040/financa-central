import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ExitRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  empresaNome: string;
  onConfirm: (motivo?: string) => Promise<boolean>;
  loading?: boolean;
}

export const ExitRequestDialog = ({
  isOpen,
  onClose,
  empresaNome,
  onConfirm,
  loading,
}: ExitRequestDialogProps) => {
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    const success = await onConfirm(motivo.trim() || undefined);
    if (success) {
      setMotivo("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Saída</DialogTitle>
          <DialogDescription>
            Você está solicitando sair da empresa <strong>{empresaNome}</strong>. 
            Um administrador precisará aprovar seu pedido. Se não houver resposta em 7 dias, 
            a saída será aprovada automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo (opcional)</Label>
          <Textarea
            id="motivo"
            placeholder="Descreva o motivo da saída..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Enviando..." : "Solicitar Saída"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
