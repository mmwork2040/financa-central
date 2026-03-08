import React, { useState, useEffect } from "react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { CheckCircle2, Clock, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const LancamentosSummary = () => {
  const { lancamentos } = useLancamentosContext();
  const { visible } = useValuesVisibility();
  const [saldoCaixa, setSaldoCaixa] = useState(0);

  const fetchSaldo = async () => {
    const { data } = await supabase.from('contas_bancarias').select('saldo_atual');
    setSaldoCaixa(data?.reduce((acc, c) => acc + (c.saldo_atual || 0), 0) || 0);
  };

  useEffect(() => {
    fetchSaldo();
    const channel = supabase
      .channel('lancamentos-saldo-caixa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_bancarias' }, () => fetchSaldo())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  const receitasExecutadas = lancamentos
    .filter(l => l.tipo === "receita" && (l.status === "pago" || l.status === "recebido"))
    .reduce((sum, item) => sum + item.valor, 0);

  const despesasExecutadas = lancamentos
    .filter(l => l.tipo === "despesa" && l.status === "pago")
    .reduce((sum, item) => sum + item.valor, 0);

  const receitasPrevistas = lancamentos
    .filter(l => l.tipo === "receita" && l.status === "pendente")
    .reduce((sum, item) => sum + item.valor, 0);

  const despesasPrevistas = lancamentos
    .filter(l => l.tipo === "despesa" && l.status === "pendente")
    .reduce((sum, item) => sum + item.valor, 0);

  const countExecReceitas = lancamentos.filter(l => l.tipo === "receita" && (l.status === "pago" || l.status === "recebido")).length;
  const countExecDespesas = lancamentos.filter(l => l.tipo === "despesa" && l.status === "pago").length;
  const countPrevReceitas = lancamentos.filter(l => l.tipo === "receita" && l.status === "pendente").length;
  const countPrevDespesas = lancamentos.filter(l => l.tipo === "despesa" && l.status === "pendente").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
      <SummaryCard
        title="Saldo em Caixa"
        value={formatCurrency(saldoCaixa)}
        description="Todas as contas"
        icon={Landmark}
        iconColor={saldoCaixa >= 0 ? "text-primary" : "text-destructive"}
        isCurrency
      />
      <SummaryCard
        title="Receitas Executadas"
        value={formatCurrency(receitasExecutadas)}
        description={`${countExecReceitas} recebidos`}
        icon={CheckCircle2}
        iconColor="text-green-600"
        isCurrency
      />
      <SummaryCard
        title="Despesas Executadas"
        value={formatCurrency(despesasExecutadas)}
        description={`${countExecDespesas} pagos`}
        icon={CheckCircle2}
        iconColor="text-destructive"
        isCurrency
      />
      <SummaryCard
        title="Receitas Previstas"
        value={formatCurrency(receitasPrevistas)}
        description={`${countPrevReceitas} pendentes`}
        icon={Clock}
        iconColor="text-amber-500"
        isCurrency
      />
      <SummaryCard
        title="Despesas Previstas"
        value={formatCurrency(despesasPrevistas)}
        description={`${countPrevDespesas} pendentes`}
        icon={Clock}
        iconColor="text-amber-500"
        isCurrency
      />
    </div>
  );
};
