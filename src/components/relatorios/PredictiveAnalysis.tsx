
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PredictiveAnalysisProps {
  historicalData: { name: string; receitas: number; despesas: number }[];
  pendingReceitas: number;
  pendingDespesas: number;
  saldoAtual: number;
}

const PredictiveAnalysis: React.FC<PredictiveAnalysisProps> = ({
  historicalData,
  pendingReceitas,
  pendingDespesas,
  saldoAtual,
}) => {
  // Simple prediction: average of last periods projected forward
  const avgReceita = historicalData.length > 0
    ? historicalData.reduce((s, d) => s + d.receitas, 0) / historicalData.length
    : 0;
  const avgDespesa = historicalData.length > 0
    ? historicalData.reduce((s, d) => s + d.despesas, 0) / historicalData.length
    : 0;

  const projectedSaldo = saldoAtual + pendingReceitas - pendingDespesas;
  const tendencia = avgReceita - avgDespesa;

  // Generate 3-month projection
  const projectionData = [];
  let runningBalance = saldoAtual;
  const months = ["Mês 1", "Mês 2", "Mês 3"];
  
  for (const month of months) {
    runningBalance += avgReceita - avgDespesa;
    projectionData.push({
      name: month,
      "Projeção": Math.max(0, runningBalance),
    });
  }

  const insights = [];
  
  if (projectedSaldo < 0) {
    insights.push({ type: "danger" as const, text: `Saldo projetado negativo: ${formatCurrency(projectedSaldo)}. Revise suas despesas pendentes.` });
  } else if (projectedSaldo < saldoAtual * 0.3) {
    insights.push({ type: "warning" as const, text: `Saldo pode cair para ${formatCurrency(projectedSaldo)} após compromissos pendentes.` });
  } else {
    insights.push({ type: "success" as const, text: `Saldo saudável projetado: ${formatCurrency(projectedSaldo)}` });
  }

  if (tendencia > 0) {
    insights.push({ type: "success" as const, text: `Tendência positiva: +${formatCurrency(tendencia)}/período em média.` });
  } else if (tendencia < 0) {
    insights.push({ type: "warning" as const, text: `Despesas superam receitas em ${formatCurrency(Math.abs(tendencia))}/período em média.` });
  }

  if (pendingDespesas > pendingReceitas * 1.5) {
    insights.push({ type: "danger" as const, text: "Despesas pendentes são significativamente maiores que receitas pendentes." });
  }

  const iconMap = {
    danger: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />,
    warning: <TrendingDown className="h-4 w-4 text-amber-500 shrink-0" />,
    success: <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Análise Preditiva
        </CardTitle>
        <CardDescription>Projeção baseada no histórico financeiro</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights */}
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {iconMap[insight.type]}
              <span className="text-muted-foreground">{insight.text}</span>
            </div>
          ))}
        </div>

        {/* Projection Chart */}
        {projectionData.length > 0 && avgReceita + avgDespesa > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Projeção de saldo (3 meses)</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="Projeção" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">A receber (pendente)</p>
            <p className="text-sm font-semibold text-green-600">{formatCurrency(pendingReceitas)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">A pagar (pendente)</p>
            <p className="text-sm font-semibold text-red-600">{formatCurrency(pendingDespesas)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalysis;
