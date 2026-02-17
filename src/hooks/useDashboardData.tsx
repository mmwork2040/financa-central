import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DashboardSummary {
  totalReceitas: number;
  totalDespesas: number;
  totalInvestimentos: number;
  vencendoHoje: number;
  emAtraso: number;
}

interface LancamentoRecente {
  id: string;
  descricao: string;
  tipo: 'receita' | 'despesa' | 'investimento';
  valor: number;
  data_vencimento: string;
  status: string;
  cliente?: {
    nome: string;
  };
  fornecedor?: {
    nome: string;
  };
  categoria?: {
    nome: string;
  };
}

interface FluxoCaixaData {
  name: string;
  receitas: number;
  despesas: number;
}

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalReceitas: 0,
    totalDespesas: 0,
    totalInvestimentos: 0,
    vencendoHoje: 0,
    emAtraso: 0
  });
  
  const [lancamentosRecentes, setLancamentosRecentes] = useState<LancamentoRecente[]>([]);
  const [dataFluxo, setDataFluxo] = useState<FluxoCaixaData[]>([]);
  
  // Function to calculate cash flow data from transactions
  function obterDadosFluxoCaixa(lancamentos: any[]) {
    const ultimos6Meses: { name: string; receitas: number; despesas: number }[] = [];
    const hoje = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = data.toLocaleString('pt-BR', { month: 'short' });
      const ano = data.getFullYear();
      const mesSelecionado = data.getMonth();
      const anoSelecionado = data.getFullYear();
      
      const lancamentosMes = lancamentos.filter(l => {
        const dataLancamento = new Date(l.data_vencimento);
        return dataLancamento.getMonth() === mesSelecionado && 
               dataLancamento.getFullYear() === anoSelecionado;
      });
      
      const receitas = lancamentosMes
        .filter(l => l.tipo === 'receita')
        .reduce((sum, l) => sum + (l.valor || 0), 0);
        
      const despesas = lancamentosMes
        .filter(l => l.tipo === 'despesa')
        .reduce((sum, l) => sum + (l.valor || 0), 0);
      
      ultimos6Meses.push({
        name: `${mes}/${ano}`,
        receitas,
        despesas
      });
    }
    
    return ultimos6Meses;
  }
  
  const fetchDashboardData = async () => {
    try {
      console.log("Fetching dashboard data...");
      setLoading(true);
      
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from('lancamentos')
        .select(`
          *,
          categoria:categoria_id(nome),
          fornecedor:fornecedor_id(nome),
          cliente:cliente_id(nome)
        `)
        .order('data_vencimento', { ascending: false })
        .limit(5);

      if (lancamentosError) {
        console.error("Error fetching transactions:", lancamentosError);
        throw lancamentosError;
      }
      
      console.log("Recent transactions loaded:", lancamentos);
      
      const typedLancamentos = lancamentos?.map(l => ({
        id: l.id,
        descricao: l.descricao,
        tipo: l.tipo as 'receita' | 'despesa' | 'investimento',
        valor: l.valor,
        data_vencimento: l.data_vencimento,
        status: l.status,
        cliente: l.cliente,
        fornecedor: l.fornecedor,
        categoria: l.categoria
      })) || [];
      
      setLancamentosRecentes(typedLancamentos);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const { data: todosLancamentos, error: todosError } = await supabase
        .from('lancamentos')
        .select('*');
        
      if (todosError) {
        console.error("Error fetching all transactions:", todosError);
        throw todosError;
      }
      
      console.log("Total transactions loaded:", todosLancamentos?.length || 0);
      
      const totalReceitas = todosLancamentos
        ?.filter(l => l.tipo === 'receita')
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
        
      const totalDespesas = todosLancamentos
        ?.filter(l => l.tipo === 'despesa')
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;

      const totalInvestimentos = todosLancamentos
        ?.filter(l => l.tipo === 'investimento')
        .reduce((sum, l) => sum + (l.valor || 0), 0) || 0;
      
      const vencendoHoje = todosLancamentos
        ?.filter(l => new Date(l.data_vencimento).toDateString() === hoje.toDateString() && l.status === 'aberto')
        .length || 0;
      
      const emAtraso = todosLancamentos
        ?.filter(l => new Date(l.data_vencimento) < hoje && l.status === 'aberto')
        .length || 0;
      
      console.log("Summary calculated:", { totalReceitas, totalDespesas, vencendoHoje, emAtraso });
      
      setSummary({
        totalReceitas,
        totalDespesas,
        totalInvestimentos,
        vencendoHoje,
        emAtraso
      });

      const dadosCalculados = obterDadosFluxoCaixa(todosLancamentos || []);
      console.log("Cash flow data calculated:", dadosCalculados);
      setDataFluxo(dadosCalculados);
      
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      toast.error(error.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Dashboard: Fetching data");
    fetchDashboardData();
  }, []);

  return {
    loading,
    summary,
    lancamentosRecentes,
    dataFluxo,
    fetchDashboardData
  };
};
