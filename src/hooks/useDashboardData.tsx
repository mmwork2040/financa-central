import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface DashboardSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldoAtual: number;
  contasProximas: number;
  emAtraso: number;
}

interface LancamentoRecente {
  id: string;
  descricao: string;
  tipo: 'receita' | 'despesa' | 'investimento';
  valor: number;
  data_vencimento: string;
  created_at: string;
  status: string;
  cliente?: { nome: string };
  fornecedor?: { nome: string };
  categoria?: { nome: string };
}

interface ContaProxima {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  tipo: string;
  status: string;
}

export type HealthStatus = 'saudavel' | 'atencao' | 'risco';

export const useDashboardData = () => {
  const { selectedMonth, monthStart, monthEnd } = useMonthFilter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoAtual: 0,
    contasProximas: 0,
    emAtraso: 0,
  });
  
  const [lancamentosRecentes, setLancamentosRecentes] = useState<LancamentoRecente[]>([]);
  const [contasProximas, setContasProximas] = useState<ContaProxima[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('saudavel');
  const [dataFluxo, setDataFluxo] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<Array<{ name: string; receitas: number; despesas: number; investimentos: number }>>([]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent transactions
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from('lancamentos')
        .select(`*, categoria:categoria_id(nome), fornecedor:fornecedor_id(nome), cliente:cliente_id(nome)`)
        .gte('data_vencimento', monthStart)
        .lte('data_vencimento', monthEnd)
        .order('created_at', { ascending: false })
        .limit(10);

      if (lancamentosError) throw lancamentosError;
      
      const typedLancamentos = lancamentos?.map(l => ({
        id: l.id,
        descricao: l.descricao,
        tipo: l.tipo as 'receita' | 'despesa' | 'investimento',
        valor: l.valor,
        data_vencimento: l.data_vencimento,
        created_at: l.created_at,
        status: l.status,
        cliente: l.cliente,
        fornecedor: l.fornecedor,
        categoria: l.categoria,
      })) || [];
      
      setLancamentosRecentes(typedLancamentos);

      // Fetch transactions for the selected month
      const { data: todosLancamentos, error: todosError } = await supabase
        .from('lancamentos')
        .select('*')
        .gte('data_vencimento', monthStart)
        .lte('data_vencimento', monthEnd);
        
      if (todosError) throw todosError;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const em7Dias = new Date(hoje);
      em7Dias.setDate(em7Dias.getDate() + 7);
      
      // Only count paid/received transactions for totals
      const totalReceitas = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pago' || l.status === 'recebido'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
        
      const totalDespesas = todosLancamentos
        ?.filter(l => l.tipo === 'despesa' && l.status === 'pago')
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      
      const saldoAtual = totalReceitas - totalDespesas;

      // Bills in next 7 days (pending)
      const proximasContas = todosLancamentos?.filter(l => {
        const dv = new Date(l.data_vencimento);
        return dv >= hoje && dv <= em7Dias && (l.status === 'pendente' || l.status === 'aberto');
      }) || [];
      
      const emAtraso = todosLancamentos?.filter(l => {
        const dv = new Date(l.data_vencimento);
        return dv < hoje && (l.status === 'pendente' || l.status === 'aberto');
      }).length || 0;

      setContasProximas(proximasContas.map(l => ({
        id: l.id,
        descricao: l.descricao,
        valor: l.valor,
        data_vencimento: l.data_vencimento,
        tipo: l.tipo,
        status: l.status,
      })).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()));
      
      setSummary({
        totalReceitas,
        totalDespesas,
        saldoAtual,
        contasProximas: proximasContas.length,
        emAtraso,
      });

      // Monthly chart data (last 6 months)
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartMap: Record<string, { receitas: number; despesas: number; investimentos: number }> = {};
      const seisMesesAtras = new Date(hoje);
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
      seisMesesAtras.setDate(1);

      for (let i = 0; i < 6; i++) {
        const d = new Date(seisMesesAtras);
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        chartMap[key] = { receitas: 0, despesas: 0, investimentos: 0 };
      }

      todosLancamentos?.forEach(l => {
        if (l.status !== 'pago' && l.status !== 'recebido') return;
        const dv = new Date(l.data_vencimento);
        const key = `${dv.getFullYear()}-${dv.getMonth()}`;
        if (chartMap[key]) {
          if (l.tipo === 'receita') chartMap[key].receitas += l.valor || 0;
          else if (l.tipo === 'despesa') chartMap[key].despesas += l.valor || 0;
          else if (l.tipo === 'investimento') chartMap[key].investimentos += l.valor || 0;
        }
      });

      const chartData = Object.entries(chartMap).map(([key, val]) => {
        const [year, month] = key.split('-').map(Number);
        return { name: monthNames[month], ...val };
      });
      setMonthlyChartData(chartData);

      // Refined Health Indicator
      const compromissosFuturos = todosLancamentos
        ?.filter(l => l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const receitasPendentes = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const tressMesesAtras = new Date(hoje);
      tressMesesAtras.setMonth(tressMesesAtras.getMonth() - 3);
      const receitasRecentes = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pago' || l.status === 'recebido') && new Date(l.data_vencimento) >= tressMesesAtras)
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      const mediaReceitaMensal = receitasRecentes / 3;

      let score = 100;
      if (saldoAtual < 0) score -= 40;
      if (emAtraso > 0) score -= emAtraso * 10;
      if (compromissosFuturos > saldoAtual + receitasPendentes) score -= 20;
      if (mediaReceitaMensal > 0 && compromissosFuturos > mediaReceitaMensal * 2) score -= 15;
      if (saldoAtual > 0 && saldoAtual < compromissosFuturos * 0.3) score -= 10;

      if (score >= 70) {
        setHealthStatus('saudavel');
      } else if (score >= 40) {
        setHealthStatus('atencao');
      } else {
        setHealthStatus('risco');
      }
      
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      toast.error(error.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [monthStart, monthEnd]);

  return {
    loading,
    summary,
    lancamentosRecentes,
    contasProximas,
    healthStatus,
    dataFluxo,
    monthlyChartData,
    fetchDashboardData,
  };
};
