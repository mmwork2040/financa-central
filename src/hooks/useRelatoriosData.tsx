
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isPending, isExecuted } from "@/utils/lancamentoStatus";

export interface RelatorioData {
  dataReceitas: {name: string; value: number}[];
  dataDespesas: {name: string; value: number}[];
  dataFluxo: {name: string; receitas: number; despesas: number; receitasPrevistas: number; despesasPrevistas: number}[];
  topReceitas: {name: string; value: number; percent: number}[];
  topDespesas: {name: string; value: number; percent: number}[];
  receitasExecutadas: number;
  receitasPrevistas: number;
  despesasExecutadas: number;
  despesasPrevistas: number;
}

type Periodo = 'mes' | 'trimestre' | 'semestre' | 'ano' | 'proximo_mes' | 'proximos_3' | 'proximos_6' | 'proximos_12' | 'personalizado';

function calcDateRange(periodo: Periodo, customStart?: Date, customEnd?: Date): { dataInicio: Date; dataFim: Date } {
  const hoje = new Date();
  switch (periodo) {
    case 'mes': return { dataInicio: addMonths(hoje, -1), dataFim: hoje };
    case 'trimestre': return { dataInicio: addMonths(hoje, -3), dataFim: hoje };
    case 'semestre': return { dataInicio: addMonths(hoje, -6), dataFim: hoje };
    case 'ano': return { dataInicio: addMonths(hoje, -12), dataFim: hoje };
    case 'proximo_mes': return { dataInicio: hoje, dataFim: addMonths(hoje, 1) };
    case 'proximos_3': return { dataInicio: hoje, dataFim: addMonths(hoje, 3) };
    case 'proximos_6': return { dataInicio: hoje, dataFim: addMonths(hoje, 6) };
    case 'proximos_12': return { dataInicio: hoje, dataFim: addMonths(hoje, 12) };
    case 'personalizado':
      return { dataInicio: customStart || addMonths(hoje, -1), dataFim: customEnd || hoje };
    default: return { dataInicio: addMonths(hoje, -1), dataFim: hoje };
  }
}

