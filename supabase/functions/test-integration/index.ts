import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_ENDPOINTS: Record<string, { url: string; method: string; headers: (key: string, secret?: string) => Record<string, string>; buildBody?: (key: string, secret?: string) => string | undefined }> = {
  hotmart: {
    url: "https://developers.hotmart.com/payments/api/v1/sales/history?max_results=1",
    method: "GET",
    headers: (key, secret) => {
      // Hotmart uses OAuth2 - we'd need a token first, so we test the token endpoint
      return { "Content-Type": "application/json" };
    },
  },
  stripe: {
    url: "https://api.stripe.com/v1/balance",
    method: "GET",
    headers: (key) => ({
      "Authorization": `Bearer ${key}`,
    }),
  },
  paypal: {
    url: "https://api-m.paypal.com/v1/oauth2/token",
    method: "POST",
    headers: (key, secret) => ({
      "Authorization": `Basic ${btoa(`${key}:${secret || ""}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    buildBody: () => "grant_type=client_credentials",
  },
  asaas: {
    url: "https://api.asaas.com/v3/finance/balance",
    method: "GET",
    headers: (key) => ({
      "access_token": key,
    }),
  },
  eduzz: {
    url: "https://api2.eduzz.com/credential/generate_token",
    method: "GET",
    headers: (key) => ({
      "token": key,
    }),
  },
  monetizze: {
    url: "https://api.monetizze.com.br/2.1/transactions",
    method: "GET",
    headers: (key) => ({
      "X-Consumer-Key": key,
    }),
  },
  kiwify: {
    url: "https://api.kiwify.com.br/v1/transactions?page=1&limit=1",
    method: "GET",
    headers: (key) => ({
      "Authorization": `Bearer ${key}`,
    }),
  },
  meta_ads: {
    url: "https://graph.facebook.com/v19.0/me",
    method: "GET",
    headers: (key) => ({
      "Authorization": `Bearer ${key}`,
    }),
  },
  google_ads: {
    url: "https://www.googleapis.com/oauth2/v1/tokeninfo",
    method: "GET",
    headers: (key) => ({}),
  },
  whatsapp: {
    url: "https://graph.facebook.com/v19.0/me",
    method: "GET",
    headers: (key) => ({
      "Authorization": `Bearer ${key}`,
    }),
  },
  telegram: {
    url: "",  // built dynamically
    method: "GET",
    headers: () => ({}),
  },
  evolution_api: {
    url: "",  // built dynamically from api_secret (server URL)
    method: "GET",
    headers: (key) => ({
      "apikey": key,
    }),
  },
  lovable_ai: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    method: "POST",
    headers: () => ({
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY") || ""}`,
      "Content-Type": "application/json",
    }),
    buildBody: () => JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    }),
  },
  openai: {
    url: "https://api.openai.com/v1/models",
    method: "GET",
    headers: (key) => ({
      "Authorization": `Bearer ${key}`,
    }),
  },
  google_gemini: {
    url: "",  // built dynamically
    method: "GET",
    headers: () => ({}),
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/models",
    method: "GET",
    headers: (key) => ({
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    }),
  },
  deepseek: {
    url: "https://api.deepseek.com/models",
    method: "GET",
    headers: (key) => ({
      "Authorization": `Bearer ${key}`,
    }),
  },
  banco_inter: {
    url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
    method: "POST",
    headers: (key, secret) => ({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    buildBody: (key, secret) => `client_id=${key}&client_secret=${secret || ""}&grant_type=client_credentials&scope=extrato.read`,
  },
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plataforma, empresa_id } = await req.json();

    if (!plataforma || !empresa_id) {
      throw new Error("plataforma and empresa_id are required");
    }

    // Fetch the integration credentials using service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    let apiKey = "";
    let apiSecret: string | undefined;
    let selectedModel: string | undefined;

    // Lovable AI uses pre-configured key, no need to fetch from integracoes
    if (plataforma !== "lovable_ai") {
      const { data: integ, error: fetchError } = await adminSupabase
        .from("integracoes")
        .select("api_key_encrypted, api_secret_encrypted, ambiente, webhook_secret")
        .eq("empresa_id", empresa_id)
        .eq("plataforma", plataforma)
        .eq("ativo", true)
        .single();

      if (fetchError || !integ) {
        return new Response(
          JSON.stringify({ success: false, message: "Integração não encontrada ou inativa" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      apiKey = integ.api_key_encrypted || "";
      apiSecret = integ.api_secret_encrypted || undefined;
      selectedModel = integ.webhook_secret || undefined;
    }

    const testConfig = TEST_ENDPOINTS[plataforma];
    if (!testConfig) {
      return new Response(
        JSON.stringify({ success: false, message: "Teste não disponível para esta plataforma" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For Google Ads, append key as query param
    let testUrl = testConfig.url;
    if (plataforma === "google_ads") {
      testUrl = `${testConfig.url}?key=${apiKey}`;
    }
    // For Telegram, build URL dynamically with bot token
    if (plataforma === "telegram") {
      testUrl = `https://api.telegram.org/bot${apiKey}/getMe`;
    }
    // For Evolution API, build URL from server URL stored in api_secret
    if (plataforma === "evolution_api") {
      const serverUrl = (apiSecret || "").replace(/\/+$/, "");
      if (!serverUrl) {
        return new Response(
          JSON.stringify({ success: false, status: "error", message: "URL do servidor não configurada" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      testUrl = `${serverUrl}/instance/fetchInstances`;
    }
    // For Google Gemini, build URL with key as query param
    if (plataforma === "google_gemini") {
      testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    }
    // For Lovable AI, use the pre-configured key (no user key needed)
    if (plataforma === "lovable_ai") {
      // Headers are built in TEST_ENDPOINTS using env var directly
    }

    const fetchOptions: RequestInit = {
      method: testConfig.method,
      headers: testConfig.headers(apiKey, apiSecret),
    };

    if (testConfig.buildBody) {
      fetchOptions.body = testConfig.buildBody(apiKey, apiSecret);
    }

    const response = await fetch(testUrl, fetchOptions);

    const isSuccess = response.ok || response.status === 401 && plataforma === "hotmart";
    // Some APIs return 403 for valid keys with limited permissions - that still means key is valid
    const validStatuses = [200, 201, 202, 204];
    const partiallyValid = [401, 403];

    let message: string;
    let status: "success" | "error" | "warning";

    if (validStatuses.includes(response.status)) {
      message = "Conexão validada com sucesso! Credenciais funcionando.";
      status = "success";
    } else if (partiallyValid.includes(response.status)) {
      message = `Credenciais rejeitadas pela API (HTTP ${response.status}). Verifique se a chave está correta e ativa.`;
      status = "error";
    } else {
      message = `Resposta inesperada da API (HTTP ${response.status}). Verifique suas credenciais.`;
      status = "warning";
    }

    // Log the test (only if logs are enabled for this empresa)
    const { data: empresaConfig } = await adminSupabase
      .from("empresas")
      .select("logs_enabled")
      .eq("id", empresa_id)
      .single();
    
    if (empresaConfig?.logs_enabled !== false) {
      await adminSupabase.from("logs_integracoes").insert({
        empresa_id,
        plataforma,
        evento: "test_connection",
        status: status === "success" ? "success" : "error",
        payload: { http_status: response.status, message },
      });
    }

    return new Response(
      JSON.stringify({ success: status === "success", status, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, status: "error", message: error.message || "Erro ao testar conexão" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
