
import React from "react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

export const LancamentosSummary = () => {
  const { lancamentos } = useLancamentosContext();
  const { visible } = useValuesVisibility();

  const totalReceitas = lancamentos
    .filter(l => l.tipo === "receita")
    .reduce((sum, item) => sum + item.valor, 0);
    
  const totalDespesas = lancamentos
    .filter(l => l.tipo === "despesa")
    .reduce((sum, item) => sum + item.valor, 0);

  const display = (val: number) => visible ? formatCurrency(val) : "••••••";

  return (
    <div className="flex flex-wrap justify-between items-center gap-2">
      <p className="text-sm text-muted-foreground">
        Total: {lancamentos.length} lançamentos
      </p>
      <div className="text-sm flex flex-wrap gap-4">
        <span>
          <strong>Total Receitas:</strong> {display(totalReceitas)}
        </span>
        <span>
          <strong>Total Despesas:</strong> {display(totalDespesas)}
        </span>
      </div>
    </div>
  );
};
