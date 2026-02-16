
import React from "react";
import { ArrowUpRight, ArrowDownRight, CreditCard, AlertCircle, TrendingUp } from "lucide-react";
import SummaryCard from "./SummaryCard";

interface DashboardSummaryProps {
  summary: {
    totalReceitas: number;
    totalDespesas: number;
    totalInvestimentos: number;
    vencendoHoje: number;
    emAtraso: number;
  };
  formatCurrency: (value: number | null) => string;
}

export const DashboardSummary = ({ summary, formatCurrency }: DashboardSummaryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <SummaryCard 
        title="Total de Receitas"
        value={formatCurrency(summary.totalReceitas)}
        description="+20.1% em relação ao mês anterior"
        icon={ArrowUpRight}
        iconColor="text-green-500"
      />
      
      <SummaryCard 
        title="Total de Despesas"
        value={formatCurrency(summary.totalDespesas)}
        description="+4.5% em relação ao mês anterior"
        icon={ArrowDownRight}
        iconColor="text-red-500"
      />

      <SummaryCard 
        title="Investimentos"
        value={formatCurrency(summary.totalInvestimentos)}
        description="Total investido"
        icon={TrendingUp}
        iconColor="text-blue-500"
      />
      
      <SummaryCard 
        title="Vencendo Hoje"
        value={summary.vencendoHoje}
        description="Lançamentos a vencer hoje"
        icon={CreditCard}
        iconColor="text-amber-500"
      />
      
      <SummaryCard 
        title="Em Atraso"
        value={summary.emAtraso}
        description="Lançamentos vencidos"
        icon={AlertCircle}
        iconColor="text-red-500"
      />
    </div>
  );
};

export default DashboardSummary;