export const useRelatoriosData = (periodo: string, customStart?: Date, customEnd?: Date) => {
  const [loading, setLoading] = useState(true);
  const [dataReceitas, setDataReceitas] = useState<{name: string; value: number}[]>([]);
  const [dataDespesas, setDataDespesas] = useState<{name: string; value: number}[]>([]);
  const [dataFluxo, setDataFluxo] = useState<{name: string; receitas: number; despesas: number; receitasPrevistas: number; despesasPrevistas: number}[]>([]);
  const [topReceitas, setTopReceitas] = useState<{name: string; value: number; percent: number}[]>([]);
  const [topDespesas, setTopDespesas] = useState<{name: string; value: number; percent: number}[]>([]);
  const [receitasExecutadas, setReceitasExecutadas] = useState(0);
  const [receitasPrevistas, setReceitasPrevistas] = useState(0);
  const [despesasExecutadas, setDespesasExecutadas] = useState(0);
  const [despesasPrevistas, setDespesasPrevistas] = useState(0);

  const fetchRelatoriosData = async () => {
    try {
      setLoading(true);
      const { dataInicio, dataFim } = calcDateRange(periodo as Periodo, customStart, customEnd);
      const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
      const dataFimStr = format(dataFim, 'yyyy-MM-dd');

      // Fetch lancamentos and vendas_digitais in parallel
      const [lancamentosRes, vendasRes] = await Promise.all([
        supabase
          .from('lancamentos')
          .select(`*, categoria:categoria_id(nome)`)
          .gte('data_vencimento', dataInicioStr)
          .lte('data_vencimento', dataFimStr),
        supabase
          .from('vendas_digitais')
          .select('*')
          .gte('data_venda', dataInicioStr)
          .lte('data_venda', dataFimStr),
      ]);

      if (lancamentosRes.error) throw lancamentosRes.error;
      if (vendasRes.error) throw vendasRes.error;

      // Filter out transfer movements — internal and should not count as income/expense
      const lancamentos = (lancamentosRes.data || []).filter((l: any) => l.origem !== 'transferencia');
      const vendas = vendasRes.data || [];

      // Filter out vendas that already have a lancamento_id (avoid double counting)
      const vendasSemDuplicidade = vendas.filter(v => !v.lancamento_id);

      // --- Calcular executado vs previsto ---
      let recExec = 0, recPrev = 0, despExec = 0, despPrev = 0;

      lancamentos.forEach(l => {
        const valor = Number(l.valor) || 0;
        if (l.tipo === 'receita') {
          if (isExecuted(l.status)) recExec += valor;
          else if (isPending(l.status)) recPrev += valor;
        } else {
          if (isExecuted(l.status)) despExec += valor;
          else if (isPending(l.status)) despPrev += valor;
        }
      });

      // Vendas digitais como receitas
      vendasSemDuplicidade.forEach(v => {
        const valor = Number(v.valor_liquido) || 0;
        if (v.status === 'recebido') recExec += valor;
        else recPrev += valor; // aprovada, pendente = prevista
      });

      setReceitasExecutadas(recExec);
      setReceitasPrevistas(recPrev);
      setDespesasExecutadas(despExec);
      setDespesasPrevistas(despPrev);

      // --- Receitas por categoria (incluindo vendas digitais por plataforma) ---
      const receitasPorCategoria = processarPorCategoria(lancamentos, 'receita');
      // Adicionar vendas digitais agrupadas por plataforma
      const vendasPorPlataforma: Record<string, number> = {};
      vendasSemDuplicidade.forEach(v => {
        const plat = v.plataforma || 'Plataforma Digital';
        vendasPorPlataforma[plat] = (vendasPorPlataforma[plat] || 0) + (Number(v.valor_liquido) || 0);
      });
      const receitasComVendas = [...receitasPorCategoria];
      Object.entries(vendasPorPlataforma).forEach(([name, value]) => {
        const existing = receitasComVendas.find(r => r.name === name);
        if (existing) existing.value += value;
        else receitasComVendas.push({ name, value });
      });
      setDataReceitas(receitasComVendas);

      const despesasPorCategoria = processarPorCategoria(lancamentos, 'despesa');
      setDataDespesas(despesasPorCategoria);

      // --- Fluxo por mês (incluindo vendas digitais) ---
      const fluxo = processarFluxoPorMes(lancamentos, vendasSemDuplicidade);
      setDataFluxo(fluxo);

      // --- Top 5 ---
      const totalRec = receitasComVendas.reduce((s, i) => s + i.value, 0);
      setTopReceitas(
        [...receitasComVendas]
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

  const processarFluxoPorMes = (lancamentos: any[], vendas: any[]) => {
    const meses: Record<string, { receitas: number; despesas: number; receitasPrevistas: number; despesasPrevistas: number }> = {};

    lancamentos.forEach(l => {
      const mesKey = l.data_vencimento?.substring(0, 7);
      if (!mesKey) return;
      if (!meses[mesKey]) meses[mesKey] = { receitas: 0, despesas: 0, receitasPrevistas: 0, despesasPrevistas: 0 };
      const valor = Number(l.valor) || 0;
      const executado = isExecuted(l.status);

      if (l.tipo === 'receita') {
        if (executado) meses[mesKey].receitas += valor;
        else if (isPending(l.status)) meses[mesKey].receitasPrevistas += valor;
      } else {
        if (executado) meses[mesKey].despesas += valor;
        else if (isPending(l.status)) meses[mesKey].despesasPrevistas += valor;
      }
    });

    // Adicionar vendas digitais
    vendas.forEach(v => {
      const dataStr = typeof v.data_venda === 'string' ? v.data_venda : '';
      const mesKey = dataStr.substring(0, 7);
      if (!mesKey) return;
      if (!meses[mesKey]) meses[mesKey] = { receitas: 0, despesas: 0, receitasPrevistas: 0, despesasPrevistas: 0 };
      const valor = Number(v.valor_liquido) || 0;
      if (v.status === 'recebido') meses[mesKey].receitas += valor;
      else meses[mesKey].receitasPrevistas += valor;
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
          receitasPrevistas: val.receitasPrevistas,
          despesasPrevistas: val.despesasPrevistas,
        };
      });
  };

  useEffect(() => {
    fetchRelatoriosData();
  }, [periodo, customStart?.getTime(), customEnd?.getTime()]);

  // Realtime listener for lancamentos changes
  useEffect(() => {
    const channel = supabase
      .channel('relatorios-lancamentos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lancamentos' },
        () => {
          fetchRelatoriosData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [periodo, customStart?.getTime(), customEnd?.getTime()]);

  return {
    loading,
    dataReceitas,
    dataDespesas,
    dataFluxo,
    topReceitas,
    topDespesas,
    receitasExecutadas,
    receitasPrevistas,
    despesasExecutadas,
    despesasPrevistas,
    fetchRelatoriosData,
  };
};
