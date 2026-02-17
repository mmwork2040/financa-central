
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface RelatorioData {
  dataReceitas: {name: string; value: number}[];
  dataDespesas: {name: string; value: number}[];
  dataFluxo: {name: string; receitas: number; despesas: number}[];
}

export const useRelatoriosData = (periodo: string) => {
  const [loading, setLoading] = useState(true);
  const [dataReceitas, setDataReceitas] = useState<{name: string; value: number}[]>([]);
  const [dataDespesas, setDataDespesas] = useState<{name: string; value: number}[]>([]);
  const [dataFluxo, setDataFluxo] = useState<{name: string; receitas: number; despesas: number}[]>([]);
  
  const fetchRelatoriosData = async () => {
    try {
      setLoading(true);
      console.log("Buscando dados para o período:", periodo);
      
      // Determine date range based on period
      const hoje = new Date();
      let dataInicio;
      
      switch (periodo) {
        case 'mes':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
          break;
        case 'trimestre':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());
          break;
        case 'semestre':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, hoje.getDate());
          break;
        case 'ano':
          dataInicio = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());
          break;
        default:
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
      }
      
      // Format dates for Supabase query - importante: em português do Brasil é DD/MM/YYYY
      const dataInicioStr = dataInicio.toISOString().split('T')[0];
      const hojeStr = hoje.toISOString().split('T')[0];
      
      console.log("Período de busca:", dataInicioStr, "até", hojeStr);
      
      // Fetch all transactions for the period - CORREÇÃO NA QUERY PARA BUSCAR TODOS OS LANÇAMENTOS
      // Removemos o filtro de data para debug e verificamos os dados existentes
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select(`
          *,
          categoria:categoria_id(nome)
        `);
      
      if (error) {
        console.error("Erro ao buscar lançamentos:", error);
        throw error;
      }
      
      console.log("Total de lançamentos encontrados:", lancamentos?.length || 0);
      console.log("Primeiros 5 lançamentos:", lancamentos?.slice(0, 5));
      
      if (lancamentos && lancamentos.length > 0) {
        // Process data for receipts by category
        const receitasPorCategoria = processarLancamentosPorCategoria(lancamentos, 'receita');
        console.log("Receitas por categoria:", receitasPorCategoria);
        setDataReceitas(receitasPorCategoria);
        
        // Process data for expenses by category
        const despesasPorCategoria = processarLancamentosPorCategoria(lancamentos, 'despesa');
        console.log("Despesas por categoria:", despesasPorCategoria);
        setDataDespesas(despesasPorCategoria);
        
        // Process data for cash flow
        const fluxoCaixa = processarFluxoCaixa(lancamentos, periodo);
        console.log("Fluxo de caixa:", fluxoCaixa);
        setDataFluxo(fluxoCaixa);
      } else {
        // Reset data if no transactions found
        setDataReceitas([]);
        setDataDespesas([]);
        setDataFluxo([]);
        console.log("Nenhum lançamento encontrado para o período selecionado");
      }
      
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
    }
  };
  
  // Process transactions by category
  const processarLancamentosPorCategoria = (lancamentos: any[], tipo: 'receita' | 'despesa'): {name: string; value: number}[] => {
    const lancamentosFiltrados = lancamentos?.filter(l => l.tipo === tipo) || [];
    console.log(`Lançamentos filtrados (${tipo}):`, lancamentosFiltrados.length);
    
    // Group by category
    const categorias: Record<string, number> = {};
    
    lancamentosFiltrados.forEach(lancamento => {
      const categoriaNome = lancamento.categoria?.nome || 'Sem categoria';
      if (!categorias[categoriaNome]) {
        categorias[categoriaNome] = 0;
      }
      categorias[categoriaNome] += Number(lancamento.valor) || 0;
    });
    
    console.log(`Categorias agrupadas (${tipo}):`, categorias);
    
    // Convert to array format for charts
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  };
  
  // Process data for cash flow chart
  const processarFluxoCaixa = (lancamentos: any[], periodo: string): {name: string; receitas: number; despesas: number}[] => {
    // Para simplificar e mostrar dados reais, vamos criar apenas um único período com total
    // Se existirem dados, isso garantirá que pelo menos uma barra seja mostrada no gráfico
    
    const receitas = lancamentos
      .filter(l => l.tipo === 'receita')
      .reduce((sum, l) => sum + (Number(l.valor) || 0), 0);
      
    const despesas = lancamentos
      .filter(l => l.tipo === 'despesa')
      .reduce((sum, l) => sum + (Number(l.valor) || 0), 0);
    
    console.log("Total de receitas:", receitas);
    console.log("Total de despesas:", despesas);
    
    // Se não há dados de período, retorna pelo menos um período com os totais
    if (receitas === 0 && despesas === 0) {
      return [];
    }
    
    return [{ name: "Total", receitas, despesas }];
  };
  
  // Effect to fetch data when the period changes
  useEffect(() => {
    fetchRelatoriosData();
  }, [periodo]);
  
  return {
    loading,
    dataReceitas,
    dataDespesas,
    dataFluxo,
    fetchRelatoriosData
  };
};
