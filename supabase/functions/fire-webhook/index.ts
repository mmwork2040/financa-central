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

    const { empresa_id, evento, data, valor, descricao } = await req.json();

    if (!empresa_id || !evento) {
      throw new Error("empresa_id and evento are required");
    }

    // Get active webhooks for this event and empresa
    const { data: webhooks, error } = await supabase
      .from("webhooks_empresa")
      .select("*")
      .eq("empresa_id", empresa_id)
      .eq("evento", evento)
      .eq("ativo", true);

    if (error) throw error;

    const payload = {
      empresa_id,
      evento,
      data: data || new Date().toISOString().split("T")[0],
      valor: valor || "0",
      descricao: descricao || "",
      timestamp: new Date().toISOString(),
    };

    const results = [];

    for (const wh of webhooks || []) {
      try {
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
          payload: { url: wh.url, status: response.status, ...payload },
        });

        results.push({ url: wh.url, status: response.status, ok: response.ok });
      } catch (err: any) {
        await supabase.from("logs_integracoes").insert({
          empresa_id,
          plataforma: "webhook",
          evento,
          status: "error",
          payload: { url: wh.url, error: err.message, ...payload },
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
