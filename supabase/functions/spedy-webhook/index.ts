import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token ausente" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate token
    const { data: spedyConfig } = await supabase
      .from("spedy_config")
      .select("webhook_token")
      .eq("webhook_token", token)
      .limit(1)
      .single();

    if (!spedyConfig) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    console.log("Spedy webhook received:", JSON.stringify(body));

    const event = body.event || body.type;
    const orderId = body.order_id || body.data?.order_id || body.id;
    const pdfUrl = body.pdf_url || body.data?.pdf_url;
    const xmlUrl = body.xml_url || body.data?.xml_url;
    const errorMessage = body.error_message || body.data?.error_message || body.reason;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "order_id ausente no payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find venda by spedy_order_id
    const { data: venda } = await supabase
      .from("vendas_digitais")
      .select("id, empresa_id")
      .eq("spedy_order_id", orderId)
      .limit(1)
      .single();

    if (!venda) {
      console.warn("Venda não encontrada para spedy_order_id:", orderId);
      return new Response(JSON.stringify({ ok: true, warning: "Venda não encontrada" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine new status based on event
    let newStatus = "PROCESSING";
    const eventLower = (event || "").toLowerCase();

    if (eventLower.includes("authorized") || eventLower.includes("approved") || eventLower.includes("completed")) {
      newStatus = "AUTHORIZED";
    } else if (eventLower.includes("rejected") || eventLower.includes("denied") || eventLower.includes("error")) {
      newStatus = "REJECTED";
    } else if (eventLower.includes("canceled") || eventLower.includes("cancelled")) {
      newStatus = "CANCELED";
    }

    const updateData: Record<string, any> = { invoice_status: newStatus };

    if (newStatus === "AUTHORIZED") {
      if (pdfUrl) updateData.invoice_pdf_url = pdfUrl;
      if (xmlUrl) updateData.invoice_xml_url = xmlUrl;
      updateData.invoice_error_message = null;
    } else if (newStatus === "REJECTED") {
      updateData.invoice_error_message = errorMessage || "Nota rejeitada pela SEFAZ/Prefeitura";
    } else if (newStatus === "CANCELED") {
      updateData.invoice_error_message = errorMessage || "Nota cancelada";
    }

    await supabase
      .from("vendas_digitais")
      .update(updateData)
      .eq("id", venda.id);

    console.log(`Venda ${venda.id} atualizada para ${newStatus}`);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("spedy-webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
