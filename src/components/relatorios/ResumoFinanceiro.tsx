
import React from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

interface ResumoFinanceiroProps {
  totalReceitas: number;
  totalDespesas: number;
}

const ResumoFinanceiro: React.FC<ResumoFinanceiroProps> = ({ totalReceitas, totalDespesas }) => {
  const { visible } = useValuesVisibility();
  const display = (val: number) => visible ? formatCurrency(val) : "••••••";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
        <CardDescription>Total de receitas e despesas no período</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total de Receitas</span>
            <span className="font-bold text-primary">{display(totalReceitas)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total de Despesas</span>
            <span className="font-bold text-destructive">{display(totalDespesas)}</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Saldo</span>
              <span className={`font-bold text-lg ${totalReceitas - totalDespesas >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {display(totalReceitas - totalDespesas)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumoFinanceiro;
