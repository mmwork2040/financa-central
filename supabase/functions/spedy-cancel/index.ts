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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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

    const { venda_id, reason } = await req.json();
    if (!venda_id) {
      return new Response(JSON.stringify({ error: "venda_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const justificativa = (reason || "").toString().trim();
    if (justificativa.length < 15) {
      return new Response(
        JSON.stringify({ error: "Justificativa deve ter pelo menos 15 caracteres (exigência da SEFAZ)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: venda, error: vendaError } = await supabase
      .from("vendas_digitais")
      .select("*")
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda) {
      return new Response(JSON.stringify({ error: "Venda não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!venda.spedy_order_id) {
      return new Response(
        JSON.stringify({ error: "Nota não possui ID Spedy. Não é possível cancelar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (venda.invoice_status === "CANCELLED") {
      return new Response(JSON.stringify({ error: "Nota já está cancelada" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: spedyConfig } = await supabase
      .from("spedy_config")
      .select("*")
      .eq("ativo", true)
      .limit(1)
      .single();

    if (!spedyConfig?.api_key) {
      return new Response(
        JSON.stringify({ error: "Integração Spedy não configurada ou inativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Spedy cancellation endpoint
    const cancelUrl = `${spedyConfig.api_url}/orders/${venda.spedy_order_id}/cancel`;
    const payload = { reason: justificativa };

    console.log("Spedy cancel URL:", cancelUrl);
    const spedyResponse = await fetch(cancelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": spedyConfig.api_key,
      },
      body: JSON.stringify(payload),
    });

    const spedyText = await spedyResponse.text();
    let spedyData: any;
    try {
      spedyData = JSON.parse(spedyText);
    } catch {
      spedyData = { message: spedyText };
    }

    console.log("Spedy cancel response:", spedyResponse.status, spedyText);

    if (!spedyResponse.ok) {
      const errorDetail = spedyData.message || spedyData.error || spedyText;

      await supabase.from("logs_integracoes").insert({
        empresa_id: venda.empresa_id,
        plataforma: "spedy",
        evento: "spedy-cancel:rejected",
        status: "error",
        payload: {
          venda_id,
          request_url: cancelUrl,
          request_payload: payload,
          response_status: spedyResponse.status,
          response_body: spedyData,
        },
      });

      return new Response(
        JSON.stringify({
          error: "Erro ao cancelar a nota",
          details: errorDetail,
          spedy_status: spedyResponse.status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("vendas_digitais")
      .update({
        invoice_status: "CANCELLED",
        invoice_error_message: `Cancelada em ${new Date().toISOString()} - ${justificativa}`,
      })
      .eq("id", venda_id);

    await supabase.from("logs_integracoes").insert({
      empresa_id: venda.empresa_id,
      plataforma: "spedy",
      evento: "spedy-cancel:success",
      status: "success",
      payload: {
        venda_id,
        request_url: cancelUrl,
        request_payload: payload,
        response_status: spedyResponse.status,
        response_body: spedyData,
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Nota cancelada com sucesso", spedy: spedyData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("spedy-cancel error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
