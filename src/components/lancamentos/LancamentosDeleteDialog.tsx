import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { Link2, User, Loader2, Repeat } from "lucide-react";

export const LancamentosDeleteDialog = () => {
  const { openDeleteModal, setOpenDeleteModal, handleDelete, lancamentos, selectedId } = useLancamentosContext();
  const [deleting, setDeleting] = useState(false);
  const [scope, setScope] = useState<"single" | "future">("single");

  const lancamento = lancamentos.find(l => l.id === selectedId);
  const isIntegracao = lancamento?.origem === "integracao";
  const clienteNome = lancamento?.cliente?.nome;
  const isSerie = !!lancamento?.recorrencia_grupo_id && (lancamento?.recorrente || (lancamento?.total_parcelas ?? 0) > 1);
  const isParcelado = (lancamento?.total_parcelas ?? 0) > 1 && !lancamento?.recorrente;

  useEffect(() => {
    if (openDeleteModal) setScope("single");
  }, [openDeleteModal, selectedId]);

  const onDelete = async () => {
    setDeleting(true);
    try {
      await handleDelete(scope);
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

        {isSerie && (
          <div className="space-y-2 rounded-md border p-3 bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Repeat className="h-4 w-4 text-primary" />
              {isParcelado ? "Este lançamento faz parte de um parcelamento" : "Este lançamento é recorrente"}
            </div>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as "single" | "future")} className="gap-2">
              <div className="flex items-start gap-2">
                <RadioGroupItem value="single" id="scope-single" className="mt-1" />
                <Label htmlFor="scope-single" className="font-normal cursor-pointer">
                  Excluir apenas este {isParcelado ? "lançamento (1 parcela)" : "mês"}
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="future" id="scope-future" className="mt-1" />
                <Label htmlFor="scope-future" className="font-normal cursor-pointer">
                  Excluir este e todos os próximos {isParcelado ? "(parcelas seguintes)" : "(meses seguintes)"}
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

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
            {isIntegracao && clienteNome && (
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                O cliente vinculado <strong>não será excluído</strong> junto com este lançamento.
              </p>
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
