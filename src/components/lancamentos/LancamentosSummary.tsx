
import React from "react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from "lucide-react";

export const LancamentosSummary = () => {
  const { lancamentos } = useLancamentosContext();
  const { visible } = useValuesVisibility();

  const totalReceitas = lancamentos
    .filter(l => l.tipo === "receita")
    .reduce((sum, item) => sum + item.valor, 0);

  const totalDespesas = lancamentos
    .filter(l => l.tipo === "despesa")
    .reduce((sum, item) => sum + item.valor, 0);

  const totalInvestimentos = lancamentos
    .filter(l => l.tipo === "investimento")
    .reduce((sum, item) => sum + item.valor, 0);

  const saldo = totalReceitas - totalDespesas - totalInvestimentos;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <SummaryCard
        title="Total Receitas"
        value={formatCurrency(totalReceitas)}
        description={`${lancamentos.filter(l => l.tipo === "receita").length} lançamentos`}
        icon={ArrowUpRight}
        iconColor="text-green-500"
        isCurrency
      />
      <SummaryCard
        title="Total Despesas"
        value={formatCurrency(totalDespesas)}
        description={`${lancamentos.filter(l => l.tipo === "despesa").length} lançamentos`}
        icon={ArrowDownRight}
        iconColor="text-red-500"
        isCurrency
      />
      <SummaryCard
        title="Investimentos"
        value={formatCurrency(totalInvestimentos)}
        description={`${lancamentos.filter(l => l.tipo === "investimento").length} lançamentos`}
        icon={TrendingUp}
        iconColor="text-blue-500"
        isCurrency
      />
      <SummaryCard
        title="Saldo"
        value={formatCurrency(saldo)}
        description={`${lancamentos.length} lançamentos no total`}
        icon={Wallet}
        iconColor={saldo >= 0 ? "text-green-500" : "text-red-500"}
        isCurrency
      />
    </div>
  );
};
