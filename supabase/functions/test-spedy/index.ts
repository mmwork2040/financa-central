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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accept api_url and api_key from request body (test before saving)
    let bodyApiUrl = "";
    let bodyApiKey = "";
    let bodyAmbiente = "sandbox";
    try {
      const body = await req.json();
      bodyApiUrl = body.api_url || "";
      bodyApiKey = body.api_key || "";
      bodyAmbiente = body.ambiente || "sandbox";
    } catch {
      // No body provided, will fall back to DB config
    }

    let apiUrl = "";
    let apiKey = "";
    let ambiente = bodyAmbiente;

    if (bodyApiUrl && bodyApiKey) {
      // Use values from request body (test before saving)
      apiUrl = bodyApiUrl.replace(/\/+$/, "");
      apiKey = bodyApiKey;
    } else {
      // Fallback: fetch from spedy_config in DB
      const { data: config, error: configError } = await supabase
        .from("spedy_config")
        .select("*")
        .limit(1)
        .single();

      if (configError || !config) {
        return new Response(
          JSON.stringify({ success: false, status: "error", message: "Informe a URL e API Key ou salve a configuração primeiro." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      apiUrl = (config.api_url || "").replace(/\/+$/, "");
      apiKey = config.api_key || "";
      ambiente = config.ambiente || "sandbox";
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, status: "error", message: "API Key não configurada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test the Spedy API using /customers endpoint (works with any company key)
    const testUrl = `${apiUrl}/customers?page=1&pageSize=1`;
    console.log("Testing Spedy API:", testUrl, "Ambiente:", ambiente);

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();
    console.log("Spedy test response:", response.status, responseText);

    let message: string;
    let status: "success" | "error" | "warning";

    if (response.ok) {
      message = `Conexão com a Spedy (${ambiente}) validada com sucesso! API Key funcionando.`;
      status = "success";
    } else if (response.status === 401 || response.status === 403) {
      message = `API Key rejeitada pela Spedy (HTTP ${response.status}). Verifique se a chave está correta, ativa e corresponde ao ambiente (${ambiente}). Acesse: Perfil > Minha empresa > Credenciais da API.`;
      status = "error";
    } else {
      message = `Resposta inesperada da Spedy (HTTP ${response.status}). Detalhes: ${responseText.substring(0, 200)}`;
      status = "warning";
    }

    return new Response(
      JSON.stringify({ success: status === "success", status, message, http_status: response.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro ao testar Spedy:", error);
    return new Response(
      JSON.stringify({ success: false, status: "error", message: error.message || "Erro ao testar conexão" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
