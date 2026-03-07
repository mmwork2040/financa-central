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

    // Validate required fields before calling API
    const missingFields: string[] = [];
    if (!venda.cliente?.trim()) missingFields.push("Nome do cliente");
    const documento = (venda.cliente_documento || "").replace(/\D/g, "");
    if (documento.length < 11) missingFields.push("CPF/CNPJ válido do cliente");
    if (!venda.produto?.trim()) missingFields.push("Nome do produto");
    if (!venda.valor_bruto || Number(venda.valor_bruto) <= 0) missingFields.push("Valor bruto > 0");

    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        error: "Dados obrigatórios ausentes para emissão",
        details: `Campos faltando: ${missingFields.join(", ")}`,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const valorBruto = Number(venda.valor_bruto);
    const dataVenda = venda.data_venda ? new Date(venda.data_venda).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

    // Map venda to Spedy payload (matching Spedy API required fields)
    const payload = {
      date: dataVenda,
      amount: valorBruto,
      customer: {
        name: venda.cliente,
        document: documento,
        email: venda.cliente_email || undefined,
        phone: venda.cliente_telefone || undefined,
        address: venda.cliente_endereco ? { street: venda.cliente_endereco } : undefined,
      },
      items: [
        {
          product: venda.produto,
          description: venda.produto,
          price: valorBruto,
          amount: 1,
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
    const spedyUrl = `${spedyConfig.api_url}/orders`;
    console.log("Spedy request URL:", spedyUrl);
    console.log("Spedy payload:", JSON.stringify(payload, null, 2));

    const spedyResponse = await fetch(spedyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": spedyConfig.api_key,
      },
      body: JSON.stringify(payload),
    });

    const spedyText = await spedyResponse.text();
    console.log("Spedy response status:", spedyResponse.status);
    console.log("Spedy response body:", spedyText);

    let spedyData: any;
    try {
      spedyData = JSON.parse(spedyText);
    } catch {
      spedyData = { message: spedyText };
    }

    if (!spedyResponse.ok) {
      const errorDetail = spedyData.message || spedyData.error || spedyText;
      // Rejected by Spedy
      await supabase
        .from("vendas_digitais")
        .update({
          invoice_status: "REJECTED",
          invoice_error_message: errorDetail,
        })
        .eq("id", venda_id);

      return new Response(JSON.stringify({
        error: "Erro na emissão",
        details: errorDetail,
        spedy_status: spedyResponse.status,
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
