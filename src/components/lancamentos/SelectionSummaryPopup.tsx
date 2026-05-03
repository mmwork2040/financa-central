import React, { useState } from "react";
import { formatCurrency } from "@/utils/format";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lanc {
  id?: string;
  tipo: string;
  valor: number;
  descricao: string;
}

interface Props {
  selected: Lanc[];
  onClear: () => void;
}

export const SelectionSummaryPopup: React.FC<Props> = ({ selected, onClear }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (selected.length === 0) return null;

  const receitas = selected.filter((l) => l.tipo === "receita");
  const despesas = selected.filter((l) => l.tipo === "despesa");
  const investimentos = selected.filter((l) => l.tipo === "investimento");

  const totalReceitas = receitas.reduce((s, l) => s + l.valor, 0);
  const totalDespesas = despesas.reduce((s, l) => s + l.valor, 0);
  const totalInvest = investimentos.reduce((s, l) => s + l.valor, 0);
  const saldo = totalReceitas - totalDespesas - totalInvest;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="glass-surface rounded-2xl border border-primary/30 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
          <div className="flex items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5">
              {selected.length}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {selected.length === 1 ? "Selecionado" : "Selecionados"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed((v) => !v)}>
              {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} title="Limpar seleção">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!collapsed && (
          <div className="p-3 space-y-2">
            {receitas.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-foreground">Receitas ({receitas.length})</span>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalReceitas)}
                </span>
              </div>
            )}
            {despesas.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-rose-500/10 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                  <span className="text-foreground">Despesas ({despesas.length})</span>
                </div>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalDespesas)}
                </span>
              </div>
            )}
            {investimentos.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-foreground">Investimentos ({investimentos.length})</span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalInvest)}
                </span>
              </div>
            )}
            {(receitas.length > 0 && (despesas.length > 0 || investimentos.length > 0)) && (
              <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 border-t border-primary/20 mt-1">
                <span className="text-sm font-semibold text-foreground">Saldo líquido</span>
                <span className={`text-sm font-bold ${saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatCurrency(saldo)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
