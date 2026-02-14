
import React from "react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";

export const LancamentosSummary = () => {
  const { lancamentos } = useLancamentosContext();

  const totalReceitas = lancamentos
    .filter(l => l.tipo === "receita")
    .reduce((sum, item) => sum + item.valor, 0);
    
  const totalDespesas = lancamentos
    .filter(l => l.tipo === "despesa")
    .reduce((sum, item) => sum + item.valor, 0);

  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-muted-foreground">
        Total: {lancamentos.length} lançamentos
      </p>
      <div className="text-sm">
        <span className="mr-4">
          <strong>Total Receitas:</strong> {formatCurrency(totalReceitas)}
        </span>
        <span>
          <strong>Total Despesas:</strong> {formatCurrency(totalDespesas)}
        </span>
      </div>
    </div>
  );
};
