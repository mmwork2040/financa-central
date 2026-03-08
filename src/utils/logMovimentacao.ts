import { supabase } from "@/integrations/supabase/client";

interface LogMovimentacaoParams {
  conta_bancaria_id: string;
  empresa_id: string | null;
  tipo: "receita" | "despesa" | "transferencia_entrada" | "transferencia_saida" | "recalculo" | "ajuste";
  descricao: string;
  valor: number;
  saldo_anterior: number;
  saldo_posterior: number;
  lancamento_id?: string | null;
}

export async function logMovimentacao(params: LogMovimentacaoParams) {
  try {
    await supabase.from("movimentacoes_conta").insert([{
      conta_bancaria_id: params.conta_bancaria_id,
      empresa_id: params.empresa_id,
      tipo: params.tipo,
      descricao: params.descricao,
      valor: params.valor,
      saldo_anterior: params.saldo_anterior,
      saldo_posterior: params.saldo_posterior,
      lancamento_id: params.lancamento_id || null,
    } as any]);
  } catch (e) {
    console.error("Erro ao registrar movimentação:", e);
  }
}
