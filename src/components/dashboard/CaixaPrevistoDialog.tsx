import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { ArrowUpRight, ArrowDownRight, Landmark, TrendingUp, Equal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface CaixaPrevistoItem {
  id: string;
  descricao: string;
  tipo: string;
  valor: number;
  data_vencimento: string;
  status: string;
}

interface CaixaPrevistoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caixaAtual: number;
  receitasPendentes: number;
  despesasPendentes: number;
  caixaPrevisto: number;
  itens: CaixaPrevistoItem[];
}

export const CaixaPrevistoDialog = ({
  open,
  onOpenChange,
  caixaAtual,
  receitasPendentes,
  despesasPendentes,
  caixaPrevisto,
  itens,
}: CaixaPrevistoDialogProps) => {
  const { visible } = useValuesVisibility();

  const receitas = itens.filter(i => i.tipo === "receita");
  const despesas = itens.filter(i => i.tipo === "despesa");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Detalhes do Caixa Previsto
          </DialogTitle>
        </DialogHeader>

        {/* Formula summary */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Caixa Atual (saldo bancário)</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {maskValue(formatCurrency(caixaAtual), visible)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">+ Receitas pendentes ({receitas.length})</span>
            </div>
            <span className="text-sm font-semibold text-green-600">
              {maskValue(formatCurrency(receitasPendentes), visible)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">− Despesas pendentes ({despesas.length})</span>
            </div>
            <span className="text-sm font-semibold text-destructive">
              {maskValue(formatCurrency(despesasPendentes), visible)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Equal className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Caixa Previsto</span>
            </div>
            <span className={cn("text-base font-bold", caixaPrevisto >= 0 ? "text-primary" : "text-destructive")}>
              {maskValue(formatCurrency(caixaPrevisto), visible)}
            </span>
          </div>
        </div>

        {/* Receitas pendentes list */}
        {receitas.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
              Receitas Pendentes
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {receitas.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.descricao}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(item.data_vencimento)}</p>
                  </div>
                  <span className="text-sm font-medium text-green-600 shrink-0 ml-3">
                    +{maskValue(formatCurrency(item.valor), visible)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Despesas pendentes list */}
        {despesas.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              Despesas Pendentes
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {despesas.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.descricao}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(item.data_vencimento)}</p>
                  </div>
                  <span className="text-sm font-medium text-destructive shrink-0 ml-3">
                    −{maskValue(formatCurrency(item.valor), visible)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {itens.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum lançamento pendente acumulado até este mês.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
