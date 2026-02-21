import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check super admin
    const { data: isSA } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    if (!isSA) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sourceEmpresaId, targetEmpresaId } = await req.json();

    if (!sourceEmpresaId || !targetEmpresaId || sourceEmpresaId === targetEmpresaId) {
      return new Response(
        JSON.stringify({ error: "Empresa de origem e destino devem ser diferentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch only ACTIVE source integrations
    const { data: sourceIntegracoes, error: fetchError } = await supabase
      .from("integracoes")
      .select("*")
      .eq("empresa_id", sourceEmpresaId)
      .eq("ativo", true);

    if (fetchError) throw fetchError;
    if (!sourceIntegracoes || sourceIntegracoes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma integração conectada na empresa de origem" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete existing integrations in target
    await supabase
      .from("integracoes")
      .delete()
      .eq("empresa_id", targetEmpresaId);

    // Copy integrations to target
    const newIntegracoes = sourceIntegracoes.map((integ: any) => ({
      empresa_id: targetEmpresaId,
      plataforma: integ.plataforma,
      api_key_encrypted: integ.api_key_encrypted,
      api_secret_encrypted: integ.api_secret_encrypted,
      ambiente: integ.ambiente,
      ativo: integ.ativo,
      webhook_secret: integ.webhook_secret,
    }));

    const { error: insertError } = await supabase
      .from("integracoes")
      .insert(newIntegracoes);

    if (insertError) throw insertError;

    // Also copy webhooks_empresa and update URLs with target empresa_id
    const { data: sourceWebhooks } = await supabase
      .from("webhooks_empresa")
      .select("*")
      .eq("empresa_id", sourceEmpresaId);

    if (sourceWebhooks && sourceWebhooks.length > 0) {
      await supabase.from("webhooks_empresa").delete().eq("empresa_id", targetEmpresaId);
      const newWebhooks = sourceWebhooks.map((wh: any) => ({
        empresa_id: targetEmpresaId,
        evento: wh.evento,
        url: wh.url.replace(sourceEmpresaId, targetEmpresaId),
        ativo: wh.ativo,
      }));
      await supabase.from("webhooks_empresa").insert(newWebhooks);
    }

    // Copy vendas_digitais
    const { data: sourceVendas } = await supabase
      .from("vendas_digitais")
      .select("*")
      .eq("empresa_id", sourceEmpresaId);

    let vendasCount = 0;
    const vendaIdMap: Record<string, string> = {};

    if (sourceVendas && sourceVendas.length > 0) {
      for (const venda of sourceVendas) {
        const oldId = venda.id;
        const { data: newVenda, error: vendaErr } = await supabase
          .from("vendas_digitais")
          .insert({
            empresa_id: targetEmpresaId,
            plataforma: venda.plataforma,
            data_venda: venda.data_venda,
            valor_bruto: venda.valor_bruto,
            taxa: venda.taxa,
            valor_liquido: venda.valor_liquido,
            cliente: venda.cliente,
            produto: venda.produto,
            status: venda.status,
            data_prevista_recebimento: venda.data_prevista_recebimento,
          })
          .select("id")
          .single();

        if (!vendaErr && newVenda) {
          vendaIdMap[oldId] = newVenda.id;
          vendasCount++;
        }
      }
    }

    // Copy recebimentos_digitais linked to copied vendas
    let recebimentosCount = 0;
    const oldVendaIds = Object.keys(vendaIdMap);
    if (oldVendaIds.length > 0) {
      const { data: sourceRecebimentos } = await supabase
        .from("recebimentos_digitais")
        .select("*")
        .in("venda_id", oldVendaIds);

      if (sourceRecebimentos && sourceRecebimentos.length > 0) {
        const newRecebimentos = sourceRecebimentos
          .filter((r: any) => vendaIdMap[r.venda_id])
          .map((r: any) => ({
            venda_id: vendaIdMap[r.venda_id],
            valor: r.valor,
            data_prevista: r.data_prevista,
            data_recebida: r.data_recebida,
            status: r.status,
          }));
        if (newRecebimentos.length > 0) {
          const { error: recErr } = await supabase.from("recebimentos_digitais").insert(newRecebimentos);
          if (!recErr) recebimentosCount = newRecebimentos.length;
        }
      }
    }

    // Copy lancamentos with origem='integracao'
    const { data: sourceLancamentos } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", sourceEmpresaId)
      .eq("origem", "integracao");

    let lancamentosCount = 0;
    if (sourceLancamentos && sourceLancamentos.length > 0) {
      const newLancamentos = sourceLancamentos.map((l: any) => ({
        empresa_id: targetEmpresaId,
        descricao: l.descricao,
        tipo: l.tipo,
        valor: l.valor,
        data_vencimento: l.data_vencimento,
        data_pagamento: l.data_pagamento,
        status: l.status,
        origem: l.origem,
        recorrente: l.recorrente,
      }));
      const { error: lancErr } = await supabase.from("lancamentos").insert(newLancamentos);
      if (!lancErr) lancamentosCount = newLancamentos.length;
    }

    // Copy logs_integracoes
    const { data: sourceLogs } = await supabase
      .from("logs_integracoes")
      .select("*")
      .eq("empresa_id", sourceEmpresaId);

    let logsCount = 0;
    if (sourceLogs && sourceLogs.length > 0) {
      const newLogs = sourceLogs.map((log: any) => ({
        empresa_id: targetEmpresaId,
        plataforma: log.plataforma,
        evento: log.evento,
        status: log.status,
        payload: log.payload,
      }));
      const { error: logErr } = await supabase.from("logs_integracoes").insert(newLogs);
      if (!logErr) logsCount = newLogs.length;
    }

    // Build webhook URLs info
    const webhookBaseUrl = `${supabaseUrl}/functions/v1/webhook-receiver`;
    const platforms = newIntegracoes.map((i: any) => i.plataforma);
    const webhookUrls = platforms.map((p: string) => ({
      plataforma: p,
      url: `${webhookBaseUrl}/${p}?empresa_id=${targetEmpresaId}`,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        count: newIntegracoes.length,
        webhookUrls,
        vendasCount,
        recebimentosCount,
        lancamentosCount,
        logsCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
