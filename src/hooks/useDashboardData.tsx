import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { simularFluxoCaixa } from "@/utils/cashFlowProjection";

interface DashboardSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldoAtual: number;
  contasProximas: number;
  emAtraso: number;
  receitasExecutadas: number;
  despesasExecutadas: number;
  receitasPrevistas: number;
  despesasPrevistas: number;
}

interface CaixaData {
  caixaAtual: number;
  caixaPrevisto: number;
  mesesDeCaixa: number;
  saldoInvestido: number;
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
    receitasExecutadas: 0,
    despesasExecutadas: 0,
    receitasPrevistas: 0,
    despesasPrevistas: 0,
  });
  
  const [caixa, setCaixa] = useState<CaixaData>({ caixaAtual: 0, caixaPrevisto: 0, mesesDeCaixa: 0, saldoInvestido: 0 });
  const [lancamentosRecentes, setLancamentosRecentes] = useState<LancamentoRecente[]>([]);
  const [contasProximas, setContasProximas] = useState<ContaProxima[]>([]);
  const [receitasPendentes, setReceitasPendentes] = useState<ContaProxima[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('saudavel');
  const [dataFluxo, setDataFluxo] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<Array<{ name: string; receitas: number; despesas: number; investimentos: number }>>([]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Silently process mature digital receipts (auto-convert pending → received)
      supabase.functions.invoke("process-digital-receipts").catch(() => {});
      // Silently generate any missing recurring transactions
      supabase.functions.invoke("generate-recurring").catch(() => {});
      
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
      
      // Executed (paid/received)
      const receitasExecutadas = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pago' || l.status === 'recebido'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
        
      const despesasExecutadas = todosLancamentos
        ?.filter(l => l.tipo === 'despesa' && l.status === 'pago')
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      // Predicted (pending)
      const receitasPrevistas = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const despesasPrevistas = todosLancamentos
        ?.filter(l => l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      
      const totalReceitas = receitasExecutadas;
      const totalDespesas = despesasExecutadas;

      // Saldo do mês será calculado após buscar contas bancárias

      // Contas a Pagar: todas as despesas pendentes do mês selecionado
      const proximasContas = todosLancamentos?.filter(l => {
        return l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto');
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

      // Receitas Pendentes list
      const receitasPendList = todosLancamentos?.filter(l => {
        return l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto');
      }) || [];

      setReceitasPendentes(receitasPendList.map(l => ({
        id: l.id,
        descricao: l.descricao,
        valor: l.valor,
        data_vencimento: l.data_vencimento,
        tipo: l.tipo,
        status: l.status,
      })).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()));

      // === CAIXA ===
      // 1. Caixa Atual = sum of all contas_bancarias.saldo_atual
      const { data: contas, error: contasError } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual');
      
      if (contasError) throw contasError;
      const caixaAtual = contas?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;

      // 2. Caixa Previsto = caixaAtual + receitas pendentes do mês atual - despesas pendentes do mês atual
      const receitasPendentes = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      const despesasPendentes = todosLancamentos
        ?.filter(l => l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      
      const caixaPrevisto = caixaAtual + receitasPendentes - despesasPendentes;

      // 3. Meses de caixa (runway) — simulação mês a mês com recorrências
      const { data: lancFuturos } = await supabase
        .from('lancamentos')
        .select('tipo, valor, data_vencimento, status, descricao, recorrente, total_parcelas, recorrencia_fim')
        .in('status', ['pendente', 'aberto'])
        .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'));

      const { data: recorrentes } = await supabase
        .from('lancamentos')
        .select('tipo, valor, data_vencimento, status, descricao, recorrente, total_parcelas, recorrencia_fim')
        .eq('recorrente', true)
        .is('total_parcelas', null);

      const { mesesDeCaixa } = simularFluxoCaixa(
        caixaAtual,
        (lancFuturos || []) as any,
        (recorrentes || []) as any,
        12
      );

      // Saldo Investido: soma dos lançamentos de investimento do mês (pagos)
      const saldoInvestido = todosLancamentos
        ?.filter(l => l.tipo === 'investimento' && (l.status === 'pago' || l.status === 'recebido'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      setCaixa({ caixaAtual, caixaPrevisto, mesesDeCaixa, saldoInvestido });

      // Saldo do mês = caixa + receitas recebidas - despesas pagas
      const saldoAtual = caixaAtual + totalReceitas - totalDespesas;

      setSummary({
        totalReceitas,
        totalDespesas,
        saldoAtual,
        contasProximas: proximasContas.length,
        emAtraso,
        receitasExecutadas,
        despesasExecutadas,
        receitasPrevistas,
        despesasPrevistas,
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

      const receitasPendentesHealth = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const tresMesesAtrasHealth = new Date(hoje);
      tresMesesAtrasHealth.setMonth(tresMesesAtrasHealth.getMonth() - 3);
      const receitasRecentes = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pago' || l.status === 'recebido') && new Date(l.data_vencimento) >= tresMesesAtrasHealth)
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      const mediaReceitaMensal = receitasRecentes / 3;

      let score = 100;
      if (saldoAtual < 0) score -= 40;
      if (emAtraso > 0) score -= emAtraso * 10;
      if (compromissosFuturos > saldoAtual + receitasPendentesHealth) score -= 20;
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
    caixa,
    lancamentosRecentes,
    contasProximas,
    receitasPendentes,
    healthStatus,
    dataFluxo,
    monthlyChartData,
    fetchDashboardData,
  };
};
