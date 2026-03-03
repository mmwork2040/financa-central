import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: perfil } = await supabase
      .from("perfis")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (!perfil?.empresa_id) throw new Error("No empresa found");
    const empresaId = perfil.empresa_id;

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    // Find pending lancamentos from integrations where data_vencimento <= today
    const { data: pendentes, error: fetchError } = await supabase
      .from("lancamentos")
      .select("id, valor, tipo, conta_bancaria_id")
      .eq("empresa_id", empresaId)
      .eq("origem", "integracao")
      .eq("status", "pendente")
      .eq("tipo", "receita")
      .lte("data_vencimento", hojeStr);

    if (fetchError) throw fetchError;

    let converted = 0;

    for (const lanc of pendentes || []) {
      // Mark as paid
      const { error: updateError } = await supabase
        .from("lancamentos")
        .update({ status: "recebido", data_pagamento: hojeStr })
        .eq("id", lanc.id);

      if (updateError) {
        console.error("Erro ao atualizar lançamento:", updateError);
        continue;
      }

      // Update bank balance
      if (lanc.conta_bancaria_id) {
        const rpcTipo = lanc.tipo === "despesa" ? "despesa" : "receita";
        const { error: saldoError } = await supabase.rpc("update_saldo_conta", {
          _conta_id: lanc.conta_bancaria_id,
          _valor: lanc.valor,
          _tipo: rpcTipo,
        });

        if (saldoError) {
          // Fallback: manual update
          const { data: contaAtual } = await supabase
            .from("contas_bancarias")
            .select("saldo_atual")
            .eq("id", lanc.conta_bancaria_id)
            .single();

          if (contaAtual) {
            const novoSaldo = lanc.tipo === "despesa"
              ? contaAtual.saldo_atual - lanc.valor
              : contaAtual.saldo_atual + lanc.valor;
            await supabase
              .from("contas_bancarias")
              .update({ saldo_atual: novoSaldo })
              .eq("id", lanc.conta_bancaria_id);
          }
        }
      }

      converted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        converted,
        message: `${converted} recebimento(s) digital(is) convertido(s) para recebido.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
