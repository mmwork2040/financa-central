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
  valor_comissao: number;
  cliente: string | null;
  produto: string | null;
  data_venda: string;
  data_prevista_recebimento: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cliente_documento: string | null;
  transaction_id: string | null;
}

const ESTORNO_STATUSES = new Set(["reembolsada", "chargeback", "cancelada", "expirada", "disputa"]);
const APROVADA_STATUSES = new Set(["aprovada"]);

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
  const event = String(body?.event || body?.data?.event || "PURCHASE_APPROVED").toUpperCase();

  // Mapa por EVENTO (prioritário) — Hotmart envia eventos distintos para reembolsos
  const eventStatusMap: Record<string, string> = {
    PURCHASE_APPROVED: "aprovada",
    PURCHASE_COMPLETE: "aprovada",
    PURCHASE_REFUNDED: "reembolsada",
    PURCHASE_CHARGEBACK: "chargeback",
    PURCHASE_PROTEST: "disputa",
    PURCHASE_CANCELED: "cancelada",
    PURCHASE_EXPIRED: "expirada",
    PURCHASE_DELAYED: "pendente",
    PURCHASE_BILLET_PRINTED: "pendente",
    PURCHASE_OUT_OF_SHOPPING_CART: "pendente",
  };

  // Fallback por status interno (caso evento desconhecido)
  const purchaseStatusMap: Record<string, string> = {
    approved: "aprovada",
    completed: "aprovada",
    refunded: "reembolsada",
    canceled: "cancelada",
    expired: "expirada",
    delayed: "pendente",
    waiting_payment: "pendente",
    dispute: "disputa",
    chargedback: "chargeback",
    protest: "disputa",
  };

  let status = eventStatusMap[event];
  if (!status) {
    const rawStatus = (purchase?.status?.toLowerCase?.() || purchase?.transaction?.status?.toLowerCase?.() || "approved");
    status = purchaseStatusMap[rawStatus] || "pendente";
  }

  const valorBruto = Number(purchase?.price?.value || purchase?.original_offer_price?.value || purchase?.full_price?.value || purchase?.price || 0);
  const commissionRaw = Number(purchase?.commission?.value || 0);
  const fee = commissionRaw > 0 ? (valorBruto - commissionRaw) : Number(purchase?.fee?.value || 0);
  const valorComissao = commissionRaw > 0 ? commissionRaw : (valorBruto - fee);

  // Hotmart fornece transaction code que identifica unicamente a compra
  const transactionId = purchase?.transaction || purchase?.transaction_id || body?.data?.purchase?.transaction || null;

  return {
    plataforma: "hotmart",
    evento: event,
    status,
    valor_bruto: valorBruto,
    taxa: fee,
    valor_liquido: valorBruto - fee,
    valor_comissao: valorComissao,
    cliente: buyer?.name || buyer?.email || null,
    produto: product?.name || null,
    data_venda: normalizeDate(purchase?.approved_date || purchase?.order_date),
    data_prevista_recebimento: null,
    cliente_email: buyer?.email || null,
    cliente_telefone: buyer?.phone || buyer?.cel_phone || null,
    cliente_documento: buyer?.document || buyer?.cpf || null,
    transaction_id: transactionId ? String(transactionId) : null,
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
  // Eduzz: sale_amount_win is already the user's net amount
  const valorComissao = Number(body?.sale_amount_win || (valorBruto - taxa));

  return {
    plataforma: "eduzz",
    evento: body?.event_type || body?.trans_nature || "sale",
    status: statusMap[rawStatus.toLowerCase()] || statusMap[rawStatus] || "pendente",
    valor_bruto: valorBruto,
    taxa,
    valor_liquido: valorBruto - taxa,
    valor_comissao: valorComissao,
    cliente: body?.cus_name || body?.client_name || body?.cus_email || null,
    produto: body?.product_name || body?.pro_name || null,
    data_venda: normalizeDate(body?.trans_createdate || body?.sale_date),
    data_prevista_recebimento: body?.trans_duedate ? normalizeDate(body.trans_duedate) : null,
    cliente_email: body?.cus_email || null,
    cliente_telefone: body?.cus_tel || body?.cus_cel || null,
    cliente_documento: body?.cus_taxnumber || null,
  };
}

