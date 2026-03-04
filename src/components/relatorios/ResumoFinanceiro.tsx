
import React from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

interface ResumoFinanceiroProps {
  totalReceitas: number;
  totalDespesas: number;
  receitasExecutadas?: number;
  receitasPrevistas?: number;
  despesasExecutadas?: number;
  despesasPrevistas?: number;
}

const ResumoFinanceiro: React.FC<ResumoFinanceiroProps> = ({
  totalReceitas, totalDespesas,
  receitasExecutadas = 0, receitasPrevistas = 0,
  despesasExecutadas = 0, despesasPrevistas = 0,
}) => {
  const { visible } = useValuesVisibility();
  const display = (val: number) => visible ? formatCurrency(val) : "••••••";
  const saldo = totalReceitas - totalDespesas;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
        <CardDescription>Receitas e despesas no período (executadas + previstas)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Receitas */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Receitas Confirmadas</span>
              <span className="font-bold text-green-600">{display(receitasExecutadas)}</span>
            </div>
            {receitasPrevistas > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  Receitas Previstas
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-400 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">Previsto</Badge>
                </span>
                <span className="font-medium text-green-500/70">{display(receitasPrevistas)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-semibold">Total Receitas</span>
              <span className="font-bold text-green-600">{display(totalReceitas)}</span>
            </div>
          </div>

          {/* Despesas */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Despesas Confirmadas</span>
              <span className="font-bold text-destructive">{display(despesasExecutadas)}</span>
            </div>
            {despesasPrevistas > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  Despesas Previstas
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-400 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">Previsto</Badge>
                </span>
                <span className="font-medium text-destructive/70">{display(despesasPrevistas)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-semibold">Total Despesas</span>
              <span className="font-bold text-destructive">{display(totalDespesas)}</span>
            </div>
          </div>

          {/* Saldo */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-medium">Saldo</span>
            <span className={`font-bold text-lg ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {display(saldo)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumoFinanceiro;
