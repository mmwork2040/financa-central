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

    // Search webhooks matching by nome (ação) AND tabela together
    let webhooks: any[] = [];

    if (tabela) {
      // Try matching both nome + tabela
      const { data: matched } = await supabase
        .from("webhooks_empresa")
        .select("*")
        .eq("empresa_id", empresa_id)
        .eq("ativo", true)
        .eq("nome", evento)
        .eq("tabela", tabela);
      webhooks = matched || [];
    }

    // Fallback: match by nome only (no tabela filter)
    if (webhooks.length === 0) {
      const { data: byNome } = await supabase
        .from("webhooks_empresa")
        .select("*")
        .eq("empresa_id", empresa_id)
        .eq("ativo", true)
        .eq("nome", evento);
      webhooks = byNome || [];
    }

    // Fallback: match by evento field
    if (webhooks.length === 0) {
      const { data: byEvento } = await supabase
        .from("webhooks_empresa")
        .select("*")
        .eq("empresa_id", empresa_id)
        .eq("evento", evento)
        .eq("ativo", true);
      webhooks = byEvento || [];
    }

    const results = [];

    for (const wh of webhooks) {
      try {
        // Build payload from template or default
        let payload: Record<string, any>;

        if (wh.payload_json) {
          try {
            let payloadStr = wh.payload_json;
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

        let responseBody: any = null;
        let campoRespostaValue: any = null;

        try {
          responseBody = await response.json();
          // Extract campo_resposta value from response if configured
          if (wh.campo_resposta && responseBody) {
            campoRespostaValue = responseBody[wh.campo_resposta] ?? null;
          }
        } catch {
          // Response is not JSON
        }

        // Log the integration
        await supabase.from("logs_integracoes").insert({
          empresa_id,
          plataforma: "webhook",
          evento,
          status: response.ok ? "success" : "error",
          payload: { url: wh.url, status: response.status, webhook_nome: wh.nome, response: responseBody, ...payload },
        });

        results.push({
          url: wh.url,
          status: response.status,
          ok: response.ok,
          webhook_nome: wh.nome,
          campo_resposta: wh.campo_resposta,
          campo_resposta_value: campoRespostaValue,
          comportamento: wh.comportamento,
          response: responseBody,
        });
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