// ─── Kiwify ───
function parseKiwify(body: any): SaleData | null {
  const statusMap: Record<string, string> = {
    paid: "aprovada",
    approved: "aprovada",
    refunded: "reembolsada",
    chargedback: "chargeback",
    waiting_payment: "pendente",
    expired: "expirada",
    refused: "cancelada",
  };

  const order = body?.order || body;
  const customer = body?.Customer || body?.customer || {};
  const product = body?.Product || body?.product || {};
  const rawStatus = String(order?.status || order?.order_status || body?.order_status || "paid").toLowerCase();
  const valorBruto = Number(order?.total || order?.charges?.amount || body?.commission?.charge_amount || 0);
  const taxa = Number(order?.platform_fee || 0);
  // Kiwify: commission_amount is what the user (affiliate) receives
  const userCommission = Number(body?.commission?.commission_amount || 0);
  const valorComissao = userCommission > 0 ? userCommission : (valorBruto - taxa);

  return {
    plataforma: "kiwify",
    evento: body?.webhook_event_type || body?.event || "order_paid",
    status: statusMap[rawStatus] || "pendente",
    valor_bruto: valorBruto,
    taxa,
    valor_liquido: valorBruto - taxa,
    valor_comissao: valorComissao,
    cliente: customer?.full_name || customer?.name || customer?.email || null,
    produto: product?.name || product?.product_name || null,
    data_venda: normalizeDate(order?.created_at || order?.approved_date || body?.created_at),
    data_prevista_recebimento: null,
    cliente_email: customer?.email || null,
    cliente_telefone: customer?.mobile || customer?.phone || null,
    cliente_documento: customer?.cpf || customer?.document || null,
  };
}

