import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_EVENTS: Record<string, string[]> = {
  hotmart: ["purchase_approved", "purchase_refunded", "purchase_canceled", "purchase_delayed", "purchase_expired", "subscription_cancellation"],
  eduzz: ["sale_approved", "sale_refunded", "sale_canceled", "sale_waiting_payment"],
  monetizze: ["sale_completed", "sale_refunded", "sale_canceled", "sale_awaiting"],
  stripe: ["payment_intent.succeeded", "payment_intent.payment_failed", "charge.refunded", "invoice.paid", "invoice.payment_failed"],
  paypal: ["PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.DENIED"],
  asaas: ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_REFUNDED", "PAYMENT_OVERDUE"],
  meta_ads: ["ad_spend_update", "campaign_status_change"],
  google_ads: ["ad_spend_update", "campaign_status_change"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Expected path: /webhook-receiver/<platform>
    const platform = pathParts[pathParts.length - 1];
    const empresaId = url.searchParams.get("empresa_id");

    if (!platform || platform === "webhook-receiver") {
      return new Response(
        JSON.stringify({ error: "Platform is required in the URL path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!empresaId) {
      return new Response(
        JSON.stringify({ error: "empresa_id query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the integration exists and is active
    const { data: integration, error: integError } = await supabase
      .from("integracoes")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("plataforma", platform)
      .eq("ativo", true)
      .maybeSingle();

    if (integError || !integration) {
      return new Response(
        JSON.stringify({ error: "Integration not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = { raw: await req.text() };
    }

    // Detect event type based on platform
    let evento = "unknown";
    if (platform === "hotmart") {
      evento = body?.event || body?.data?.purchase?.status || "hotmart_webhook";
    } else if (platform === "eduzz") {
      evento = body?.event_type || body?.trans_status || "eduzz_webhook";
    } else if (platform === "monetizze") {
      evento = body?.evento?.tipo_evento || "monetizze_webhook";
    } else if (platform === "stripe") {
      evento = body?.type || "stripe_webhook";
    } else if (platform === "paypal") {
      evento = body?.event_type || "paypal_webhook";
    } else if (platform === "asaas") {
      evento = body?.event || "asaas_webhook";
    } else {
      evento = body?.event || body?.type || `${platform}_webhook`;
    }

    // Log the webhook
    await supabase.from("logs_integracoes").insert({
      empresa_id: empresaId,
      plataforma: platform,
      evento,
      status: "success",
      payload: { source: "webhook_receiver", body, headers: Object.fromEntries(req.headers) },
    });

    return new Response(
      JSON.stringify({ success: true, platform, evento, message: "Webhook received and logged" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
