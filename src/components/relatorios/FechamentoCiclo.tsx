
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useRelatoriosData } from "@/hooks/useRelatoriosData";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths } from "date-fns";

const formatCurrency = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const maskValue = (text: string, visible: boolean) => (visible ? text : "••••••");

type Ciclo = "mes_atual" | "trimestre_atual" | "semestre_atual" | "ano_atual";

function getCycleDates(ciclo: Ciclo) {
  const hoje = new Date();
  switch (ciclo) {
    case "mes_atual":
      return { start: startOfMonth(hoje), end: endOfMonth(hoje) };
    case "trimestre_atual":
      return { start: startOfQuarter(hoje), end: endOfQuarter(hoje) };
    case "semestre_atual": {
      const mesAtual = hoje.getMonth();
      const inicioSem = mesAtual < 6 ? new Date(hoje.getFullYear(), 0, 1) : new Date(hoje.getFullYear(), 6, 1);
      const fimSem = mesAtual < 6 ? new Date(hoje.getFullYear(), 5, 30) : new Date(hoje.getFullYear(), 11, 31);
      return { start: inicioSem, end: fimSem };
    }
    case "ano_atual":
      return { start: startOfYear(hoje), end: endOfYear(hoje) };
  }
}

const FechamentoCiclo: React.FC = () => {
  const { visible } = useValuesVisibility();
  const [ciclo, setCiclo] = useState<Ciclo>("mes_atual");

  const { start, end } = getCycleDates(ciclo);
  const { loading, dataReceitas, dataDespesas, dataFluxo, topReceitas, topDespesas } = useRelatoriosData(
    "personalizado",
    start,
    end
  );

  const totalReceitas = dataFluxo.reduce((s, i) => s + i.receitas, 0);
  const totalDespesas = dataFluxo.reduce((s, i) => s + i.despesas, 0);
  const saldo = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? ((saldo / totalReceitas) * 100) : 0;
  const totalLancamentos = dataReceitas.reduce((s, i) => s + i.value, 0) + dataDespesas.reduce((s, i) => s + i.value, 0);
  const qtdCategorias = dataReceitas.length + dataDespesas.length;

  const comparativoData = [
    { name: "Receitas", valor: totalReceitas },
    { name: "Despesas", valor: totalDespesas },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Fechamento de Ciclo</h2>
          <p className="text-sm text-muted-foreground">Análise detalhada do período selecionado</p>
        </div>
        <Select value={ciclo} onValueChange={(v) => setCiclo(v as Ciclo)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes_atual">Mês atual</SelectItem>
            <SelectItem value="trimestre_atual">Trimestre atual</SelectItem>
            <SelectItem value="semestre_atual">Semestre atual</SelectItem>
            <SelectItem value="ano_atual">Ano atual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  Total Receitas
                </div>
                <p className="text-lg font-bold text-emerald-600">{maskValue(formatCurrency(totalReceitas), visible)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  Total Despesas
                </div>
                <p className="text-lg font-bold text-red-600">{maskValue(formatCurrency(totalDespesas), visible)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Saldo
                </div>
                <p className={`text-lg font-bold ${saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {maskValue(formatCurrency(saldo), visible)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Percent className="h-4 w-4 text-primary" />
                  Margem Líquida
                </div>
                <p className={`text-lg font-bold ${margem >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {maskValue(`${margem.toFixed(1)}%`, visible)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Categories */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Top 5 Despesas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topDespesas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados no período</p>
                ) : (
                  topDespesas.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">
                          {maskValue(formatCurrency(item.value), visible)} ({item.percent.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={item.percent} className="h-2 [&>div]:bg-red-500" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Top 5 Receitas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topReceitas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados no período</p>
                ) : (
                  topReceitas.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">
                          {maskValue(formatCurrency(item.value), visible)} ({item.percent.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={item.percent} className="h-2 [&>div]:bg-emerald-500" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparativo Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Comparativo Receitas vs Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativoData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                      <Cell fill="hsl(var(--chart-2))" />
                      <Cell fill="hsl(var(--chart-1))" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FechamentoCiclo;
