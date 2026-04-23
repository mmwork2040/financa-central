import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { formatCurrency } from "@/utils/formatters";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { isPending, isExecuted } from "@/utils/lancamentoStatus";

type Periodo = "trimestral" | "semestral" | "anual";
const MESES_MAP: Record<Periodo, number> = { trimestral: 3, semestral: 6, anual: 12 };
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const DashboardTrendLineChart = () => {
  const { visible } = useValuesVisibility();
  const [periodo, setPeriodo] = useState<Periodo>("semestral");
  const [chartData, setChartData] = useState<Array<{ name: string; receitas: number; despesas: number; saldo: number; projetado?: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const hoje = new Date();
        const meses = MESES_MAP[periodo];
        const inicio = startOfMonth(addMonths(hoje, -(Math.floor(meses / 2) - 1)));
        const fim = endOfMonth(addMonths(hoje, Math.ceil(meses / 2)));

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, data_vencimento, status, origem")
          .gte("data_vencimento", format(inicio, "yyyy-MM-dd"))
          .lte("data_vencimento", format(fim, "yyyy-MM-dd"));

        const mesAtual = `${hoje.getFullYear()}-${hoje.getMonth()}`;

        // Build month keys
        const monthKeys: string[] = [];
        for (let i = 0; i < meses; i++) {
          const d = addMonths(inicio, i);
          monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
        }

        const map: Record<string, { receitas: number; despesas: number }> = {};
        monthKeys.forEach(k => { map[k] = { receitas: 0, despesas: 0 }; });

        (lancamentos || []).forEach(l => {
          if (l.origem === "transferencia") return;
          const dv = new Date(l.data_vencimento);
          const key = `${dv.getFullYear()}-${dv.getMonth()}`;
          if (!map[key]) return;

          const isFuturo = key > mesAtual;
          const isPago = isExecuted(l.status);
          const isPendente = isPending(l.status);

          // Passado: só pagos. Futuro: pagos + pendentes. Mês atual: ambos.
          if (!isFuturo && !isPago && key !== mesAtual) return;
          if (key === mesAtual && !isPago && !isPendente) return;
          if (isFuturo && !isPago && !isPendente) return;

          if (l.tipo === "receita") map[key].receitas += l.valor || 0;
          else if (l.tipo === "despesa") map[key].despesas += l.valor || 0;
        });

        const result = monthKeys.map(key => {
          const [year, month] = key.split("-").map(Number);
          const v = map[key];
          return {
            name: `${MONTH_NAMES[month]}/${String(year).slice(2)}`,
            receitas: v.receitas,
            despesas: v.despesas,
            saldo: v.receitas - v.despesas,
            projetado: key > mesAtual,
          };
        });

        setChartData(result);
      } catch (e) {
        console.error("Trend chart error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [periodo]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {maskValue(formatCurrency(p.value), visible)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tendência Financeira
          </CardTitle>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => visible ? `${(v / 1000).toFixed(0)}k` : "•••"} className="text-muted-foreground" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(217, 91%, 60%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
