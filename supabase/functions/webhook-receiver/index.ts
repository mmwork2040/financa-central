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
    transaction_id: body?.trans_cod ? String(body.trans_cod) : (body?.sale_id ? String(body.sale_id) : null),
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
    transaction_id: order?.id ? String(order.id) : (body?.order_id ? String(body.order_id) : (order?.reference ? String(order.reference) : null)),
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
      transaction_id: data?.id ? String(data.id) : (data?.subscription_id ? String(data.subscription_id) : null),
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
    transaction_id: data?.id ? String(data.id) : (data?.transaction_id ? String(data.transaction_id) : null),
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
    transaction_id: evento?.venda?.codigo ? String(evento.venda.codigo) : (body?.codigo ? String(body.codigo) : null),
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
    let action: "created" | "refunded" | "duplicate" | "updated" | "ignored" = "ignored";

    // Helpers ─────────────────────────────────────────
    const findContaPrincipal = async (): Promise<string | null> => {
      const { data: contaPrincipal } = await supabase
        .from("contas_bancarias").select("id").eq("empresa_id", empresaId).eq("principal", true).maybeSingle();
      if (contaPrincipal) return contaPrincipal.id;
      const { data: todasContas } = await supabase
        .from("contas_bancarias").select("id").eq("empresa_id", empresaId);
      if (todasContas && todasContas.length === 1) return todasContas[0].id;
      return null;
    };

    const ajustarSaldo = async (contaId: string, valor: number, tipo: "receita" | "despesa") => {
      const { error: saldoError } = await supabase.rpc("update_saldo_conta", {
        _conta_id: contaId, _valor: valor, _tipo: tipo,
      });
      if (saldoError) {
        const { data: contaAtual } = await supabase
          .from("contas_bancarias").select("saldo_atual").eq("id", contaId).single();
        if (contaAtual) {
          const novoSaldo = tipo === "despesa"
            ? Number(contaAtual.saldo_atual) - valor
            : Number(contaAtual.saldo_atual) + valor;
          await supabase.from("contas_bancarias").update({ saldo_atual: novoSaldo }).eq("id", contaId);
        }
      }
    };

    if (saleData && saleData.valor_bruto > 0) {
      // 1. BUSCAR VENDA EXISTENTE — primeiro por transaction_id (forte), depois por heurística (fallback legado)
      let existingVenda: any = null;
      if (saleData.transaction_id) {
        const { data } = await supabase
          .from("vendas_digitais")
          .select("id, status, lancamento_id, valor_comissao, valor_liquido")
          .eq("empresa_id", empresaId)
          .eq("plataforma", saleData.plataforma)
          .eq("transaction_id", saleData.transaction_id)
          .maybeSingle();
        existingVenda = data;
      }
      if (!existingVenda) {
        const { data } = await supabase
          .from("vendas_digitais")
          .select("id, status, lancamento_id, valor_comissao, valor_liquido")
          .eq("empresa_id", empresaId)
          .eq("plataforma", saleData.plataforma)
          .eq("valor_liquido", saleData.valor_liquido)
          .eq("data_venda", saleData.data_venda)
          .eq("produto", saleData.produto || "")
          .eq("cliente", saleData.cliente || "")
          .maybeSingle();
        existingVenda = data;
      }

      const isEstorno = ESTORNO_STATUSES.has(saleData.status);
      const isApproved = APROVADA_STATUSES.has(saleData.status);

      // 2. EVENTO DE ESTORNO/CANCELAMENTO
      if (existingVenda && isEstorno) {
        // Se já estava estornada com mesmo status — duplicata
        if (existingVenda.status === saleData.status) {
          action = "duplicate";
          await supabase.from("logs_integracoes").insert({
            empresa_id: empresaId, plataforma: platform,
            evento: saleData.evento, status: "duplicate",
            payload: { source: "webhook_receiver", message: "Estorno já processado", existing_venda_id: existingVenda.id, sale_data: saleData },
          });
          vendaId = existingVenda.id;
        } else {
          // Aplicar estorno: atualizar status, criar despesa, reverter saldo
          vendaId = existingVenda.id;
          action = "refunded";

          await supabase.from("vendas_digitais")
            .update({ status: saleData.status })
            .eq("id", vendaId);

          const valorEstorno = Number(existingVenda.valor_comissao) > 0
            ? Number(existingVenda.valor_comissao)
            : Number(existingVenda.valor_liquido);

          const contaId = await findContaPrincipal();
          const hoje = new Date().toISOString().split("T")[0];
          const isChargeback = saleData.status === "chargeback";
          const prefixo = isChargeback ? "⚠️ CHARGEBACK" : (saleData.status === "reembolsada" ? "REEMBOLSO" : "ESTORNO");

          // Verifica lançamento original
          let lancOriginal: any = null;
          if (existingVenda.lancamento_id) {
            const { data } = await supabase.from("lancamentos")
              .select("id, status, valor, conta_bancaria_id")
              .eq("id", existingVenda.lancamento_id).maybeSingle();
            lancOriginal = data;
          }

          if (lancOriginal && lancOriginal.status === "pendente") {
            // Receita ainda não foi recebida — apenas cancela o lançamento, sem mexer no saldo
            await supabase.from("lancamentos")
              .update({ status: "cancelado", descricao: `${prefixo} - cancelado antes do recebimento` })
              .eq("id", lancOriginal.id);
          } else {
            // Receita já recebida ou sem lançamento vinculado: criar despesa de estorno
            const { data: estornoLanc } = await supabase
              .from("lancamentos")
              .insert({
                empresa_id: empresaId,
                descricao: `${prefixo} - ${saleData.produto || "Venda digital"}${saleData.cliente ? ` (${saleData.cliente})` : ""}`,
                tipo: "despesa",
                valor: valorEstorno,
                data_vencimento: hoje,
                data_pagamento: hoje,
                status: "pago",
                origem: "integracao",
                ...(contaId ? { conta_bancaria_id: contaId } : {}),
              })
              .select("id").single();
            if (estornoLanc) lancamentoId = estornoLanc.id;

            // Reverter saldo apenas se a receita original já tinha sido baixada
            if (contaId && lancOriginal && lancOriginal.status === "recebido") {
              await ajustarSaldo(contaId, valorEstorno, "despesa");
            } else if (contaId && !lancOriginal) {
              // Caso legado: sem lançamento original, assumir que receita foi reconhecida → reverter
              await ajustarSaldo(contaId, valorEstorno, "despesa");
            }
          }
        }

        // SEMPRE logar eventos de estorno (crítico), mesmo com logs_enabled=false
        await supabase.from("logs_integracoes").insert({
          empresa_id: empresaId, plataforma: platform,
          evento: saleData.evento, status: action === "duplicate" ? "duplicate" : "refunded",
          payload: { source: "webhook_receiver", critical: true, sale_data: saleData, venda_id: vendaId, lancamento_id: lancamentoId, raw_body: body },
        });
      }
      // 3. EVENTO REPETIDO DE APROVAÇÃO (já existe e mesmo status)
      else if (existingVenda) {
        action = "duplicate";
        vendaId = existingVenda.id;
        if (logsEnabled) {
          await supabase.from("logs_integracoes").insert({
            empresa_id: empresaId, plataforma: platform,
            evento: saleData.evento || "duplicate_ignored", status: "duplicate",
            payload: { source: "webhook_receiver", message: "Webhook duplicado ignorado", existing_venda_id: existingVenda.id, sale_data: saleData },
          });
        }
      }
      // 4. NOVA VENDA
      else {
        action = "created";

        // Auto-cadastro de cliente
        if (saleData.cliente) {
          const clienteName = saleData.cliente;
          const isEmail = clienteName.includes("@");
          const nome = isEmail ? clienteName.split("@")[0] : clienteName;
          const email = isEmail ? clienteName : null;

          const { data: existingCliente } = await supabase
            .from("clientes").select("id").eq("empresa_id", empresaId)
            .or(`nome.eq.${clienteName}${email ? `,email.eq.${email}` : ""}`)
            .maybeSingle();

          if (existingCliente) clienteId = existingCliente.id;
          else {
            const { data: newCliente } = await supabase.from("clientes").insert({
              empresa_id: empresaId, nome, email, ativo: true, origem: "integracao",
            }).select("id").single();
            if (newCliente) clienteId = newCliente.id;
          }
        }

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
            transaction_id: saleData.transaction_id,
            ...(clienteId ? { cliente_id: clienteId } : {}),
          })
          .select("id").single();

        if (vendaError) {
          console.error("Erro ao inserir venda:", vendaError);
        } else {
          vendaId = venda.id;

          // Criar lançamento somente para vendas aprovadas novas
          if (isApproved) {
            const dataVenda = String(saleData.data_venda).split("T")[0] || new Date().toISOString().split("T")[0];
            const diasRecebimento = integration.dias_recebimento ?? 30;
            const contaId = await findContaPrincipal();

            let lancamentoStatus: string;
            let dataVencimento: string;
            let dataPagamento: string | null;

            if (diasRecebimento > 0) {
              const vencDate = new Date(saleData.data_venda);
              vencDate.setDate(vencDate.getDate() + diasRecebimento);
              dataVencimento = vencDate.toISOString().split("T")[0];
              dataPagamento = null;
              lancamentoStatus = "pendente";
            } else {
              dataVencimento = dataVenda;
              dataPagamento = dataVenda;
              lancamentoStatus = "recebido";
            }

            const prefixo = saleData.plataforma.charAt(0).toUpperCase() + saleData.plataforma.slice(1);
            const { data: lancamento } = await supabase.from("lancamentos").insert({
              empresa_id: empresaId,
              descricao: `${prefixo} - ${saleData.produto || "Venda digital"}${saleData.cliente ? ` (${saleData.cliente})` : ""}`,
              tipo: "receita",
              valor: saleData.valor_comissao > 0 ? saleData.valor_comissao : saleData.valor_liquido,
              data_vencimento: dataVencimento,
              data_pagamento: dataPagamento,
              status: lancamentoStatus,
              origem: "integracao",
              ...(clienteId ? { cliente_id: clienteId } : {}),
              ...(contaId ? { conta_bancaria_id: contaId } : {}),
            }).select("id").single();

            if (lancamento) {
              lancamentoId = lancamento.id;
              await supabase.from("vendas_digitais").update({ lancamento_id: lancamentoId }).eq("id", vendaId);

              if (contaId && lancamentoStatus === "recebido") {
                const valorContabil = saleData.valor_comissao > 0 ? saleData.valor_comissao : saleData.valor_liquido;
                await ajustarSaldo(contaId, valorContabil, "receita");
              }
            }
          }
          // Estorno como primeiro evento (sem venda original) — caso raro
          else if (isEstorno) {
            const contaId = await findContaPrincipal();
            const hoje = new Date().toISOString().split("T")[0];
            const valorEstorno = saleData.valor_comissao > 0 ? saleData.valor_comissao : saleData.valor_liquido;
            const prefixo = saleData.status === "chargeback" ? "⚠️ CHARGEBACK" : "REEMBOLSO";
            const { data: lanc } = await supabase.from("lancamentos").insert({
              empresa_id: empresaId,
              descricao: `${prefixo} - ${saleData.produto || "Venda digital"}${saleData.cliente ? ` (${saleData.cliente})` : ""}`,
              tipo: "despesa",
              valor: valorEstorno,
              data_vencimento: hoje, data_pagamento: hoje, status: "pago", origem: "integracao",
              ...(contaId ? { conta_bancaria_id: contaId } : {}),
            }).select("id").single();
            if (lanc) {
              lancamentoId = lanc.id;
              if (contaId) await ajustarSaldo(contaId, valorEstorno, "despesa");
            }
          }
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
        action,
        venda_id: vendaId,
        lancamento_id: lancamentoId,
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
