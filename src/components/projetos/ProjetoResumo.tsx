import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, DollarSign, Target, Receipt,
  Clock, CalendarDays, Percent, PiggyBank
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Projeto } from "@/hooks/useProjetos";

interface Lancamento {
  tipo: string;
  valor: number;
  data_vencimento: string;
  status: string;
}

interface LancamentoSummary {
  receitasRealizadas: number;
  despesasRealizadas: number;
  receitasPendentes: number;
  despesasPendentes: number;
}

interface Props {
  projeto: Projeto;
  summary: LancamentoSummary;
  lancamentos: Lancamento[];
}

export const ProjetoResumo = ({ projeto, summary, lancamentos }: Props) => {
  const { visible } = useValuesVisibility();
  const display = (val: number) => (visible ? formatCurrency(val) : "••••••");

  const lucro = summary.receitasRealizadas - summary.despesasRealizadas;
  const impostoBase = projeto.imposto_base === "receita" ? summary.receitasRealizadas : Math.max(lucro, 0);
  const imposto = (Number(projeto.imposto_percentual) / 100) * impostoBase;
  const lucroLiquido = lucro - imposto;
  const totalPendente = summary.receitasPendentes - summary.despesasPendentes;

  const cards = [
    { label: "Investimento Previsto", value: projeto.investimento_previsto, icon: Target, color: "text-blue-600" },
    { label: "Despesa Prevista", value: projeto.despesa_prevista, icon: Receipt, color: "text-orange-600" },
    { label: "Receitas Realizadas", value: summary.receitasRealizadas, icon: TrendingUp, color: "text-primary" },
    { label: "Despesas Realizadas", value: summary.despesasRealizadas, icon: TrendingDown, color: "text-destructive" },
    { label: "Lucro Projetado", value: lucro, icon: DollarSign, color: lucro >= 0 ? "text-primary" : "text-destructive" },
    { label: `Imposto (${projeto.imposto_percentual}% s/ ${projeto.imposto_base === "receita" ? "receita" : "lucro"})`, value: imposto, icon: Percent, color: "text-amber-600" },
    { label: "Lucro Líquido", value: lucroLiquido, icon: PiggyBank, color: lucroLiquido >= 0 ? "text-primary" : "text-destructive" },
    { label: "Saldo Pendente", value: totalPendente, icon: Clock, color: "text-muted-foreground" },
  ];

  const chartData = useMemo(() => {
    const monthMap: Record<string, { receitas: number; despesas: number }> = {};
    for (const l of lancamentos) {
      if (!l.data_vencimento) continue;
      const key = l.data_vencimento.substring(0, 7); // yyyy-MM
      if (!monthMap[key]) monthMap[key] = { receitas: 0, despesas: 0 };
      if (l.tipo === "receita") monthMap[key].receitas += Number(l.valor) || 0;
      else if (l.tipo === "despesa") monthMap[key].despesas += Number(l.valor) || 0;
    }
    return Object.keys(monthMap)
      .sort()
      .map((key) => ({
        name: format(parseISO(key + "-01"), "MMM/yy", { locale: ptBR }),
        receitas: monthMap[key].receitas,
        despesas: monthMap[key].despesas,
      }));
  }, [lancamentos]);

  return (
    <div className="space-y-6">
      {(projeto.data_inicio || projeto.data_fim) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            {projeto.data_inicio ? format(new Date(projeto.data_inicio + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
            {" → "}
            {projeto.data_fim ? format(new Date(projeto.data_fim + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
              <p className={`text-lg font-semibold ${c.color}`}>{display(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Mensal</CardTitle>
            <CardDescription>Receitas vs Despesas por mês</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => formatCurrency(v).split(",")[0]} />
                <Tooltip formatter={(value) => (visible ? formatCurrency(Number(value)) : "••••••")} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
