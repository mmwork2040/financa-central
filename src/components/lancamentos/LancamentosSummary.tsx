
import React from "react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Clock } from "lucide-react";

export const LancamentosSummary = () => {
  const { lancamentos } = useLancamentosContext();
  const { visible } = useValuesVisibility();

  const receitasExecutadas = lancamentos
    .filter(l => l.tipo === "receita" && (l.status === "pago" || l.status === "recebido"))
    .reduce((sum, item) => sum + item.valor, 0);

  const despesasExecutadas = lancamentos
    .filter(l => l.tipo === "despesa" && l.status === "pago")
    .reduce((sum, item) => sum + item.valor, 0);

  const receitasPrevistas = lancamentos
    .filter(l => l.tipo === "receita" && l.status === "pendente")
    .reduce((sum, item) => sum + item.valor, 0);

  const despesasPrevistas = lancamentos
    .filter(l => l.tipo === "despesa" && l.status === "pendente")
    .reduce((sum, item) => sum + item.valor, 0);

  const countExecReceitas = lancamentos.filter(l => l.tipo === "receita" && (l.status === "pago" || l.status === "recebido")).length;
  const countExecDespesas = lancamentos.filter(l => l.tipo === "despesa" && l.status === "pago").length;
  const countPrevReceitas = lancamentos.filter(l => l.tipo === "receita" && l.status === "pendente").length;
  const countPrevDespesas = lancamentos.filter(l => l.tipo === "despesa" && l.status === "pendente").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <SummaryCard
        title="Receitas Executadas"
        value={formatCurrency(receitasExecutadas)}
        description={`${countExecReceitas} recebidos`}
        icon={CheckCircle2}
        iconColor="text-primary"
        isCurrency
      />
      <SummaryCard
        title="Despesas Executadas"
        value={formatCurrency(despesasExecutadas)}
        description={`${countExecDespesas} pagos`}
        icon={CheckCircle2}
        iconColor="text-destructive"
        isCurrency
      />
      <SummaryCard
        title="Receitas Previstas"
        value={formatCurrency(receitasPrevistas)}
        description={`${countPrevReceitas} pendentes`}
        icon={Clock}
        iconColor="text-amber-500"
        isCurrency
      />
      <SummaryCard
        title="Despesas Previstas"
        value={formatCurrency(despesasPrevistas)}
        description={`${countPrevDespesas} pendentes`}
        icon={Clock}
        iconColor="text-amber-500"
        isCurrency
      />
    </div>
  );
};
