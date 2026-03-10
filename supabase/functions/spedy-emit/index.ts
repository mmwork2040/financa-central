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

    // Check plan limit for invoice emissions (server-side enforcement)
    const { data: isSA } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    if (!isSA) {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("assinatura_plano_id, assinatura_status, trial_started_at, created_at")
        .eq("id", user.id)
        .single();

      let maxNF = 0; // 0 = unlimited
      if (perfil) {
        const status = perfil.assinatura_status || "trial";
        const trialStarted = perfil.trial_started_at || perfil.created_at;

        if (status === "trial" && trialStarted) {
          const trialEnd = new Date(trialStarted);
          trialEnd.setDate(trialEnd.getDate() + 30);
          if (new Date() > trialEnd) {
            // Trial expired
            maxNF = 0; // will be blocked by subscription check elsewhere
          }
          // During active trial, unlimited (maxNF stays 0)
        } else if (status === "ativo" && perfil.assinatura_plano_id) {
          const { data: plano } = await supabase
            .from("planos_assinatura")
            .select("itens")
            .eq("id", perfil.assinatura_plano_id)
            .single();
          if (plano?.itens && typeof plano.itens === "object" && !Array.isArray(plano.itens)) {
            maxNF = (plano.itens as any).controles?.max_notas_fiscais ?? 0;
          }
        } else {
          // No active plan, restrict
          maxNF = 0;
        }

        if (maxNF > 0) {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
          const { count } = await supabase
            .from("vendas_digitais")
            .select("id", { count: "exact", head: true })
            .eq("empresa_id", venda.empresa_id)
            .in("invoice_status", ["PROCESSING", "AUTHORIZED", "ISSUED"])
            .gte("data_venda", startOfMonth)
            .lte("data_venda", endOfMonth);

          if ((count || 0) >= maxNF) {
            return new Response(JSON.stringify({
              error: `Limite de ${maxNF} notas fiscais/mês atingido. Faça upgrade do plano.`,
            }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
      }
    }

    // Validate empresa fiscal config
    const { data: empresaData } = await supabase
      .from("empresas")
      .select("fiscal_configurado, certificado_digital_url, spedy_company_id")
      .eq("id", venda.empresa_id)
      .single();

    if (!empresaData?.fiscal_configurado) {
      return new Response(JSON.stringify({ error: "Configuração fiscal da empresa não foi concluída. Acesse Configurações da Empresa → Configuração Fiscal." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!empresaData?.certificado_digital_url) {
      return new Response(JSON.stringify({ error: "Certificado digital não enviado. Envie o certificado A1 (.pfx) nas Configurações da Empresa antes de emitir notas." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    const dataVenda = venda.data_venda ? new Date(venda.data_venda).toISOString() : new Date().toISOString();

    // Map venda to Spedy API payload (docs.spedy.com.br)
    const payload: Record<string, unknown> = {
      transactionId: venda.id,
      date: dataVenda,
      amount: valorBruto,
      status: "approved",
      customer: {
        name: venda.cliente,
        federalTaxNumber: documento,
        email: venda.cliente_email || undefined,
        phone: venda.cliente_telefone || undefined,
      },
      items: [
        {
          description: venda.produto || "Produto",
          quantity: 1,
          price: valorBruto,
          amount: valorBruto,
          product: {
            name: venda.produto || "Produto",
            code: venda.id.substring(0, 8),
            price: valorBruto,
          },
        },
      ],
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
