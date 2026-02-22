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

    // ========== CLEAN TARGET COMPANY DATA ==========
    // Delete in correct order (lancamentos first due to FK references)
    await supabase.from("lancamentos").delete().eq("empresa_id", targetEmpresaId);
    await supabase.from("clientes").delete().eq("empresa_id", targetEmpresaId);
    await supabase.from("fornecedores").delete().eq("empresa_id", targetEmpresaId);
    await supabase.from("categorias").delete().eq("empresa_id", targetEmpresaId);
    await supabase.from("contas_bancarias").delete().eq("empresa_id", targetEmpresaId);
    await supabase.from("formas_pagamento").delete().eq("empresa_id", targetEmpresaId);

    // ========== FETCH SOURCE DATA ==========
    // Fetch source lançamentos with all fields
    const { data: sourceLancamentos, error: fetchErr } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", sourceEmpresaId);

    if (fetchErr) throw fetchErr;
    if (!sourceLancamentos || sourceLancamentos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum lançamento encontrado na empresa de origem" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect unique related IDs from lançamentos
    const categoriaIds = new Set<string>();
    const clienteIds = new Set<string>();
    const fornecedorIds = new Set<string>();
    const contaBancariaIds = new Set<string>();
    const formaPagamentoIds = new Set<string>();

    for (const l of sourceLancamentos) {
      if (l.categoria_id) categoriaIds.add(l.categoria_id);
      if (l.cliente_id) clienteIds.add(l.cliente_id);
      if (l.fornecedor_id) fornecedorIds.add(l.fornecedor_id);
      if (l.conta_bancaria_id) contaBancariaIds.add(l.conta_bancaria_id);
      if (l.forma_pagamento_id) formaPagamentoIds.add(l.forma_pagamento_id);
    }

    // Helper to copy related records and build ID map
    const copyRelated = async (
      table: string,
      ids: Set<string>,
      sourceEmpresa: string,
      targetEmpresa: string,
      fields: string[]
    ): Promise<Record<string, string>> => {
      const idMap: Record<string, string> = {};
      if (ids.size === 0) return idMap;

      const idArray = Array.from(ids);
      const { data: records } = await supabase
        .from(table)
        .select("*")
        .in("id", idArray)
        .eq("empresa_id", sourceEmpresa);

      if (!records || records.length === 0) return idMap;

      for (const record of records) {
        const oldId = record.id;
        const newRecord: any = { empresa_id: targetEmpresa };
        for (const f of fields) {
          if (record[f] !== undefined) newRecord[f] = record[f];
        }

        const { data: inserted, error: insertErr } = await supabase
          .from(table)
          .insert(newRecord)
          .select("id")
          .single();

        if (!insertErr && inserted) {
          idMap[oldId] = inserted.id;
        }
      }

      return idMap;
    };

    // Copy related records
    const categoriaMap = await copyRelated("categorias", categoriaIds, sourceEmpresaId, targetEmpresaId, [
      "nome", "tipo"
    ]);

    const clienteMap = await copyRelated("clientes", clienteIds, sourceEmpresaId, targetEmpresaId, [
      "nome", "cpf_cnpj", "telefone", "email", "endereco", "ativo", "origem"
    ]);

    // Also copy ALL clients from source (integration clients may not be linked to lancamentos)
    const { data: allSourceClientes } = await supabase
      .from("clientes")
      .select("*")
      .eq("empresa_id", sourceEmpresaId);

    let extraClientesCount = 0;
    if (allSourceClientes) {
      for (const cliente of allSourceClientes) {
        if (clienteMap[cliente.id]) continue;

        const { nome, cpf_cnpj, telefone, email, endereco, ativo, origem } = cliente;
        const { data: inserted, error: insertErr } = await supabase
          .from("clientes")
          .insert({ empresa_id: targetEmpresaId, nome, cpf_cnpj, telefone, email, endereco, ativo, origem })
          .select("id")
          .single();

        if (!insertErr && inserted) {
          clienteMap[cliente.id] = inserted.id;
          extraClientesCount++;
        }
      }
    }

    const fornecedorMap = await copyRelated("fornecedores", fornecedorIds, sourceEmpresaId, targetEmpresaId, [
      "nome", "cpf_cnpj", "telefone", "email", "endereco", "ativo"
    ]);

    const contaBancariaMap = await copyRelated("contas_bancarias", contaBancariaIds, sourceEmpresaId, targetEmpresaId, [
      "nome", "banco", "agencia", "conta", "saldo_inicial", "saldo_atual"
    ]);

    const formaPagamentoMap = await copyRelated("formas_pagamento", formaPagamentoIds, sourceEmpresaId, targetEmpresaId, [
      "descricao"
    ]);

    // Copy lançamentos with mapped IDs
    let lancamentosCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < sourceLancamentos.length; i += batchSize) {
      const batch = sourceLancamentos.slice(i, i + batchSize);
      const newLancamentos = batch.map((l: any) => ({
        empresa_id: targetEmpresaId,
        descricao: l.descricao,
        tipo: l.tipo,
        valor: l.valor,
        data_vencimento: l.data_vencimento,
        data_pagamento: l.data_pagamento,
        status: l.status,
        origem: l.origem,
        recorrente: l.recorrente,
        recorrencia_tipo: l.recorrencia_tipo,
        recorrencia_fim: l.recorrencia_fim,
        parcela_atual: l.parcela_atual,
        total_parcelas: l.total_parcelas,
        categoria_id: l.categoria_id ? (categoriaMap[l.categoria_id] || null) : null,
        cliente_id: l.cliente_id ? (clienteMap[l.cliente_id] || null) : null,
        fornecedor_id: l.fornecedor_id ? (fornecedorMap[l.fornecedor_id] || null) : null,
        conta_bancaria_id: l.conta_bancaria_id ? (contaBancariaMap[l.conta_bancaria_id] || null) : null,
        forma_pagamento_id: l.forma_pagamento_id ? (formaPagamentoMap[l.forma_pagamento_id] || null) : null,
      }));

      const { error: batchErr } = await supabase.from("lancamentos").insert(newLancamentos);
      if (!batchErr) lancamentosCount += newLancamentos.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        lancamentosCount,
        categoriasCount: Object.keys(categoriaMap).length,
        clientesCount: Object.keys(clienteMap).length,
        fornecedoresCount: Object.keys(fornecedorMap).length,
        contasBancariasCount: Object.keys(contaBancariaMap).length,
        formasPagamentoCount: Object.keys(formaPagamentoMap).length,
        extraClientesCount,
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
