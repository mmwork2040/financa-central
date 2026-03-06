import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthData {
  month: string;
  saldo: number;
  investido: number;
  patrimonio: number;
}

const PatrimonioChart = () => {
  const { empresaId } = useAuth();
  const { visible } = useValuesVisibility();
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const months: MonthData[] = [];

        // Fetch bank account balances (current snapshot)
        const { data: contas } = await supabase
          .from("contas_bancarias")
          .select("saldo_atual")
          .eq("empresa_id", empresaId);

        const saldoAtual = contas?.reduce((s, c) => s + Number(c.saldo_atual || 0), 0) || 0;

        // Fetch all lancamentos for the last 6 months
        const startDate = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");
        const endDate = format(endOfMonth(now), "yyyy-MM-dd");

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, data_vencimento, status")
          .eq("empresa_id", empresaId)
          .gte("data_vencimento", startDate)
          .lte("data_vencimento", endDate)
          .in("status", ["pago", "recebido"]);

        // Group by month
        const monthMap: Record<string, { receitas: number; despesas: number; investimentos: number }> = {};

        for (let i = 5; i >= 0; i--) {
          const m = subMonths(now, i);
          const key = format(m, "yyyy-MM");
          monthMap[key] = { receitas: 0, despesas: 0, investimentos: 0 };
        }

        lancamentos?.forEach((l) => {
          const key = l.data_vencimento.substring(0, 7);
          if (monthMap[key]) {
            if (l.tipo === "receita") monthMap[key].receitas += Number(l.valor);
            else if (l.tipo === "despesa") monthMap[key].despesas += Number(l.valor);
            else if (l.tipo === "investimento") monthMap[key].investimentos += Number(l.valor);
          }
        });

        // Build cumulative patrimony backwards from current saldo
        const keys = Object.keys(monthMap).sort();
        const currentMonthKey = format(now, "yyyy-MM");

        // Calculate net flow per month
        const flows = keys.map((k) => ({
          key: k,
          net: monthMap[k].receitas - monthMap[k].despesas - monthMap[k].investimentos,
          inv: monthMap[k].investimentos,
        }));

        // Work backwards: saldo at current month = saldoAtual
        // saldo at month[i] = saldo[i+1] - net[i+1]
        const saldos: number[] = new Array(flows.length).fill(0);
        const investAcum: number[] = new Array(flows.length).fill(0);

        // Total invested across all time (use current month's cumulative)
        const { data: allInv } = await supabase
          .from("lancamentos")
          .select("valor, data_vencimento")
          .eq("empresa_id", empresaId)
          .eq("tipo", "investimento")
          .in("status", ["pago", "recebido"])
          .lte("data_vencimento", endDate);

        let totalInvestido = allInv?.reduce((s, l) => s + Number(l.valor), 0) || 0;

        // Set current month
        saldos[flows.length - 1] = saldoAtual;
        investAcum[flows.length - 1] = totalInvestido;

        // Go backwards
        for (let i = flows.length - 2; i >= 0; i--) {
          saldos[i] = saldos[i + 1] - flows[i + 1].net;
          investAcum[i] = investAcum[i + 1] - flows[i + 1].inv;
        }

        keys.forEach((k, i) => {
          const d = new Date(k + "-15");
          months.push({
            month: format(d, "MMM/yy", { locale: ptBR }),
            saldo: Math.round(saldos[i] * 100) / 100,
            investido: Math.round(Math.max(0, investAcum[i]) * 100) / 100,
            patrimonio: Math.round((saldos[i] + Math.max(0, investAcum[i])) * 100) / 100,
          });
        });

        setData(months);
      } catch (err) {
        console.error("Erro ao carregar patrimônio:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [empresaId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-xs space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {maskValue(formatCurrency(p.value), visible)}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">Carregando evolução...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-base font-semibold">Evolução Patrimonial</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              tickFormatter={(v) => visible ? `${(v / 1000).toFixed(0)}k` : "***"}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              stroke="hsl(var(--primary))"
              fill="url(#gradSaldo)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="investido"
              name="Investido"
              stroke="#3b82f6"
              fill="url(#gradInv)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="patrimonio"
              name="Patrimônio"
              stroke="#8b5cf6"
              fill="url(#gradPat)"
              strokeWidth={2.5}
              strokeDasharray="5 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PatrimonioChart;
