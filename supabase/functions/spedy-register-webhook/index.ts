import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch spedy_config
    const { data: config, error: configError } = await supabase
      .from("spedy_config")
      .select("*")
      .limit(1)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Configuração da Spedy não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookCallbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/spedy-webhook?token=${config.webhook_token}`;

    // Register webhook on Spedy API
    const spedyRes = await fetch(`${config.api_url}/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": config.api_key,
      },
      body: JSON.stringify({
        event: "invoice.status_changed",
        url: webhookCallbackUrl,
      }),
    });

    const spedyBody = await spedyRes.text();
    let spedyJson: any;
    try {
      spedyJson = JSON.parse(spedyBody);
    } catch {
      spedyJson = { raw: spedyBody };
    }

    if (!spedyRes.ok) {
      // If already registered (409 or similar), treat as success
      if (spedyRes.status === 409 || spedyBody.includes("already")) {
        return new Response(
          JSON.stringify({ success: true, message: "Webhook já estava registrado na Spedy.", detail: spedyJson }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao registrar webhook na Spedy.", status: spedyRes.status, detail: spedyJson }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook registrado na Spedy com sucesso.", detail: spedyJson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
