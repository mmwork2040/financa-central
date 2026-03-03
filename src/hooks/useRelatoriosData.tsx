
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface RelatorioData {
  dataReceitas: {name: string; value: number}[];
  dataDespesas: {name: string; value: number}[];
  dataFluxo: {name: string; receitas: number; despesas: number}[];
  topReceitas: {name: string; value: number; percent: number}[];
  topDespesas: {name: string; value: number; percent: number}[];
}

type Periodo = 'mes' | 'trimestre' | 'semestre' | 'ano' | 'proximo_mes' | 'proximos_3' | 'proximos_6' | 'proximos_12' | 'personalizado';

function calcDateRange(periodo: Periodo, customStart?: Date, customEnd?: Date): { dataInicio: Date; dataFim: Date } {
  const hoje = new Date();

  switch (periodo) {
    case 'mes':
      return { dataInicio: addMonths(hoje, -1), dataFim: hoje };
    case 'trimestre':
      return { dataInicio: addMonths(hoje, -3), dataFim: hoje };
    case 'semestre':
      return { dataInicio: addMonths(hoje, -6), dataFim: hoje };
    case 'ano':
      return { dataInicio: addMonths(hoje, -12), dataFim: hoje };
    case 'proximo_mes':
      return { dataInicio: hoje, dataFim: addMonths(hoje, 1) };
    case 'proximos_3':
      return { dataInicio: hoje, dataFim: addMonths(hoje, 3) };
    case 'proximos_6':
      return { dataInicio: hoje, dataFim: addMonths(hoje, 6) };
    case 'proximos_12':
      return { dataInicio: hoje, dataFim: addMonths(hoje, 12) };
    case 'personalizado':
      return {
        dataInicio: customStart || addMonths(hoje, -1),
        dataFim: customEnd || hoje,
      };
    default:
      return { dataInicio: addMonths(hoje, -1), dataFim: hoje };
  }
}

export const useRelatoriosData = (periodo: string, customStart?: Date, customEnd?: Date) => {
  const [loading, setLoading] = useState(true);
  const [dataReceitas, setDataReceitas] = useState<{name: string; value: number}[]>([]);
  const [dataDespesas, setDataDespesas] = useState<{name: string; value: number}[]>([]);
  const [dataFluxo, setDataFluxo] = useState<{name: string; receitas: number; despesas: number}[]>([]);
  const [topReceitas, setTopReceitas] = useState<{name: string; value: number; percent: number}[]>([]);
  const [topDespesas, setTopDespesas] = useState<{name: string; value: number; percent: number}[]>([]);
  
  const fetchRelatoriosData = async () => {
    try {
      setLoading(true);
      
      const { dataInicio, dataFim } = calcDateRange(periodo as Periodo, customStart, customEnd);
      const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
      const dataFimStr = format(dataFim, 'yyyy-MM-dd');
      
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select(`*, categoria:categoria_id(nome)`)
        .gte('data_vencimento', dataInicioStr)
        .lte('data_vencimento', dataFimStr);
      
      if (error) throw error;
      
      if (lancamentos && lancamentos.length > 0) {
        const receitasPorCategoria = processarPorCategoria(lancamentos, 'receita');
        setDataReceitas(receitasPorCategoria);
        
        const despesasPorCategoria = processarPorCategoria(lancamentos, 'despesa');
        setDataDespesas(despesasPorCategoria);
        
        const fluxo = processarFluxoPorMes(lancamentos);
        setDataFluxo(fluxo);

        // Top 5
        const totalRec = receitasPorCategoria.reduce((s, i) => s + i.value, 0);
        setTopReceitas(
          [...receitasPorCategoria]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map(i => ({ ...i, percent: totalRec > 0 ? (i.value / totalRec) * 100 : 0 }))
        );

        const totalDesp = despesasPorCategoria.reduce((s, i) => s + i.value, 0);
        setTopDespesas(
          [...despesasPorCategoria]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map(i => ({ ...i, percent: totalDesp > 0 ? (i.value / totalDesp) * 100 : 0 }))
        );
      } else {
        setDataReceitas([]);
        setDataDespesas([]);
        setDataFluxo([]);
        setTopReceitas([]);
        setTopDespesas([]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
    }
  };
  
  const processarPorCategoria = (lancamentos: any[], tipo: 'receita' | 'despesa') => {
    const filtrados = lancamentos.filter(l => l.tipo === tipo);
    const categorias: Record<string, number> = {};
    filtrados.forEach(l => {
      const nome = l.categoria?.nome || 'Sem categoria';
      categorias[nome] = (categorias[nome] || 0) + (Number(l.valor) || 0);
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  };
  
  const processarFluxoPorMes = (lancamentos: any[]) => {
    const meses: Record<string, { receitas: number; despesas: number }> = {};
    
    lancamentos.forEach(l => {
      const mesKey = l.data_vencimento?.substring(0, 7); // yyyy-MM
      if (!mesKey) return;
      if (!meses[mesKey]) meses[mesKey] = { receitas: 0, despesas: 0 };
      const valor = Number(l.valor) || 0;
      if (l.tipo === 'receita') meses[mesKey].receitas += valor;
      else meses[mesKey].despesas += valor;
    });

    return Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [year, month] = key.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return {
          name: format(date, "MMM/yy", { locale: ptBR }),
          receitas: val.receitas,
          despesas: val.despesas,
        };
      });
  };
  
  useEffect(() => {
    fetchRelatoriosData();
  }, [periodo, customStart?.getTime(), customEnd?.getTime()]);
  
  return {
    loading,
    dataReceitas,
    dataDespesas,
    dataFluxo,
    topReceitas,
    topDespesas,
    fetchRelatoriosData
  };
};
