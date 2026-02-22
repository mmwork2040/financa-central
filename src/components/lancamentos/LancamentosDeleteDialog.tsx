
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { Link2, User, Loader2 } from "lucide-react";

export const LancamentosDeleteDialog = () => {
  const { openDeleteModal, setOpenDeleteModal, handleDelete, lancamentos } = useLancamentosContext();
  const { selectedId } = useLancamentosContext();
  const [deleting, setDeleting] = useState(false);

  const lancamento = lancamentos.find(l => l.id === selectedId);
  const isIntegracao = lancamento?.origem === "integracao";
  const clienteNome = lancamento?.cliente?.nome;

  const onDelete = async () => {
    setDeleting(true);
    try {
      await handleDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {(isIntegracao || clienteNome) && (
          <div className="space-y-2 text-sm">
            {isIntegracao && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Link2 className="h-4 w-4" />
                <span>Origem:</span>
                <Badge variant="outline" className="text-xs">Via Integração / Webhook</Badge>
              </div>
            )}
            {clienteNome && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Cliente vinculado:</span>
                <span className="font-medium text-foreground">{clienteNome}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenDeleteModal(false)} disabled={deleting}>Cancelar</Button>
          <Button variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Excluindo...</> : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
