import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";

interface DonutChartProps {
  receitas: number;
  despesas: number;
  saldo: number;
}

const COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(0, 84%, 60%)",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-2 shadow-lg text-xs">
      <span className="font-medium">{payload[0].name}: </span>
      <span>{formatCurrency(payload[0].value)}</span>
    </div>
  );
};

export const DashboardDonutChart = ({ receitas, despesas, saldo }: DonutChartProps) => {
  const { visible } = useValuesVisibility();
  const data = [
    { name: "Receitas", value: receitas },
    { name: "Despesas", value: despesas },
  ].filter((d) => d.value > 0);

  const total = receitas + despesas;

  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground font-medium self-start">Distribuição</p>
        {data.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados</p>
          </div>
        ) : (
          <div className="relative h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-muted-foreground">Saldo</span>
              <span className={`text-sm font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                {maskValue(formatCurrency(saldo), visible)}
              </span>
            </div>
          </div>
        )}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[0] }} />
              Receitas
            </span>
            <span className="font-medium">{maskValue(formatCurrency(receitas), visible)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[1] }} />
              Despesas
            </span>
            <span className="font-medium">{maskValue(formatCurrency(despesas), visible)}</span>
          </div>
          {total > 0 && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
              <span>Receitas</span>
              <span>{((receitas / total) * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
