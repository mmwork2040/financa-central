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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Get user's empresa_id
    const { data: perfil } = await supabase
      .from("perfis")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (!perfil?.empresa_id) throw new Error("No empresa found");

    const empresaId = perfil.empresa_id;

    // Find recurring transactions that need new occurrences
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    const { data: recorrentes, error: fetchError } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("recorrente", true)
      .in("status", ["pago", "recebido"])
      .order("data_vencimento", { ascending: false });

    if (fetchError) throw fetchError;

    let created = 0;

    for (const lanc of recorrentes || []) {
      // Check if recurrence has ended
      if (lanc.recorrencia_fim && lanc.recorrencia_fim < hojeStr) continue;

      // Check max parcelas
      if (lanc.total_parcelas && lanc.parcela_atual && lanc.parcela_atual >= lanc.total_parcelas) continue;

      // Calculate next date based on recorrencia_tipo
      const lastDate = new Date(lanc.data_vencimento);
      let nextDate: Date;

      switch (lanc.recorrencia_tipo) {
        case "semanal":
          nextDate = new Date(lastDate);
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "quinzenal":
          nextDate = new Date(lastDate);
          nextDate.setDate(nextDate.getDate() + 15);
          break;
        case "mensal":
        default:
          nextDate = new Date(lastDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "trimestral":
          nextDate = new Date(lastDate);
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case "anual":
          nextDate = new Date(lastDate);
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      const nextDateStr = nextDate.toISOString().split("T")[0];

      // Check if this occurrence already exists
      const { data: existing } = await supabase
        .from("lancamentos")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("descricao", lanc.descricao)
        .eq("data_vencimento", nextDateStr)
        .eq("valor", lanc.valor)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Only generate if next date is within 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      if (nextDate > thirtyDaysFromNow) continue;

      // Create new occurrence
      const { error: insertError } = await supabase
        .from("lancamentos")
        .insert({
          empresa_id: empresaId,
          descricao: lanc.descricao,
          valor: lanc.valor,
          tipo: lanc.tipo,
          status: "pendente",
          data_vencimento: nextDateStr,
          categoria_id: lanc.categoria_id,
          fornecedor_id: lanc.fornecedor_id,
          cliente_id: lanc.cliente_id,
          conta_bancaria_id: lanc.conta_bancaria_id,
          forma_pagamento_id: lanc.forma_pagamento_id,
          recorrente: true,
          recorrencia_tipo: lanc.recorrencia_tipo,
          recorrencia_fim: lanc.recorrencia_fim,
          total_parcelas: lanc.total_parcelas,
          parcela_atual: lanc.parcela_atual ? lanc.parcela_atual + 1 : 1,
        });

      if (!insertError) created++;
    }

    return new Response(
      JSON.stringify({ success: true, created, message: `${created} lançamentos recorrentes gerados.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
