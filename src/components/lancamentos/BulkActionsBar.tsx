
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BulkActionsBarProps {
  selectedCount: number;
  totalValue: number;
  onBulkPay: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  loading?: boolean;
}

export const BulkActionsBar = ({
  selectedCount,
  totalValue,
  onBulkPay,
  onBulkDelete,
  onClearSelection,
  loading,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
      <span className="text-sm font-medium text-foreground">
        {selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"} · Total: <strong>{formatCurrency(totalValue)}</strong>
      </span>
      <div className="flex items-center gap-1.5 ml-auto">
        <AlertDialog>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="default" disabled={loading}>
                    <Check className="mr-1.5 h-4 w-4" />
                    Dar baixa
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent><p>Confirmar pagamento/recebimento em massa</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar baixa em massa</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja dar baixa em <strong>{selectedCount}</strong> {selectedCount === 1 ? "lançamento" : "lançamentos"} pendente{selectedCount > 1 ? "s" : ""}?
                <br />
                Valor total: <strong>{formatCurrency(totalValue)}</strong>
                <br /><br />
                Os lançamentos de receita serão marcados como "Recebido" e os de despesa/investimento como "Pago".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onBulkPay}>Confirmar baixa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={loading}>
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent><p>Excluir lançamentos selecionados</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja excluir <strong>{selectedCount}</strong> {selectedCount === 1 ? "lançamento" : "lançamentos"}?
                <br />
                Valor total: <strong>{formatCurrency(totalValue)}</strong>
                <br /><br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir todos</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onClearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Limpar seleção</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
