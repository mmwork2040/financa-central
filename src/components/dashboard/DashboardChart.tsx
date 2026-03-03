
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/formatters";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";

interface DashboardChartProps {
  data: Array<{
    name: string;
    receitas: number;
    despesas: number;
    investimentos: number;
  }>;
  saldoAtual: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl border bg-card p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardChart = ({ data, saldoAtual }: DashboardChartProps) => {
  const { visible } = useValuesVisibility();

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="text-sm text-muted-foreground">Saldo atual</p>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {maskValue(formatCurrency(saldoAtual), visible)}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Visão geral do balanço</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(142,71%,45%)]" />
            Receitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(0,84%,60%)]" />
            Despesas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(217,91%,60%)]" />
            Investimentos
          </span>
        </div>
      </CardHeader>
      <CardContent className="h-[280px] sm:h-[320px] px-1 sm:px-4">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Não há dados disponíveis</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barGap={2} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                  return String(v);
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
              <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="investimentos" name="Investimentos" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardChart;
