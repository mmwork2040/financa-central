
import React from "react";
import { ArrowUpRight, ArrowDownRight, CreditCard, AlertCircle, TrendingUp, Eye, EyeOff, Clock } from "lucide-react";
import SummaryCard from "./SummaryCard";
import { Button } from "@/components/ui/button";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

interface DashboardSummaryProps {
  summary: {
    totalReceitas: number;
    totalDespesas: number;
    totalInvestimentos: number;
    receitasPrevistas: number;
    vencendoHoje: number;
    emAtraso: number;
  };
  formatCurrency: (value: number | null) => string;
}

export const DashboardSummary = ({ summary, formatCurrency }: DashboardSummaryProps) => {
  const { visible, toggle } = useValuesVisibility();

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={toggle} className="gap-2 text-muted-foreground">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {visible ? "Ocultar valores" : "Exibir valores"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard 
          title="Total de Receitas"
          value={formatCurrency(summary.totalReceitas)}
          description="+20.1% em relação ao mês anterior"
          icon={ArrowUpRight}
          iconColor="text-green-500"
          isCurrency
        />
        <SummaryCard 
          title="Total de Despesas"
          value={formatCurrency(summary.totalDespesas)}
          description="+4.5% em relação ao mês anterior"
          icon={ArrowDownRight}
          iconColor="text-red-500"
          isCurrency
        />
        <SummaryCard 
          title="Receita Pendente"
          value={formatCurrency(summary.receitasPrevistas)}
          description="Receitas a receber"
          icon={Clock}
          iconColor="text-amber-500"
          isCurrency
        />
        <SummaryCard 
          title="Investimentos"
          value={formatCurrency(summary.totalInvestimentos)}
          description="Total investido"
          icon={TrendingUp}
          iconColor="text-blue-500"
          isCurrency
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
    </div>
  );
};

export default DashboardSummary;
