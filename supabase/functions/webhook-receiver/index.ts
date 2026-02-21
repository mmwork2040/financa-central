import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SaleData {
  plataforma: string;
  evento: string;
  status: string;
  valor_bruto: number;
  taxa: number;
  valor_liquido: number;
  cliente: string | null;
  produto: string | null;
  data_venda: string;
  data_prevista_recebimento: string | null;
}

function normalizeDate(value: any): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "number") {
    // If it looks like milliseconds (> year 2000 in seconds)
    if (value > 1e12) return new Date(value).toISOString();
    // Otherwise treat as seconds
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === "string") {
    // Already ISO string or similar
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

// ─── Hotmart ───
function parseHotmart(body: any): SaleData | null {
  const purchase = body?.data?.purchase || body?.data || {};
  const buyer = body?.data?.buyer || {};
  const product = body?.data?.product || {};
  const event = body?.event || body?.hottok ? "purchase_event" : "unknown";

  const statusMap: Record<string, string> = {
    approved: "aprovada",
    completed: "aprovada",
    refunded: "reembolsada",
    canceled: "cancelada",
    expired: "expirada",
    delayed: "pendente",
    waiting_payment: "pendente",
    dispute: "disputa",
    chargedback: "chargeback",
  };

  const rawStatus = purchase?.status?.toLowerCase?.() || 
    purchase?.transaction?.status?.toLowerCase?.() || "approved";

  return {
    plataforma: "hotmart",
    evento: event,
    status: statusMap[rawStatus] || "pendente",
    valor_bruto: Number(purchase?.price?.value || purchase?.original_offer_price?.value || purchase?.full_price?.value || 0) / 100 || Number(purchase?.price || 0),
    taxa: Number(purchase?.commission?.value || purchase?.fee?.value || 0) / 100 || 0,
    valor_liquido: Number(purchase?.price?.value || 0) / 100 - Number(purchase?.commission?.value || 0) / 100 || Number(purchase?.price || 0),
    cliente: buyer?.name || buyer?.email || null,
    produto: product?.name || null,
    data_venda: normalizeDate(purchase?.approved_date || purchase?.order_date),
    data_prevista_recebimento: null,
  };
}

// ─── Eduzz ───
function parseEduzz(body: any): SaleData | null {
  const statusMap: Record<string, string> = {
    "1": "pendente",
    "3": "aprovada",
    "4": "cancelada",
    "6": "reembolsada",
    "7": "pendente",
    open: "pendente",
    paid: "aprovada",
    canceled: "cancelada",
    refunded: "reembolsada",
    waiting_payment: "pendente",
  };

  const rawStatus = String(body?.trans_status || body?.sale_status || body?.status || "3");
  const valorBruto = Number(body?.trans_value || body?.sale_amount_win || body?.amount || 0);
  const taxa = Number(body?.trans_fee || body?.fee || 0);

  return {
    plataforma: "eduzz",
    evento: body?.event_type || body?.trans_nature || "sale",
    status: statusMap[rawStatus.toLowerCase()] || statusMap[rawStatus] || "pendente",
    valor_bruto: valorBruto,
    taxa,
    valor_liquido: valorBruto - taxa,
    cliente: body?.cus_name || body?.client_name || body?.cus_email || null,
    produto: body?.product_name || body?.pro_name || null,
    data_venda: normalizeDate(body?.trans_createdate || body?.sale_date),
    data_prevista_recebimento: body?.trans_duedate ? normalizeDate(body.trans_duedate) : null,
  };
}

// ─── Monetizze ───
function parseMonetizze(body: any): SaleData | null {
  const evento = body?.evento || body?.venda || {};
  const produto = body?.produto || evento?.produto || {};
  const comprador = body?.comprador || evento?.comprador || {};

  const statusMap: Record<string, string> = {
    "1": "pendente",
    "2": "aprovada",
    "3": "cancelada",
    "5": "reembolsada",
    "6": "pendente",
    finalizada: "aprovada",
    completa: "aprovada",
    cancelada: "cancelada",
    reembolsada: "reembolsada",
    aguardando: "pendente",
  };

  const rawStatus = String(
    evento?.tipo_evento || evento?.venda?.status || body?.status || "2"
  );
  const valorBruto = Number(evento?.venda?.valor || body?.valor || 0);
  const taxa = Number(evento?.venda?.comissao || body?.comissao || 0);

  return {
    plataforma: "monetizze",
    evento: evento?.tipo_evento || "sale",
    status: statusMap[rawStatus.toLowerCase()] || statusMap[rawStatus] || "pendente",
    valor_bruto: valorBruto,
    taxa,
    valor_liquido: valorBruto - taxa,
    cliente: comprador?.nome || comprador?.email || null,
    produto: produto?.nome || produto?.name || null,
    data_venda: normalizeDate(evento?.venda?.data || body?.data_venda),
    data_prevista_recebimento: evento?.venda?.data_prevista ? normalizeDate(evento.venda.data_prevista) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
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

    // Verify integration exists and is active
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

    // Parse body
    let body: any = {};
    try {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Try URL-encoded (some platforms send form data)
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params);
      }
    } catch {
      body = {};
    }

    // Parse platform-specific data
    let saleData: SaleData | null = null;
    if (platform === "hotmart") {
      saleData = parseHotmart(body);
    } else if (platform === "eduzz") {
      saleData = parseEduzz(body);
    } else if (platform === "monetizze") {
      saleData = parseMonetizze(body);
    }

    let vendaId: string | null = null;
    let lancamentoId: string | null = null;

    if (saleData && saleData.valor_bruto > 0) {
      // Insert venda_digital
      const { data: venda, error: vendaError } = await supabase
        .from("vendas_digitais")
        .insert({
          empresa_id: empresaId,
          plataforma: saleData.plataforma,
          data_venda: saleData.data_venda,
          valor_bruto: saleData.valor_bruto,
          taxa: saleData.taxa,
          valor_liquido: saleData.valor_liquido,
          cliente: saleData.cliente,
          produto: saleData.produto,
          status: saleData.status,
          data_prevista_recebimento: saleData.data_prevista_recebimento,
        })
        .select("id")
        .single();

      if (vendaError) {
        console.error("Erro ao inserir venda:", vendaError);
      } else {
        vendaId = venda.id;
      }

      // Create lancamento (receita) automatically if approved
      if (saleData.status === "aprovada") {
        const dataVenda = String(saleData.data_venda).split("T")[0] || new Date().toISOString().split("T")[0];
        const { data: lancamento, error: lancError } = await supabase
          .from("lancamentos")
          .insert({
            empresa_id: empresaId,
            descricao: `${saleData.plataforma.charAt(0).toUpperCase() + saleData.plataforma.slice(1)} - ${saleData.produto || "Venda digital"}${saleData.cliente ? ` (${saleData.cliente})` : ""}`,
            tipo: "receita",
            valor: saleData.valor_liquido,
            data_vencimento: dataVenda,
            data_pagamento: dataVenda,
            status: "pago",
          })
          .select("id")
          .single();

        if (lancError) {
          console.error("Erro ao inserir lançamento:", lancError);
        } else {
          lancamentoId = lancamento.id;
        }
      }
    }

    // Log the webhook
    await supabase.from("logs_integracoes").insert({
      empresa_id: empresaId,
      plataforma: platform,
      evento: saleData?.evento || "unknown",
      status: "success",
      payload: {
        source: "webhook_receiver",
        sale_data: saleData,
        venda_id: vendaId,
        lancamento_id: lancamentoId,
        raw_body: body,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        evento: saleData?.evento,
        status: saleData?.status,
        venda_id: vendaId,
        lancamento_id: lancamentoId,
        message: vendaId
          ? "Venda registrada com sucesso"
          : "Webhook recebido e registrado nos logs",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook receiver error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
