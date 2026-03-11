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

interface CaixaBreakdownItem {
  id: string;
  descricao: string;
  tipo: string;
  valor: number;
  data_vencimento: string;
  status: string;
}

interface CaixaData {
  caixaAtual: number;
  caixaPrevisto: number;
  mesesDeCaixa: number;
  saldoInvestido: number;
  receitasPendentesAcumuladas: number;
  despesasPendentesAcumuladas: number;
  itensPendentes: CaixaBreakdownItem[];
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
  
  const [caixa, setCaixa] = useState<CaixaData>({ caixaAtual: 0, caixaPrevisto: 0, mesesDeCaixa: 0, saldoInvestido: 0, receitasPendentesAcumuladas: 0, despesasPendentesAcumuladas: 0, itensPendentes: [] });
  const [lancamentosRecentes, setLancamentosRecentes] = useState<LancamentoRecente[]>([]);
  const [contasProximas, setContasProximas] = useState<ContaProxima[]>([]);
  const [receitasPendentes, setReceitasPendentes] = useState<ContaProxima[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('saudavel');
  const [dataFluxo, setDataFluxo] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<Array<{ name: string; receitas: number; despesas: number; investimentos: number }>>([]);
  const [contasBancarias, setContasBancarias] = useState<Array<{ id: string; nome: string; saldo_atual: number; saldo_inicial: number }>>([]);
  const [projectionData, setProjectionData] = useState<Array<{ name: string; caixa: number }>>([]);
  const [lancamentosMes, setLancamentosMes] = useState<any[]>([]);
  
  const recalculateBalances = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;
      const { data, error } = await supabase.functions.invoke("recalculate-balances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.corrections > 0) {
        console.log(`Recálculo: ${data.corrections} conta(s) corrigida(s)`, data.details);
      }
    } catch (e) {
      console.warn("Erro ao recalcular saldos:", e);
    }
  };

  const fetchDashboardData = async (skipRecalc = false) => {
    try {
      setLoading(true);

      // Recalculate all bank balances from scratch before loading dashboard
      if (!skipRecalc) {
        await recalculateBalances();
      }

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
        .select('*, categoria:categoria_id(nome)')
        .gte('data_vencimento', monthStart)
        .lte('data_vencimento', monthEnd);
        
      if (todosError) throw todosError;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const em7Dias = new Date(hoje);
      em7Dias.setDate(em7Dias.getDate() + 7);
      
      // Filter out transfer movements — they are internal and should not count as income/expense
      const lancamentosSemTransf = todosLancamentos?.filter(l => l.origem !== 'transferencia') || [];

      // Executed (paid/received)
      const receitasExecutadas = lancamentosSemTransf
        .filter(l => l.tipo === 'receita' && (l.status === 'pago' || l.status === 'recebido'))
        .reduce((sum, l) => sum + (l.valor || 0), 0);
        
      const despesasExecutadas = lancamentosSemTransf
        .filter(l => l.tipo === 'despesa' && l.status === 'pago')
        .reduce((sum, l) => sum + (l.valor || 0), 0);

      // Predicted (pending)
      const receitasPrevistas = lancamentosSemTransf
        .filter(l => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0);

      const despesasPrevistas = lancamentosSemTransf
        .filter(l => l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0);
      
      const totalReceitas = receitasExecutadas;
      const totalDespesas = despesasExecutadas;

      // Saldo do mês será calculado após buscar contas bancárias

      // Contas a Pagar: todas as despesas pendentes do mês selecionado (exceto transferências)
      const proximasContas = lancamentosSemTransf.filter(l => {
        return l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto');
      });
      
      const emAtraso = lancamentosSemTransf.filter(l => {
        const dv = new Date(l.data_vencimento);
        return dv < hoje && (l.status === 'pendente' || l.status === 'aberto');
      }).length;

      setContasProximas(proximasContas.map(l => ({
        id: l.id,
        descricao: l.descricao,
        valor: l.valor,
        data_vencimento: l.data_vencimento,
        tipo: l.tipo,
        status: l.status,
      })).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()));

      // Receitas Pendentes list (exceto transferências)
      const receitasPendList = lancamentosSemTransf.filter(l => {
        return l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto');
      });

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
        .select('id, nome, saldo_atual, saldo_inicial');
      
      if (contasError) throw contasError;
      const caixaAtual = contas?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;

      // 2. Caixa Previsto = caixaAtual + ALL pending receitas up to monthEnd - ALL pending despesas up to monthEnd
      // Includes overdue items that haven't been paid yet, since they still impact the bank balance
      const { data: pendentesAteMonthEnd } = await supabase
        .from('lancamentos')
        .select('id, descricao, tipo, valor, status, origem, data_vencimento')
        .in('status', ['pendente', 'aberto'])
        .lte('data_vencimento', monthEnd);

      const pendSemTransf = pendentesAteMonthEnd?.filter(l => (l as any).origem !== 'transferencia' && l.tipo !== 'investimento') || [];
      const receitasPendentesAcumuladas = pendSemTransf
        .filter(l => l.tipo === 'receita')
        .reduce((sum, l) => sum + (l.valor || 0), 0);
      const despesasPendentesAcumuladas = pendSemTransf
        .filter(l => l.tipo === 'despesa')
        .reduce((sum, l) => sum + (l.valor || 0), 0);

      const itensPendentes: CaixaBreakdownItem[] = pendSemTransf.map(l => ({
        id: (l as any).id,
        descricao: (l as any).descricao,
        tipo: l.tipo,
        valor: l.valor || 0,
        data_vencimento: (l as any).data_vencimento,
        status: l.status,
      })).sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

      const caixaPrevisto = caixaAtual + receitasPendentesAcumuladas - despesasPendentesAcumuladas;

      // 3. Meses de caixa (runway) — simulação mês a mês com recorrências
      const { data: lancFuturos } = await supabase
        .from('lancamentos')
        .select('tipo, valor, data_vencimento, status, descricao, recorrente, total_parcelas, recorrencia_fim')
        .in('status', ['pendente', 'aberto'])
        .neq('tipo', 'investimento')
        .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'));

      const { data: recorrentes } = await supabase
        .from('lancamentos')
        .select('tipo, valor, data_vencimento, status, descricao, recorrente, total_parcelas, recorrencia_fim')
        .eq('recorrente', true)
        .neq('tipo', 'investimento')
        .is('total_parcelas', null);

      const { mesesDeCaixa, projectionData: projData } = simularFluxoCaixa(
        caixaAtual,
        (lancFuturos || []) as any,
        (recorrentes || []) as any,
        12
      );

      // Saldo Investido: soma acumulativa de TODOS os investimentos pagos - resgates + reajustes
      const { data: investimentosPagos } = await supabase
        .from('lancamentos')
        .select('valor')
        .eq('tipo', 'investimento')
        .in('status', ['pago', 'recebido']);
      const totalInvestido = investimentosPagos?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const { data: resgatesInvestimento } = await supabase
        .from('lancamentos')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('origem', 'resgate_investimento')
        .in('status', ['pago', 'recebido']);
      const totalResgatado = resgatesInvestimento?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      // Reajustes manuais de investimento (positivos somam, negativos subtraem do saldo investido)
      const { data: reajustesInvestimento } = await supabase
        .from('lancamentos')
        .select('valor')
        .eq('origem', 'reajuste_investimento')
        .in('status', ['pago', 'recebido']);
      const totalReajustes = reajustesInvestimento?.reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const saldoInvestido = totalInvestido - totalResgatado + totalReajustes;

      const contasBancariasList = contas?.map(c => ({ id: c.id, nome: c.nome, saldo_atual: c.saldo_atual, saldo_inicial: c.saldo_inicial })) || [];
      setContasBancarias(contasBancariasList);
      setProjectionData(projData);
      setLancamentosMes(lancamentosSemTransf);
      setCaixa({ caixaAtual, caixaPrevisto, mesesDeCaixa, saldoInvestido, receitasPendentesAcumuladas, despesasPendentesAcumuladas, itensPendentes });

      // Saldo do mês = caixa real disponível (soma dos saldos bancários)
      const saldoAtual = caixaAtual;

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

      lancamentosSemTransf.forEach(l => {
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
      const compromissosFuturos = lancamentosSemTransf
        .filter(l => l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0);

      const receitasPendentesHealth = lancamentosSemTransf
        .filter(l => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0);

      const tresMesesAtrasHealth = new Date(hoje);
      tresMesesAtrasHealth.setMonth(tresMesesAtrasHealth.getMonth() - 3);
      const receitasRecentes = lancamentosSemTransf
        .filter(l => l.tipo === 'receita' && (l.status === 'pago' || l.status === 'recebido') && new Date(l.data_vencimento) >= tresMesesAtrasHealth)
        .reduce((sum, l) => sum + (l.valor || 0), 0);
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

  // Realtime listener for lancamentos changes (skip recalc since balance was already updated by the action)
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-lancamentos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lancamentos' },
        () => {
          fetchDashboardData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [monthStart, monthEnd]);

  // Realtime listener for contas_bancarias changes (saldo updates)
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-contas-bancarias')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contas_bancarias' },
        () => {
          fetchDashboardData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    contasBancarias,
    projectionData,
    lancamentosMes,
  };
};
