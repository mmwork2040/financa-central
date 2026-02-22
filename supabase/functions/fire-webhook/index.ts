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

    const { empresa_id, evento, tabela, data, valor, descricao, usuario, acao, registro } = await req.json();

    if (!empresa_id || !evento) {
      throw new Error("empresa_id and evento are required");
    }

    // Build query - match by evento (nome da ação) and optionally by tabela
    let query = supabase
      .from("webhooks_empresa")
      .select("*")
      .eq("empresa_id", empresa_id)
      .eq("ativo", true);

    // Try to match by nome (ação) first, fallback to evento
    const { data: webhooksByNome } = await query.eq("nome", evento);
    
    let webhooks = webhooksByNome || [];

    // If no match by nome, try by evento field
    if (webhooks.length === 0) {
      const { data: webhooksByEvento } = await supabase
        .from("webhooks_empresa")
        .select("*")
        .eq("empresa_id", empresa_id)
        .eq("evento", evento)
        .eq("ativo", true);
      webhooks = webhooksByEvento || [];
    }

    // If tabela is provided, also try matching webhooks configured for that tabela
    if (tabela && webhooks.length === 0) {
      const { data: webhooksByTabela } = await supabase
        .from("webhooks_empresa")
        .select("*")
        .eq("empresa_id", empresa_id)
        .eq("tabela", tabela)
        .eq("ativo", true);
      webhooks = webhooksByTabela || [];
    }

    const results = [];

    for (const wh of webhooks) {
      try {
        // Use configured payload_json as template, or build default
        let payload: Record<string, any>;

        if (wh.payload_json) {
          try {
            let payloadStr = wh.payload_json;
            // Replace template variables
            const replacements: Record<string, string> = {
              "{{empresa_id}}": empresa_id || "",
              "{{timestamp}}": new Date().toISOString(),
              "{{registro_id}}": registro || "",
              "{{descricao}}": descricao || "",
              "{{valor}}": valor?.toString() || "",
              "{{user_id}}": usuario?.id || "",
              "{{user_nome}}": usuario?.nome || "",
              "{{user_email}}": usuario?.email || "",
              "{{user_telefone}}": usuario?.telefone || "",
              "{{nome}}": descricao || "",
              "{{email}}": usuario?.email || "",
              "{{cpf_cnpj}}": "",
              "{{tipo}}": acao || "",
              "{{data_vencimento}}": data || "",
              "{{banco}}": "",
              "{{assunto}}": descricao || "",
              "{{mensagem}}": descricao || "",
            };

            for (const [key, val] of Object.entries(replacements)) {
              payloadStr = payloadStr.replaceAll(key, val);
            }

            payload = JSON.parse(payloadStr);
          } catch {
            // Fallback if template parsing fails
            payload = { empresa_id, evento, descricao, usuario, acao, registro, timestamp: new Date().toISOString() };
          }
        } else {
          payload = { empresa_id, evento, descricao, usuario, acao, registro, timestamp: new Date().toISOString() };
        }

        const response = await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Log the integration
        await supabase.from("logs_integracoes").insert({
          empresa_id,
          plataforma: "webhook",
          evento,
          status: response.ok ? "success" : "error",
          payload: { url: wh.url, status: response.status, webhook_nome: wh.nome, ...payload },
        });

        results.push({ url: wh.url, status: response.status, ok: response.ok, webhook_nome: wh.nome });
      } catch (err: any) {
        await supabase.from("logs_integracoes").insert({
          empresa_id,
          plataforma: "webhook",
          evento,
          status: "error",
          payload: { url: wh.url, error: err.message },
        });
        results.push({ url: wh.url, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, webhooks_fired: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
