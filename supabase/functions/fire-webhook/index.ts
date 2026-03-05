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

    // ─── AUTHENTICATION ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("🚫 [fire-webhook] Acesso negado: sem Authorization header");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Allow service-to-service calls with service role key
    const isServiceCall = token === serviceRoleKey;

    if (!isServiceCall) {
      // Validate JWT for user calls
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims) {
        console.log("🚫 [fire-webhook] Acesso negado: JWT inválido");
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // JWT is valid — user is authenticated
      console.log(`✅ [fire-webhook] Autenticado: user ${claimsData.claims.sub}`);
    } else {
      console.log("✅ [fire-webhook] Autenticado via service role key");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    let { empresa_id, evento, tabela, data, valor, descricao, usuario, acao, registro, assunto, mensagem, conversa_id, nome, id_usuario, id_telegram, telefone, email } = body;

    // ─── UUID VALIDATION ───
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (empresa_id && !uuidRegex.test(empresa_id)) {
      return new Response(JSON.stringify({ error: "empresa_id deve ser um UUID válido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve user identity from nested 'usuario' object as fallback
    if (!id_usuario && usuario?.id) id_usuario = usuario.id;
    if (!nome && usuario?.nome) nome = usuario.nome;
    if (!email && usuario?.email) email = usuario.email;
    if (!telefone && usuario?.telefone) telefone = usuario.telefone;
    if (!id_telegram && usuario?.telegram_id) id_telegram = usuario.telegram_id;

    if (!empresa_id || !evento) {
      throw new Error("empresa_id and evento are required");
    }

    // Always enrich user data from perfis when we have id_usuario
    if (id_usuario) {
      const { data: perfilData } = await supabase
        .from("perfis")
        .select("telegram_id, nome, evolution_webhook_url, email")
        .eq("id", id_usuario)
        .single();
      if (perfilData) {
        if (!id_telegram) id_telegram = perfilData.telegram_id || "";
        if (!nome) nome = perfilData.nome;
        if (!telefone) telefone = perfilData.evolution_webhook_url;
        if (!email) email = perfilData.email;
      }
    }

    // Fetch empresa name and logs_enabled
    let empresaNome = "";
    let logsEnabled = true;
    const { data: empresaData } = await supabase
      .from("empresas")
      .select("nome, logs_enabled")
      .eq("id", empresa_id)
      .single();
    if (empresaData) {
      empresaNome = empresaData.nome;
      logsEnabled = empresaData.logs_enabled ?? true;
    }

    // Search webhooks matching globally (all empresas) by nome AND tabela
    let webhooks: any[] = [];

    if (tabela) {
      const { data: matched } = await supabase
        .from("webhooks_empresa")
        .select("*")
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
        .eq("ativo", true)
        .eq("nome", evento);
      webhooks = byNome || [];
    }

    // Fallback: match by evento field
    if (webhooks.length === 0) {
      const { data: byEvento } = await supabase
        .from("webhooks_empresa")
        .select("*")
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
              "{{empresa_nome}}": empresaNome || "",
              "{{timestamp}}": new Date().toISOString(),
              "{{registro_id}}": registro || "",
              "{{descricao}}": descricao || "",
              "{{valor}}": valor?.toString() || "",
              "{{user_id}}": id_usuario || usuario?.id || "",
              "{{user_nome}}": nome || usuario?.nome || "",
              "{{user_email}}": email || usuario?.email || "",
              "{{user_telefone}}": telefone || usuario?.telefone || "",
              "{{user_telegram_id}}": id_telegram || "",
              "{{nome}}": nome || descricao || "",
              "{{email}}": email || usuario?.email || "",
              "{{cpf_cnpj}}": "",
              "{{tabela}}": tabela || "",
              "{{tipo}}": acao || "",
              "{{data_vencimento}}": data || "",
              "{{banco}}": "",
              "{{assunto}}": assunto || descricao || "",
              "{{mensagem}}": mensagem || descricao || "",
              "{{conversa_id}}": conversa_id || "",
            };

            for (const [key, val] of Object.entries(replacements)) {
              payloadStr = payloadStr.replaceAll(key, val);
            }

            payload = JSON.parse(payloadStr);
          } catch {
            payload = { empresa_id, evento, descricao, nome, id_usuario, id_telegram, telefone, email, usuario, acao, registro, timestamp: new Date().toISOString() };
          }
        } else {
          payload = { empresa_id, evento, descricao, nome, id_usuario, id_telegram, telefone, email, usuario, acao, registro, timestamp: new Date().toISOString() };
        }

        const response = await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        let responseBody: any = null;
        let campoRespostaValue: any = null;

        try {
          const rawText = await response.text();
          console.log("Webhook raw response:", rawText);
          try {
            responseBody = JSON.parse(rawText);
          } catch {
            responseBody = rawText;
          }
          // Extract campo_resposta value from response
          if (wh.campo_resposta && responseBody) {
            let root: any = responseBody;
            if (Array.isArray(root)) {
              root = root[0];
            }
            if (root && typeof root === "object") {
              const parts = wh.campo_resposta.split(".");
              let current: any = root;
              for (const part of parts) {
                if (current == null) break;
                if (Array.isArray(current)) current = current[0];
                current = current[part];
              }
              campoRespostaValue = current ?? null;
            }
            console.log("campo_resposta:", wh.campo_resposta, "extracted value:", campoRespostaValue);
          }
        } catch (parseErr) {
          console.error("Error parsing response:", parseErr);
        }

        // Log the integration (only if logs are enabled)
        if (logsEnabled) {
          await supabase.from("logs_integracoes").insert({
            empresa_id,
            plataforma: "webhook",
            evento,
            status: response.ok ? "success" : "error",
            payload: { url: wh.url, status: response.status, webhook_nome: wh.nome, response: responseBody, ...payload },
          });
        }

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
        if (logsEnabled) {
          await supabase.from("logs_integracoes").insert({
            empresa_id,
            plataforma: "webhook",
            evento,
            status: "error",
            payload: { url: wh.url, error: err.message },
          });
        }
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
