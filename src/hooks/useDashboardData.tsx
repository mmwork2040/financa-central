import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  // Keep legacy fields for compatibility
  const [dataFluxo, setDataFluxo] = useState<any[]>([]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent transactions
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from('lancamentos')
        .select(`*, categoria:categoria_id(nome), fornecedor:fornecedor_id(nome), cliente:cliente_id(nome)`)
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

      // Fetch all transactions for summary
      const { data: todosLancamentos, error: todosError } = await supabase
        .from('lancamentos')
        .select('*');
        
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

      // Refined Health Indicator
      const compromissosFuturos = todosLancamentos
        ?.filter(l => l.tipo === 'despesa' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const receitasPendentes = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pendente' || l.status === 'aberto'))
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      // Calculate average monthly revenue (last 3 months)
      const tressMesesAtras = new Date(hoje);
      tressMesesAtras.setMonth(tressMesesAtras.getMonth() - 3);
      const receitasRecentes = todosLancamentos
        ?.filter(l => l.tipo === 'receita' && (l.status === 'pago' || l.status === 'recebido') && new Date(l.data_vencimento) >= tressMesesAtras)
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      const mediaReceitaMensal = receitasRecentes / 3;

      // Scoring system for health
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
  }, []);

  return {
    loading,
    summary,
    lancamentosRecentes,
    contasProximas,
    healthStatus,
    dataFluxo,
    fetchDashboardData,
  };
};