// ─── Hubla ───
function parseHubla(body: any): SaleData | null {
  const statusMap: Record<string, string> = {
    approved: "aprovada",
    completed: "aprovada",
    refunded: "reembolsada",
    canceled: "cancelada",
    chargedback: "chargeback",
    pending: "pendente",
    waiting_payment: "pendente",
  };

  const data = body?.data || body;
  const event = body?.event || body?.type || "purchase_approved";
  const customer = data?.customer || data?.buyer || {};
  const product = data?.product || {};
  const rawStatus = String(data?.status || "approved").toLowerCase();

  // Handle subscription cancellation events
  if (event === "subscription_cancellation") {
    const hVb = Number(data?.price || data?.amount || 0);
    const hTx = Number(data?.fee || data?.platform_fee || 0);
    const hCom = Number(data?.commission || data?.seller_net || 0);
    return {
      plataforma: "hubla",
      evento: event,
      status: "cancelada",
      valor_bruto: hVb,
      taxa: hTx,
      valor_liquido: hVb - hTx,
      valor_comissao: hCom > 0 ? hCom : (hVb - hTx),
      cliente: customer?.name || customer?.email || null,
      produto: product?.name || null,
      data_venda: normalizeDate(data?.created_at || data?.date),
      data_prevista_recebimento: null,
      cliente_email: customer?.email || null,
      cliente_telefone: customer?.phone || customer?.mobile || null,
      cliente_documento: customer?.document || customer?.cpf || null,
    };
  }

  const valorBruto = Number(data?.price || data?.amount || data?.value || 0);
  const taxa = Number(data?.fee || data?.platform_fee || 0);
  const hublaComissao = Number(data?.commission || data?.seller_net || 0);

  return {
    plataforma: "hubla",
    evento: event,
    status: statusMap[rawStatus] || "pendente",
    valor_bruto: valorBruto,
    taxa,
    valor_liquido: valorBruto - taxa,
    valor_comissao: hublaComissao > 0 ? hublaComissao : (valorBruto - taxa),
    cliente: customer?.name || customer?.email || null,
    produto: product?.name || null,
    data_venda: normalizeDate(data?.created_at || data?.approved_at || data?.date),
    data_prevista_recebimento: null,
    cliente_email: customer?.email || null,
    cliente_telefone: customer?.phone || customer?.mobile || null,
    cliente_documento: customer?.document || customer?.cpf || null,
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
  const taxa = Number(evento?.venda?.taxa || body?.taxa || 0);
  // Monetizze: comissao is what the user/affiliate receives
  const comissaoUsuario = Number(evento?.venda?.comissao || body?.comissao || 0);
  const valorComissao = comissaoUsuario > 0 ? comissaoUsuario : (valorBruto - taxa);

  return {
    plataforma: "monetizze",
    evento: evento?.tipo_evento || "sale",
    status: statusMap[rawStatus.toLowerCase()] || statusMap[rawStatus] || "pendente",
    valor_bruto: valorBruto,
    taxa,
    valor_liquido: valorBruto - taxa,
    valor_comissao: valorComissao,
    cliente: comprador?.nome || comprador?.email || null,
    produto: produto?.nome || produto?.name || null,
    data_venda: normalizeDate(evento?.venda?.data || body?.data_venda),
    data_prevista_recebimento: evento?.venda?.data_prevista ? normalizeDate(evento.venda.data_prevista) : null,
    cliente_email: comprador?.email || null,
    cliente_telefone: comprador?.telefone || comprador?.celular || null,
    cliente_documento: comprador?.cpf || comprador?.cnpj || null,
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

    // Check if logs are enabled for this empresa
    const { data: empresaConfig } = await supabase
      .from("empresas")
      .select("logs_enabled")
      .eq("id", empresaId)
      .single();
    const logsEnabled = empresaConfig?.logs_enabled !== false;

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
    } else if (platform === "kiwify") {
      saleData = parseKiwify(body);
    } else if (platform === "hubla") {
      saleData = parseHubla(body);
    }

    let vendaId: string | null = null;
    let lancamentoId: string | null = null;
    let clienteId: string | null = null;

    if (saleData && saleData.valor_bruto > 0) {
      // Check for duplicate sale before inserting
      const { data: existingVenda } = await supabase
        .from("vendas_digitais")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("plataforma", saleData.plataforma)
        .eq("valor_liquido", saleData.valor_liquido)
        .eq("data_venda", saleData.data_venda)
        .eq("produto", saleData.produto || "")
        .eq("cliente", saleData.cliente || "")
        .maybeSingle();

      if (existingVenda) {
        // Log duplicate and return success (idempotent)
        if (logsEnabled) {
          await supabase.from("logs_integracoes").insert({
            empresa_id: empresaId,
            plataforma: platform,
            evento: saleData.evento || "duplicate_ignored",
            status: "duplicate",
            payload: {
              source: "webhook_receiver",
              message: "Webhook duplicado ignorado",
              existing_venda_id: existingVenda.id,
              sale_data: saleData,
            },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            platform,
            evento: saleData.evento,
            status: saleData.status,
            venda_id: existingVenda.id,
            duplicate: true,
            message: "Venda já registrada anteriormente (duplicata ignorada)",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Auto-register client if sufficient data exists
      if (saleData.cliente) {
        const clienteName = saleData.cliente;
        // Extract email if present (format: "Name" or "email@domain.com")
        const isEmail = clienteName.includes("@");
        const nome = isEmail ? clienteName.split("@")[0] : clienteName;
        const email = isEmail ? clienteName : null;

        // Check if client already exists for this empresa
        const { data: existingCliente } = await supabase
          .from("clientes")
          .select("id")
          .eq("empresa_id", empresaId)
          .or(`nome.eq.${clienteName}${email ? `,email.eq.${email}` : ""}`)
          .maybeSingle();

        if (existingCliente) {
          clienteId = existingCliente.id;
        } else {
          const { data: newCliente, error: clienteError } = await supabase
            .from("clientes")
            .insert({
              empresa_id: empresaId,
              nome: nome,
              email: email,
              ativo: true,
              origem: "integracao",
            })
            .select("id")
            .single();

          if (clienteError) {
            console.error("Erro ao cadastrar cliente:", clienteError);
          } else {
            clienteId = newCliente.id;
            console.log("Cliente cadastrado automaticamente:", clienteId);
          }
        }
      }

      // Insert venda_digital (lancamento_id will be updated after lancamento is created)
      const { data: venda, error: vendaError } = await supabase
        .from("vendas_digitais")
        .insert({
          empresa_id: empresaId,
          plataforma: saleData.plataforma,
          data_venda: saleData.data_venda,
          valor_bruto: saleData.valor_bruto,
          taxa: saleData.taxa,
          valor_liquido: saleData.valor_liquido,
          valor_comissao: saleData.valor_comissao,
          cliente: saleData.cliente,
          produto: saleData.produto,
          status: saleData.status,
          data_prevista_recebimento: saleData.data_prevista_recebimento,
          cliente_email: saleData.cliente_email,
          cliente_telefone: saleData.cliente_telefone,
          cliente_documento: saleData.cliente_documento,
          origem: "integracao",
        })
        .select("id")
        .single();

      if (vendaError) {
        console.error("Erro ao inserir venda:", vendaError);
      } else {
        vendaId = venda.id;
      }

      // Create lancamento automatically if approved or refunded
      if (saleData.status === "aprovada" || saleData.status === "reembolsada" || saleData.status === "chargeback") {
        const dataVenda = String(saleData.data_venda).split("T")[0] || new Date().toISOString().split("T")[0];

        // Get dias_recebimento from integration config (default 30)
        const diasRecebimento = integration.dias_recebimento ?? 30;

        // Find principal bank account (or single account) for the empresa
        let contaBancariaId: string | null = null;
        const { data: contaPrincipal } = await supabase
          .from("contas_bancarias")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("principal", true)
          .maybeSingle();

        if (contaPrincipal) {
          contaBancariaId = contaPrincipal.id;
        } else {
          const { data: todasContas } = await supabase
            .from("contas_bancarias")
            .select("id")
            .eq("empresa_id", empresaId);
          if (todasContas && todasContas.length === 1) {
            contaBancariaId = todasContas[0].id;
          }
        }

        const isEstorno = saleData.status === "reembolsada" || saleData.status === "chargeback";
        const isChargeback = saleData.status === "chargeback";
        const tipoLancamento = isEstorno ? "despesa" : "receita";
        const prefixo = isChargeback
          ? "⚠️ CHARGEBACK"
          : saleData.status === "reembolsada"
            ? "REEMBOLSO"
            : saleData.plataforma.charAt(0).toUpperCase() + saleData.plataforma.slice(1);

        // For approved sales with dias_recebimento > 0: create as pending with future vencimento
        // For refunds/chargebacks: create as paid immediately
        const isApproved = saleData.status === "aprovada";
        let lancamentoStatus: string;
        let dataVencimento: string;
        let dataPagamento: string | null;

        if (isApproved && diasRecebimento > 0) {
          const vencDate = new Date(saleData.data_venda);
          vencDate.setDate(vencDate.getDate() + diasRecebimento);
          dataVencimento = vencDate.toISOString().split("T")[0];
          dataPagamento = null;
          lancamentoStatus = "pendente";
        } else {
          dataVencimento = dataVenda;
          dataPagamento = dataVenda;
          lancamentoStatus = isEstorno ? "pago" : "recebido";
        }

        const { data: lancamento, error: lancError } = await supabase
          .from("lancamentos")
          .insert({
            empresa_id: empresaId,
            descricao: `${prefixo} - ${saleData.produto || "Venda digital"}${saleData.cliente ? ` (${saleData.cliente})` : ""}`,
            tipo: tipoLancamento,
            valor: saleData.valor_comissao > 0 ? saleData.valor_comissao : saleData.valor_liquido,
            data_vencimento: dataVencimento,
            data_pagamento: dataPagamento,
            status: lancamentoStatus,
            origem: "integracao",
            ...(clienteId ? { cliente_id: clienteId } : {}),
            ...(contaBancariaId ? { conta_bancaria_id: contaBancariaId } : {}),
          })
          .select("id")
          .single();

        if (lancError) {
          console.error("Erro ao inserir lançamento:", lancError);
        } else {
          lancamentoId = lancamento.id;

          // Link lancamento_id back to the venda
          if (vendaId) {
            await supabase
              .from("vendas_digitais")
              .update({ lancamento_id: lancamentoId })
              .eq("id", vendaId);
          }

          // Only update bank balance immediately for estornos (refunds/chargebacks)
          // For approved sales with dias_recebimento, balance is updated later by process-digital-receipts
          if (contaBancariaId && (isEstorno || lancamentoStatus !== "pendente")) {
            const valorContabil = saleData.valor_comissao > 0 ? saleData.valor_comissao : saleData.valor_liquido;
            const rpcTipo = isEstorno ? "despesa" : "receita";
            const { error: saldoError } = await supabase.rpc("update_saldo_conta", {
              _conta_id: contaBancariaId,
              _valor: valorContabil,
              _tipo: rpcTipo,
            });

            if (saldoError) {
              console.warn("RPC update_saldo_conta não encontrada, atualizando diretamente:", saldoError.message);
              const { data: contaAtual } = await supabase
                .from("contas_bancarias")
                .select("saldo_atual")
                .eq("id", contaBancariaId)
                .single();

              if (contaAtual) {
                const novoSaldo = isEstorno
                  ? contaAtual.saldo_atual - valorContabil
                  : contaAtual.saldo_atual + valorContabil;
                await supabase
                  .from("contas_bancarias")
                  .update({ saldo_atual: novoSaldo })
                  .eq("id", contaBancariaId);
              }
            }
          }
        }

        // Update venda_digital status for refund/chargeback
        if (isEstorno && vendaId) {
          await supabase
            .from("vendas_digitais")
            .update({ status: saleData.status })
            .eq("id", vendaId);
        }
      }
    }

    // Log the webhook (only if logs are enabled)
    if (logsEnabled) {
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
    }

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
