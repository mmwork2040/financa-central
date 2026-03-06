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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { venda_id } = await req.json();
    if (!venda_id) {
      return new Response(JSON.stringify({ error: "venda_id é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get venda
    const { data: venda, error: vendaError } = await supabase
      .from("vendas_digitais")
      .select("*")
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda) {
      return new Response(JSON.stringify({ error: "Venda não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotency: block if already processing or authorized
    if (venda.invoice_status && !["PENDING_EMISSION", "REJECTED"].includes(venda.invoice_status)) {
      return new Response(JSON.stringify({ error: "Nota já em processamento ou emitida" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get Spedy config
    const { data: spedyConfig } = await supabase
      .from("spedy_config")
      .select("*")
      .eq("ativo", true)
      .limit(1)
      .single();

    if (!spedyConfig || !spedyConfig.api_key) {
      return new Response(JSON.stringify({ error: "Integração Spedy não configurada ou inativa" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Map venda to Spedy payload
    const payload = {
      customer: {
        name: venda.cliente || "Consumidor Final",
        document: (venda.cliente_documento || "").replace(/\D/g, ""),
        email: venda.cliente_email || undefined,
        phone: venda.cliente_telefone || undefined,
        address: venda.cliente_endereco ? { street: venda.cliente_endereco } : undefined,
      },
      items: [
        {
          description: venda.produto || "Produto Digital",
          unit_price: Number(venda.valor_bruto) || 0,
          quantity: 1,
        },
      ],
      metadata: {
        venda_id: venda.id,
        empresa_id: venda.empresa_id,
      },
    };

    // Mark as PROCESSING before calling API
    await supabase
      .from("vendas_digitais")
      .update({ invoice_status: "PROCESSING" })
      .eq("id", venda_id);

    // Call Spedy API
    const spedyResponse = await fetch(`${spedyConfig.api_url}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": spedyConfig.api_key,
      },
      body: JSON.stringify(payload),
    });

    const spedyData = await spedyResponse.json();

    if (!spedyResponse.ok) {
      // Rejected by Spedy
      await supabase
        .from("vendas_digitais")
        .update({
          invoice_status: "REJECTED",
          invoice_error_message: spedyData.message || spedyData.error || JSON.stringify(spedyData),
        })
        .eq("id", venda_id);

      return new Response(JSON.stringify({
        error: "Erro na emissão",
        details: spedyData.message || spedyData.error,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save spedy_order_id
    await supabase
      .from("vendas_digitais")
      .update({
        spedy_order_id: spedyData.id || spedyData.order_id,
        invoice_status: "PROCESSING",
      })
      .eq("id", venda_id);

    return new Response(JSON.stringify({
      success: true,
      spedy_order_id: spedyData.id || spedyData.order_id,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("spedy-emit error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
