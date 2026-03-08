import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { formatCurrency } from "@/utils/formatters";
import { PieChartIcon, Percent, DollarSign } from "lucide-react";

const CATEGORY_COLORS = [
  "hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)",
  "hsl(258, 90%, 66%)", "hsl(330, 81%, 60%)", "hsl(168, 76%, 42%)", "hsl(24, 95%, 53%)",
  "hsl(239, 84%, 67%)", "hsl(84, 60%, 50%)",
];

interface LancamentoComCategoria {
  tipo: string;
  valor: number;
  status: string;
  origem?: string;
  categoria?: { nome: string } | null;
}

interface Props {
  lancamentosMes: LancamentoComCategoria[];
}

export const DashboardCategoryPieChart = ({ lancamentosMes }: Props) => {
  const { visible } = useValuesVisibility();
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "receita" | "despesa">("todos");
  const [showPercent, setShowPercent] = useState(true);

  const data = useMemo(() => {
    const filtered = lancamentosMes.filter(l => {
      if (l.origem === "transferencia") return false;
      if (tipoFiltro !== "todos" && l.tipo !== tipoFiltro) return false;
      return true;
    });

    const map: Record<string, number> = {};
    filtered.forEach(l => {
      const cat = l.categoria?.nome || "Sem categoria";
      map[cat] = (map[cat] || 0) + (l.valor || 0);
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [lancamentosMes, tipoFiltro]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="lg:col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Por Categoria
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowPercent(!showPercent)}
              title={showPercent ? "Mostrar valores" : "Mostrar porcentagem"}
            >
              {showPercent ? <DollarSign className="h-3.5 w-3.5" /> : <Percent className="h-3.5 w-3.5" />}
            </Button>
            <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as any)}>
              <SelectTrigger className="h-7 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">Sem dados para o filtro</p>
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => maskValue(formatCurrency(value), visible)}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto">
              {data.map((item, i) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium shrink-0 ml-2">
                      {showPercent ? `${pct}%` : maskValue(formatCurrency(item.value), visible)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
