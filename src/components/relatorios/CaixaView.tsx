import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { Landmark, TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { simularFluxoCaixa, calcularMesesDeCaixa, calcularFluxoMensal } from "@/utils/cashFlowProjection";

const CaixaView = () => {
  const { visible } = useValuesVisibility();
  const [loading, setLoading] = useState(true);
  const [caixaAtual, setCaixaAtual] = useState(0);
  const [mesesDeCaixa, setMesesDeCaixa] = useState(0);
  const [projectionData, setProjectionData] = useState<Array<{ name: string; caixa: number }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const hoje = new Date();

        // Caixa atual
        const { data: contas } = await supabase
          .from("contas_bancarias")
          .select("saldo_atual");
        const totalCaixa = contas?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;
        setCaixaAtual(totalCaixa);

        // Fetch pending transactions (inclui vencidos para que continuem aparecendo)
        const { data: lancFuturos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, data_vencimento, status, descricao, recorrente, total_parcelas, recorrencia_fim")
          .in("status", ["pendente", "aberto", "vencido", "atrasado"]);

        // Fetch active recurring without fixed installments
        const { data: recorrentes } = await supabase
          .from("lancamentos")
          .select("tipo, valor, data_vencimento, status, descricao, recorrente, total_parcelas, recorrencia_fim")
          .eq("recorrente", true)
          .is("total_parcelas", null);

        // Saldo Investido
        const { data: investimentosPagos } = await supabase
          .from('lancamentos').select('valor')
          .eq('tipo', 'investimento').in('status', ['pago', 'recebido']);
        const totalInvestido = investimentosPagos?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

        const { data: resgatesInvestimento } = await supabase
          .from('lancamentos').select('valor')
          .eq('tipo', 'receita').eq('origem', 'resgate_investimento').in('status', ['pago', 'recebido']);
        const totalResgatado = resgatesInvestimento?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

        const { data: reajustesInvestimento } = await supabase
          .from('lancamentos').select('valor')
          .eq('origem', 'reajuste_investimento').in('status', ['pago', 'recebido']);
        const totalReajustes = reajustesInvestimento?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

        const saldoInvestido = totalInvestido - totalResgatado + totalReajustes;

        // Caixa total = saldo bancário + saldo investido
        const caixaTotal = totalCaixa + saldoInvestido;

        // Simulate cash flow for chart
        const result = simularFluxoCaixa(
          totalCaixa,
          (lancFuturos || []) as any,
          (recorrentes || []) as any,
          12
        );

        // Calculate "Meses de Caixa":
        // (Caixa Atual + Investido + Receitas a Receber) / Custo Médio Mensal
        const allFuturos = (lancFuturos || []) as any[];
        const receitasPendentes = allFuturos
          .filter((l: any) => l.tipo === "receita")
          .reduce((sum: number, l: any) => sum + (l.valor || 0), 0);
        
        const nextMonth = addMonths(hoje, 1);
        const nextMonthFlow = calcularFluxoMensal(nextMonth, allFuturos, (recorrentes || []) as any[]);
        const custoMedioMensal = nextMonthFlow.despesas;

        setMesesDeCaixa(calcularMesesDeCaixa(caixaTotal, receitasPendentes, custoMedioMensal));
        setProjectionData(result.projectionData.slice(0, 4));
      } catch (err) {
        console.error("Erro ao carregar dados de caixa:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  return (
    <div className="space-y-4">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-blue-100 p-1.5"><Landmark className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-muted-foreground">Caixa Atual</span>
            </div>
            <p className={cn("text-xl font-bold", caixaAtual >= 0 ? "text-blue-600" : "text-destructive")}>
              {maskValue(formatCurrency(caixaAtual), visible)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary/10 p-1.5"><TrendingUp className="h-4 w-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Projeção 3 meses</span>
            </div>
            <p className={cn("text-xl font-bold", (projectionData[3]?.caixa || 0) >= 0 ? "text-primary" : "text-destructive")}>
              {maskValue(formatCurrency(projectionData[3]?.caixa || 0), visible)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-amber-100 p-1.5"><Calendar className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Meses de Caixa</span>
            </div>
            <p className={cn("text-xl font-bold", mesesDeCaixa >= 3 ? "text-primary" : mesesDeCaixa >= 1 ? "text-amber-600" : "text-destructive")}>
              {mesesDeCaixa >= 12 ? "12+ meses" : `${mesesDeCaixa} meses`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projeção de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Caixa"]} />
                <Line type="monotone" dataKey="caixa" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaixaView;
