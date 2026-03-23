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

    const today = new Date().toISOString().split("T")[0];

    // Find all pending lancamentos where data_vencimento < today and no data_pagamento
    const { data: overdue, error: fetchError } = await supabase
      .from("lancamentos")
      .select("id, descricao, valor, data_vencimento, empresa_id, tipo")
      .in("status", ["pendente", "aberto"])
      .lt("data_vencimento", today)
      .is("data_pagamento", null);

    if (fetchError) throw fetchError;

    if (!overdue || overdue.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0, message: "Nenhum lançamento vencido encontrado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const overdueIds = overdue.map((l) => l.id);

    // Update status to "vencido"
    const { error: updateError } = await supabase
      .from("lancamentos")
      .update({ status: "vencido" })
      .in("id", overdueIds);

    if (updateError) throw updateError;

    // Group overdue by empresa_id to create notifications per company
    const byEmpresa: Record<string, typeof overdue> = {};
    for (const l of overdue) {
      if (!l.empresa_id) continue;
      if (!byEmpresa[l.empresa_id]) byEmpresa[l.empresa_id] = [];
      byEmpresa[l.empresa_id].push(l);
    }

    let notificationsCreated = 0;

    for (const [empresaId, lancamentos] of Object.entries(byEmpresa)) {
      // Get all users of this empresa to notify them
      const { data: users } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("empresa_id", empresaId);

      if (!users || users.length === 0) continue;

      const uniqueUserIds = [...new Set(users.map((u) => u.user_id))];

      // Create summary notification per user
      const totalValor = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0);
      const count = lancamentos.length;
      const valorFormatado = totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const titulo = count === 1
        ? `⚠️ 1 lançamento vencido`
        : `⚠️ ${count} lançamentos vencidos`;

      const descricoes = lancamentos.slice(0, 3).map((l) => l.descricao).join(", ");
      const mensagem = count <= 3
        ? `${descricoes} — Total: ${valorFormatado}`
        : `${descricoes} e mais ${count - 3} — Total: ${valorFormatado}`;

      const notificacoes = uniqueUserIds.map((userId) => ({
        user_id: userId,
        empresa_id: empresaId,
        titulo,
        mensagem,
        tipo: "lancamento_vencido",
        lida: false,
      }));

      const { error: notifError } = await supabase
        .from("notificacoes")
        .insert(notificacoes);

      if (!notifError) notificationsCreated += notificacoes.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: overdueIds.length,
        notifications: notificationsCreated,
        message: `${overdueIds.length} lançamento(s) marcado(s) como vencido(s). ${notificationsCreated} notificação(ões) criada(s).`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro ao verificar lançamentos vencidos:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
