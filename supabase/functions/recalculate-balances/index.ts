import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the user from the auth header to find their empresa_id
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user's empresa_id
    const { data: perfil } = await supabase
      .from("perfis")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (!perfil?.empresa_id) {
      return new Response(JSON.stringify({ error: "No empresa found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const empresaId = perfil.empresa_id;

    // Fetch all bank accounts for this empresa
    const { data: contas, error: contasError } = await supabase
      .from("contas_bancarias")
      .select("id, nome, saldo_inicial, saldo_atual")
      .eq("empresa_id", empresaId);

    if (contasError) throw contasError;
    if (!contas || contas.length === 0) {
      return new Response(JSON.stringify({ message: "No accounts found", corrections: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const contaIds = contas.map(c => c.id);

    // Fetch ALL paid/received lancamentos for these accounts
    const { data: lancamentos, error: lancError } = await supabase
      .from("lancamentos")
      .select("conta_bancaria_id, tipo, valor, status, origem")
      .in("conta_bancaria_id", contaIds)
      .in("status", ["pago", "recebido"]);

    if (lancError) throw lancError;

    let corrections = 0;
    const details: Array<{ conta: string; anterior: number; calculado: number; diferenca: number }> = [];

    for (const conta of contas) {
      const contaLancs = (lancamentos || []).filter(l => l.conta_bancaria_id === conta.id);

      let saldoCalculado = conta.saldo_inicial;

      for (const l of contaLancs) {
        // Determine if this transaction is a credit or debit to the account
        const isCredit = l.tipo === "receita"; // resgate, rentabilidade, reajuste are stored as tipo=receita
        const isDebit = l.tipo === "despesa" || l.tipo === "investimento";

        if (isCredit) {
          saldoCalculado += Number(l.valor);
        } else if (isDebit) {
          saldoCalculado -= Number(l.valor);
        }
      }

      // Round to avoid floating point issues
      saldoCalculado = Math.round(saldoCalculado * 100) / 100;
      const saldoAtual = Math.round(Number(conta.saldo_atual) * 100) / 100;
      const diferenca = Math.round((saldoCalculado - saldoAtual) * 100) / 100;

      if (Math.abs(diferenca) > 0.01) {
        // Update the account balance
        await supabase
          .from("contas_bancarias")
          .update({ saldo_atual: saldoCalculado })
          .eq("id", conta.id);

        // Log the correction
        await supabase.from("movimentacoes_conta").insert([{
          conta_bancaria_id: conta.id,
          empresa_id: empresaId,
          tipo: "recalculo",
          descricao: `Recálculo automático (divergência: ${diferenca.toFixed(2)})`,
          valor: diferenca,
          saldo_anterior: saldoAtual,
          saldo_posterior: saldoCalculado,
        }]);

        corrections++;
        details.push({
          conta: conta.nome,
          anterior: saldoAtual,
          calculado: saldoCalculado,
          diferenca,
        });
      }
    }

    return new Response(
      JSON.stringify({ message: "Recalculation complete", corrections, details }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
