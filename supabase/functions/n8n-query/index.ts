import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Aceitar body como objeto direto ou string JSON (parse automático)
    let rawBody = await req.json();
    // Se o n8n enviar o body como string JSON escapada, fazer parse novamente
    if (typeof rawBody === "string") {
      try { rawBody = JSON.parse(rawBody); } catch (_) { /* mantém como está */ }
    }
    // Se veio encapsulado em { output: "..." } do n8n
    if (rawBody && typeof rawBody === "object" && typeof rawBody.output === "string") {
      try { rawBody = JSON.parse(rawBody.output); } catch (_) { /* mantém como está */ }
    }
    // Se veio como array com um item [{ output: "..." }] ou [{ json_montado: {...} }]
    if (Array.isArray(rawBody)) {
      const first = rawBody[0];
      if (first?.output) {
        try { rawBody = typeof first.output === "string" ? JSON.parse(first.output) : first.output; } catch (_) { rawBody = first; }
      } else if (first?.json_montado) {
        rawBody = first.json_montado;
      } else {
        rawBody = first || {};
      }
    }
    // Se veio com json_montado como wrapper
    if (rawBody && typeof rawBody === "object" && rawBody.json_montado && !rawBody.action) {
      rawBody = rawBody.json_montado;
    }
    // Helper: limpar valores que são placeholders literais do n8n (ex: "{empresa_id}", "", undefined)
    const sanitize = (val: any): any => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === "string") {
        const trimmed = val.trim();
        // Detectar placeholders literais: {param}, {{param}}, $fromAI(...), strings vazias
        if (!trimmed || /^\{.*\}$/.test(trimmed) || /^\$fromAI\(/.test(trimmed)) return undefined;
      }
      return val;
    };

    const body = rawBody;
    const action = sanitize(body.action) || body.action;
    const empresa_id = sanitize(body.empresa_id);
    const user_id = sanitize(body.user_id);
    const periodo = sanitize(body.periodo);
    const data_inicio_custom = sanitize(body.data_inicio);
    const data_fim_custom = sanitize(body.data_fim);
    
    // Suportar filtros como objeto aninhado OU como parâmetros top-level (flat)
    const filters = body.filters || {};
    const flatFilterKeys = ["tipo", "status", "categoria_id", "plataforma", "ativo", "search", "limit", "permissao"];
    for (const key of flatFilterKeys) {
      const rawVal = body[key] !== undefined ? body[key] : filters[key];
      const cleanVal = sanitize(rawVal);
      if (cleanVal !== undefined) {
        filters[key] = cleanVal;
      } else {
        delete filters[key];
      }
    }

    const requestTimestamp = new Date().toISOString();
    const requestLog = {
      timestamp: requestTimestamp,
      method: req.method,
      url: req.url,
      action,
      empresa_id,
      user_id: user_id || null,
      periodo: periodo || null,
      filters: filters || null,
      headers: {
        content_type: req.headers.get("content-type"),
        origin: req.headers.get("origin"),
        user_agent: req.headers.get("user-agent"),
      },
    };
    console.log("📥 [n8n-query] REQUEST:", JSON.stringify(requestLog, null, 2));

    if (!empresa_id) {
      console.log("❌ [n8n-query] ERRO: empresa_id ausente");
      return new Response(JSON.stringify({ error: "empresa_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── PERMISSION CHECK ───
    // Map actions to screen keys and required permission type
    const actionPermissionMap: Record<string, { tela: string; tipo?: "pode_incluir" | "pode_alterar" | "pode_excluir" }> = {
      // Leitura (view)
      "lancamentos": { tela: "lancamentos" },
      "despesas-pendentes": { tela: "lancamentos" },
      "receitas-pendentes": { tela: "lancamentos" },
      "clientes": { tela: "clientes" },
      "fornecedores": { tela: "fornecedores" },
      "categorias": { tela: "categorias" },
      "contas-bancarias": { tela: "contas_bancarias" },
      "formas-pagamento": { tela: "formas_pagamento" },
      "projetos": { tela: "projetos" },
      "vendas-digitais": { tela: "vendas_digitais", tipo: "pode_incluir" },
      "recebimentos-digitais": { tela: "vendas_digitais", tipo: "pode_incluir" },
      "listar-anuncios": { tela: "anuncios", tipo: "pode_incluir" },
      "listar-usuarios": { tela: "users" },
      // Criação (pode_incluir)
      "criar-lancamento": { tela: "lancamentos", tipo: "pode_incluir" },
      "criar-cliente": { tela: "clientes", tipo: "pode_incluir" },
      "criar-fornecedor": { tela: "fornecedores", tipo: "pode_incluir" },
      "criar-categoria": { tela: "categorias", tipo: "pode_incluir" },
      "criar-conta-bancaria": { tela: "contas_bancarias", tipo: "pode_incluir" },
      "criar-forma-pagamento": { tela: "formas_pagamento", tipo: "pode_incluir" },
      "criar-projeto": { tela: "projetos", tipo: "pode_incluir" },
      // Edição (pode_alterar)
      "editar-cliente": { tela: "clientes", tipo: "pode_alterar" },
      "editar-fornecedor": { tela: "fornecedores", tipo: "pode_alterar" },
      "editar-categoria": { tela: "categorias", tipo: "pode_alterar" },
      "editar-conta-bancaria": { tela: "contas_bancarias", tipo: "pode_alterar" },
      "editar-forma-pagamento": { tela: "formas_pagamento", tipo: "pode_alterar" },
      "editar-projeto": { tela: "projetos", tipo: "pode_alterar" },
      "editar-lancamento": { tela: "lancamentos", tipo: "pode_alterar" },
      // Exclusão (pode_excluir)
      "excluir-cliente": { tela: "clientes", tipo: "pode_excluir" },
      "excluir-fornecedor": { tela: "fornecedores", tipo: "pode_excluir" },
      "excluir-categoria": { tela: "categorias", tipo: "pode_excluir" },
      "excluir-conta-bancaria": { tela: "contas_bancarias", tipo: "pode_excluir" },
      "excluir-forma-pagamento": { tela: "formas_pagamento", tipo: "pode_excluir" },
      "excluir-projeto": { tela: "projetos", tipo: "pode_excluir" },
      "excluir-lancamento": { tela: "lancamentos", tipo: "pode_excluir" },
    };

    // Check permissions if user_id is provided and action requires it
    const permRule = actionPermissionMap[action];
    if (user_id && permRule) {
      // Check if user is admin or super_admin (they have full access)
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .eq("empresa_id", empresa_id)
        .maybeSingle();

      const role = userRole?.role;
      const isAdminOrSuper = role === "admin" || role === "super_admin";

      if (!isAdminOrSuper) {
        // Check screen-level permissions
        const { data: userPerms } = await supabase
          .from("permissoes")
          .select("tela, pode_incluir, pode_alterar, pode_excluir")
          .eq("perfis_id", user_id);

        const perms = userPerms || [];

        // If user has permissions defined, check access
        if (perms.length > 0) {
          const screenPerm = perms.find((p: any) => p.tela === permRule.tela);

          if (!screenPerm) {
            // User has permissions but not for this screen → blocked
            console.log(`🚫 [n8n-query] Acesso negado: user ${user_id} sem permissão para tela '${permRule.tela}'`);
            return new Response(JSON.stringify({
              error: "Acesso negado",
              message: `Você não tem permissão para acessar '${permRule.tela}'.`,
            }), {
              status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Check specific action permission (create/edit/delete/view)
          if (permRule.tipo && !screenPerm[permRule.tipo]) {
            // For view-only screens (vendas_digitais, anuncios), pode_incluir means "pode visualizar"
            const viewOnlyScreens = ["vendas_digitais", "anuncios"];
            const tipoLabel = viewOnlyScreens.includes(permRule.tela) && permRule.tipo === "pode_incluir"
              ? "visualizar"
              : permRule.tipo === "pode_incluir" ? "incluir" : permRule.tipo === "pode_alterar" ? "alterar" : "excluir";
            console.log(`🚫 [n8n-query] Acesso negado: user ${user_id} sem permissão '${tipoLabel}' na tela '${permRule.tela}'`);
            return new Response(JSON.stringify({
              error: "Acesso negado",
              message: `Você não tem permissão para ${tipoLabel} em '${permRule.tela}'.`,
            }), {
              status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        // If perms.length === 0 → no restrictions defined, allow access (view-only default)
        // But still block creation if no explicit permission
        if (perms.length === 0 && permRule.tipo) {
          const tipoLabel = permRule.tipo === "pode_incluir" ? "incluir" : permRule.tipo === "pode_alterar" ? "alterar" : "excluir";
          console.log(`🚫 [n8n-query] Acesso negado: user ${user_id} sem permissões definidas, tentou '${tipoLabel}'`);
          return new Response(JSON.stringify({
            error: "Acesso negado",
            message: `Você não tem permissão para ${tipoLabel}. Solicite ao administrador.`,
          }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      console.log(`✅ [n8n-query] Permissão concedida: user ${user_id}, action '${action}'`);
    }

    // Helper: data atual no fuso horário do Brasil (UTC-3)
    const getBrazilDate = () => {
      const now = new Date();
      const brDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      return brDate;
    };

    // Helper: date range from periodo or custom dates (usando horário do Brasil)
    const getDateRange = (p?: string) => {
      // Custom date range takes priority
      if (data_inicio_custom && data_fim_custom) {
        return {
          inicio: data_inicio_custom + "T00:00:00.000-03:00",
          fim: data_fim_custom + "T23:59:59.000-03:00",
        };
      }
      if (data_inicio_custom) {
        const now = getBrazilDate();
        const fimDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        return {
          inicio: data_inicio_custom + "T00:00:00.000-03:00",
          fim: fimDate + "T23:59:59.000-03:00",
        };
      }
      if (data_fim_custom) {
        return {
          inicio: "2000-01-01T00:00:00.000-03:00",
          fim: data_fim_custom + "T23:59:59.000-03:00",
        };
      }

      const now = getBrazilDate();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();
      const fimDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const fim = fimDate + "T23:59:59.000-03:00";
      let inicioDate: string;
      switch (p) {
        case "semana": {
          const d = new Date(year, month, day - 7);
          inicioDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          break;
        }
        case "mes":
          inicioDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
          break;
        case "trimestre": {
          const d = new Date(year, month - 2, 1);
          inicioDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
          break;
        }
        case "semestre": {
          const d = new Date(year, month - 5, 1);
          inicioDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
          break;
        }
        case "ano":
          inicioDate = `${year}-01-01`;
          break;
        default:
          inicioDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      }
      const inicio = inicioDate + "T00:00:00.000-03:00";
      return { inicio, fim };
    };

    let result: any = null;

    switch (action) {
      // ─── RESUMO FINANCEIRO GERAL ───
      case "resumo-financeiro": {
        const { inicio, fim } = getDateRange(periodo);

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, status, descricao, data_vencimento, data_pagamento")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim);

        const receitas = (lancamentos || []).filter((l: any) => l.tipo === "receita");
        const despesas = (lancamentos || []).filter((l: any) => l.tipo === "despesa");
        const totalReceitas = receitas.reduce((s: number, l: any) => s + Number(l.valor), 0);
        const totalDespesas = despesas.reduce((s: number, l: any) => s + Number(l.valor), 0);
        const pendentes = (lancamentos || []).filter((l: any) => l.status === "pendente");
        const pagos = (lancamentos || []).filter((l: any) => l.status === "pago");

        const { data: contas } = await supabase
          .from("contas_bancarias")
          .select("nome, saldo_atual")
          .eq("empresa_id", empresa_id);

        const saldoTotal = (contas || []).reduce((s: number, c: any) => s + Number(c.saldo_atual), 0);

        // Incluir vendas digitais no resumo
        const { data: vendas } = await supabase
          .from("vendas_digitais")
          .select("valor_bruto, valor_liquido, taxa, status")
          .eq("empresa_id", empresa_id)
          .gte("data_venda", inicio)
          .lte("data_venda", fim);

        const vendasAprovadas = (vendas || []).filter((v: any) => v.status === "aprovada");
        const totalVendasBruto = vendasAprovadas.reduce((s: number, v: any) => s + Number(v.valor_bruto), 0);
        const totalVendasLiquido = vendasAprovadas.reduce((s: number, v: any) => s + Number(v.valor_liquido), 0);
        const totalVendasTaxas = vendasAprovadas.reduce((s: number, v: any) => s + Number(v.taxa), 0);

        result = {
          periodo: { inicio, fim },
          receitas: { total: totalReceitas, quantidade: receitas.length },
          despesas: { total: totalDespesas, quantidade: despesas.length },
          saldo: totalReceitas - totalDespesas,
          pendentes: { total: pendentes.reduce((s: number, l: any) => s + Number(l.valor), 0), quantidade: pendentes.length },
          pagos: { total: pagos.reduce((s: number, l: any) => s + Number(l.valor), 0), quantidade: pagos.length },
          vendas_digitais: {
            total_bruto: totalVendasBruto,
            total_liquido: totalVendasLiquido,
            total_taxas: totalVendasTaxas,
            quantidade: vendasAprovadas.length,
            todas_vendas: (vendas || []).length,
          },
          contas_bancarias: contas || [],
          saldo_total_contas: saldoTotal,
        };
        break;
      }

      // ─── LANÇAMENTOS (RECEITAS E DESPESAS) ───
      case "lancamentos": {
        const { inicio, fim } = getDateRange(periodo);
        let query = supabase
          .from("lancamentos")
          .select("*, categoria:categoria_id(nome), cliente:cliente_id(nome), fornecedor:fornecedor_id(nome), conta_bancaria:conta_bancaria_id(nome), forma_pagamento:forma_pagamento_id(descricao), projeto:projeto_id(nome)")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim)
          .order("data_vencimento", { ascending: false });

        if (filters?.tipo) query = query.eq("tipo", filters.tipo);
        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.categoria_id) query = query.eq("categoria_id", filters.categoria_id);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }

      // ─── DESPESAS PENDENTES ───
      case "despesas-pendentes": {
        let query = supabase
          .from("lancamentos")
          .select("descricao, valor, data_vencimento, categoria:categoria_id(nome), fornecedor:fornecedor_id(nome)")
          .eq("empresa_id", empresa_id)
          .eq("tipo", "despesa")
          .eq("status", "pendente");

        // Aplicar filtro de datas se fornecido
        if (data_inicio_custom || data_fim_custom || periodo) {
          const { inicio, fim } = getDateRange(periodo);
          query = query.gte("data_vencimento", inicio).lte("data_vencimento", fim);
        }

        query = query.order("data_vencimento", { ascending: true }).limit(filters?.limit || 20);
        const { data } = await query;
        result = data;
        break;
      }

      // ─── RECEITAS PENDENTES ───
      case "receitas-pendentes": {
        let query = supabase
          .from("lancamentos")
          .select("descricao, valor, data_vencimento, categoria:categoria_id(nome), cliente:cliente_id(nome)")
          .eq("empresa_id", empresa_id)
          .eq("tipo", "receita")
          .eq("status", "pendente");

        // Aplicar filtro de datas se fornecido
        if (data_inicio_custom || data_fim_custom || periodo) {
          const { inicio, fim } = getDateRange(periodo);
          query = query.gte("data_vencimento", inicio).lte("data_vencimento", fim);
        }

        query = query.order("data_vencimento", { ascending: true }).limit(filters?.limit || 20);
        const { data } = await query;
        result = data;
        break;
      }

      // ─── RESUMO POR CATEGORIAS ───
      case "resumo-categorias": {
        const { inicio, fim } = getDateRange(periodo);

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, categoria:categoria_id(nome)")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim);

        const categorias: Record<string, { receitas: number; despesas: number }> = {};
        (lancamentos || []).forEach((l: any) => {
          const cat = l.categoria?.nome || "Sem categoria";
          if (!categorias[cat]) categorias[cat] = { receitas: 0, despesas: 0 };
          if (l.tipo === "receita") categorias[cat].receitas += Number(l.valor);
          else categorias[cat].despesas += Number(l.valor);
        });

        result = Object.entries(categorias).map(([nome, vals]) => ({ categoria: nome, ...vals }));
        break;
      }

      // ─── VENDAS DIGITAIS ───
      case "vendas-digitais": {
        const { inicio, fim } = getDateRange(periodo);
        let query = supabase
          .from("vendas_digitais")
          .select("*")
          .eq("empresa_id", empresa_id)
          .gte("data_venda", inicio)
          .lte("data_venda", fim)
          .order("data_venda", { ascending: false });

        if (filters?.plataforma) query = query.ilike("plataforma", filters.plataforma);
        if (filters?.status) query = query.ilike("status", filters.status);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) throw error;

        const totalBruto = (data || []).reduce((s: number, v: any) => s + Number(v.valor_bruto), 0);
        const totalLiquido = (data || []).reduce((s: number, v: any) => s + Number(v.valor_liquido), 0);
        const totalTaxas = (data || []).reduce((s: number, v: any) => s + Number(v.taxa), 0);

        result = {
          vendas: data,
          resumo: { total_bruto: totalBruto, total_liquido: totalLiquido, total_taxas: totalTaxas, quantidade: (data || []).length },
        };
        break;
      }

      // ─── RECEBIMENTOS DIGITAIS ───
      case "recebimentos-digitais": {
        const { data: vendas } = await supabase
          .from("vendas_digitais")
          .select("id")
          .eq("empresa_id", empresa_id);

        const vendaIds = (vendas || []).map((v: any) => v.id);

        if (vendaIds.length > 0) {
          let query = supabase
            .from("recebimentos_digitais")
            .select("*, venda:venda_id(produto, plataforma, cliente)")
            .in("venda_id", vendaIds);

          // Aplicar filtro de datas se fornecido
          if (data_inicio_custom || data_fim_custom || periodo) {
            const { inicio, fim } = getDateRange(periodo);
            query = query.gte("data_prevista", inicio).lte("data_prevista", fim);
          }

          query = query.order("data_prevista", { ascending: true });
          if (filters?.status) query = query.eq("status", filters.status);
          if (filters?.limit) query = query.limit(filters.limit);

          const { data } = await query;
          result = data;
        } else {
          result = [];
        }
        break;
      }

      // ─── CONTAS BANCÁRIAS ───
      case "contas-bancarias": {
        const { data } = await supabase
          .from("contas_bancarias")
          .select("*")
          .eq("empresa_id", empresa_id);

        result = data;
        break;
      }

      // ─── CLIENTES ───
      case "clientes": {
        let query = supabase
          .from("clientes")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.ativo !== undefined) query = query.eq("ativo", filters.ativo);
        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── FORNECEDORES ───
      case "fornecedores": {
        let query = supabase
          .from("fornecedores")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.ativo !== undefined) query = query.eq("ativo", filters.ativo);
        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── PROJETOS ───
      case "projetos": {
        let query = supabase
          .from("projetos")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("created_at", { ascending: false });

        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── CATEGORIAS ───
      case "categorias": {
        const { data } = await supabase
          .from("categorias")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        result = data;
        break;
      }

      // ─── FORMAS DE PAGAMENTO ───
      case "formas-pagamento": {
        const { data } = await supabase
          .from("formas_pagamento")
          .select("*")
          .eq("empresa_id", empresa_id);

        result = data;
        break;
      }

      // ─── LISTAR OPÇÕES PARA LANÇAMENTO ───
      case "listar-opcoes-lancamento": {
        const [categoriasRes, fornecedoresRes, contasRes, formasRes, clientesRes, projetosRes] = await Promise.all([
          supabase.from("categorias").select("id, nome, tipo").eq("empresa_id", empresa_id).order("nome", { ascending: true }),
          supabase.from("fornecedores").select("id, nome").eq("empresa_id", empresa_id).eq("ativo", true).order("nome", { ascending: true }),
          supabase.from("contas_bancarias").select("id, nome, banco, saldo_atual").eq("empresa_id", empresa_id),
          supabase.from("formas_pagamento").select("id, descricao").eq("empresa_id", empresa_id),
          supabase.from("clientes").select("id, nome").eq("empresa_id", empresa_id).eq("ativo", true).order("nome", { ascending: true }),
          supabase.from("projetos").select("id, nome").eq("empresa_id", empresa_id).eq("status", "ativo").order("nome", { ascending: true }),
        ]);

        const categorias = categoriasRes.data || [];
        const fornecedores = fornecedoresRes.data || [];
        const clientes = clientesRes.data || [];
        const contas_bancarias = contasRes.data || [];
        const formas_pagamento = formasRes.data || [];
        const projetos = projetosRes.data || [];

        // Gerar alertas para listas obrigatórias vazias
        const alertas: string[] = [];
        const categoriasDespesa = categorias.filter((c: any) => c.tipo === "despesa");
        const categoriasReceita = categorias.filter((c: any) => c.tipo === "receita");

        if (categorias.length === 0) {
          alertas.push("⚠️ Nenhuma CATEGORIA cadastrada. O usuário DEVE cadastrar pelo menos uma categoria antes de criar um lançamento. Use a ferramenta criar_categoria.");
        } else {
          if (categoriasDespesa.length === 0) alertas.push("⚠️ Nenhuma categoria do tipo DESPESA cadastrada. Cadastre uma antes de criar lançamentos de despesa.");
          if (categoriasReceita.length === 0) alertas.push("⚠️ Nenhuma categoria do tipo RECEITA cadastrada. Cadastre uma antes de criar lançamentos de receita.");
        }
        if (contas_bancarias.length === 0) {
          alertas.push("⚠️ Nenhuma CONTA BANCÁRIA cadastrada. O usuário DEVE cadastrar pelo menos uma conta antes de criar um lançamento. Use a ferramenta criar_conta_bancaria.");
        }
        if (formas_pagamento.length === 0) {
          alertas.push("⚠️ Nenhuma FORMA DE PAGAMENTO cadastrada. O usuário DEVE cadastrar pelo menos uma forma de pagamento antes de criar um lançamento. Use a ferramenta criar_forma_pagamento.");
        }
        if (fornecedores.length === 0) {
          alertas.push("⚠️ Nenhum FORNECEDOR cadastrado. Para criar lançamentos de DESPESA, o usuário deve cadastrar um fornecedor. Use a ferramenta criar_fornecedor.");
        }
        if (clientes.length === 0) {
          alertas.push("⚠️ Nenhum CLIENTE cadastrado. Para criar lançamentos de RECEITA, o usuário deve cadastrar um cliente. Use a ferramenta criar_cliente.");
        }

        result = {
          campos_obrigatorios: {
            sempre: ["tipo (receita/despesa)", "categoria_id", "forma_pagamento_id", "conta_bancaria_id", "descricao", "valor", "data_vencimento"],
            se_receita: ["cliente_id"],
            se_despesa: ["fornecedor_id"],
          },
          alertas,
          categorias: {
            despesa: categoriasDespesa,
            receita: categoriasReceita,
          },
          fornecedores,
          clientes,
          contas_bancarias,
          formas_pagamento,
          projetos,
        };
        break;
      }

      // ─── FLUXO DE CAIXA (comparativo mensal) ───
      case "fluxo-caixa": {
        const { inicio, fim } = getDateRange(periodo || "semestre");

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, data_vencimento")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim);

        const meses: Record<string, { receitas: number; despesas: number }> = {};
        (lancamentos || []).forEach((l: any) => {
          const mes = l.data_vencimento?.slice(0, 7); // YYYY-MM
          if (!meses[mes]) meses[mes] = { receitas: 0, despesas: 0 };
          if (l.tipo === "receita") meses[mes].receitas += Number(l.valor);
          else meses[mes].despesas += Number(l.valor);
        });

        result = Object.entries(meses)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mes, vals]) => ({ mes, ...vals, saldo: vals.receitas - vals.despesas }));
        break;
      }

      // ─── CRIAR LANÇAMENTO (RECEITA OU DESPESA) ───
      case "criar-lancamento": {
        const descricao = sanitize(body.descricao);
        const valor = body.valor;
        const tipo = sanitize(body.tipo);
        const status_lanc = sanitize(body.status) || "pendente";
        const data_vencimento = sanitize(body.data_vencimento);
        const categoria_id = sanitize(body.categoria_id);
        const cliente_id = sanitize(body.cliente_id);
        const fornecedor_id = sanitize(body.fornecedor_id);
        const conta_bancaria_id = sanitize(body.conta_bancaria_id);
        const forma_pagamento_id = sanitize(body.forma_pagamento_id);
        const projeto_id = sanitize(body.projeto_id);
        const data_pagamento = sanitize(body.data_pagamento);

        if (!descricao || valor === undefined || valor === null) {
          return new Response(JSON.stringify({ error: "descricao and valor are required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!tipo || !["receita", "despesa"].includes(tipo)) {
          return new Response(JSON.stringify({ 
            error: "Tipo obrigatório", 
            message: "O campo 'tipo' é obrigatório e deve ser 'receita' ou 'despesa'. Pergunte ao usuário qual o tipo do lançamento." 
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (!data_vencimento) {
          return new Response(JSON.stringify({ error: "data_vencimento is required (YYYY-MM-DD)" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Validação condicional: receita exige cliente, despesa exige fornecedor
        const camposObrigatorios: { campo: string; valor: string | null; label: string }[] = [
          { campo: "categoria_id", valor: categoria_id, label: "Categoria" },
          { campo: "forma_pagamento_id", valor: forma_pagamento_id, label: "Forma de Pagamento" },
          { campo: "conta_bancaria_id", valor: conta_bancaria_id, label: "Conta Bancária" },
        ];

        if (tipo === "receita") {
          camposObrigatorios.push({ campo: "cliente_id", valor: cliente_id, label: "Cliente (obrigatório para receita)" });
        } else {
          camposObrigatorios.push({ campo: "fornecedor_id", valor: fornecedor_id, label: "Fornecedor (obrigatório para despesa)" });
        }

        const faltando = camposObrigatorios.filter(c => !c.valor).map(c => c.label);
        if (faltando.length > 0) {
          return new Response(JSON.stringify({ 
            error: "Campos obrigatórios não informados", 
            message: `Para criar um lançamento do tipo '${tipo}', é obrigatório informar: ${faltando.join(", ")}. Use a ferramenta listar_opcoes_lancamento para obter os IDs disponíveis ou cadastre antes de prosseguir.`,
            campos_faltando: faltando 
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const insertData: any = {
          empresa_id,
          descricao,
          valor: Number(valor),
          tipo,
          status: status_lanc,
          data_vencimento,
          origem: "n8n",
        };
        if (categoria_id) insertData.categoria_id = categoria_id;
        if (cliente_id) insertData.cliente_id = cliente_id;
        if (fornecedor_id) insertData.fornecedor_id = fornecedor_id;
        if (conta_bancaria_id) insertData.conta_bancaria_id = conta_bancaria_id;
        if (forma_pagamento_id) insertData.forma_pagamento_id = forma_pagamento_id;
        if (projeto_id) insertData.projeto_id = projeto_id;
        if (data_pagamento) insertData.data_pagamento = data_pagamento;

        const { data: newLanc, error: insertError } = await supabase
          .from("lancamentos")
          .insert(insertData)
          .select("*")
          .single();

        if (insertError) throw insertError;
        result = newLanc;
        break;
      }

      // ─── ATUALIZAR TELEGRAM ID DO USUÁRIO ───
      case "atualizar-telegram-id": {
        const telegram_id = sanitize(body.telegram_id);
        const target_user_id = sanitize(body.user_id) || sanitize(user_id);
        const target_email = sanitize(body.email);

        if (!telegram_id) {
          return new Response(JSON.stringify({ error: "telegram_id is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!target_user_id && !target_email) {
          return new Response(JSON.stringify({ error: "user_id or email is required to identify the user" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let updateQuery = supabase
          .from("perfis")
          .update({ telegram_id: String(telegram_id) });

        if (target_user_id) {
          updateQuery = updateQuery.eq("id", target_user_id);
        } else if (target_email) {
          updateQuery = updateQuery.ilike("email", target_email.trim().toLowerCase());
        }

        const { data: updatedPerfil, error: updateError } = await updateQuery
          .select("id, nome, email, telegram_id")
          .single();

        if (updateError) throw updateError;
        result = updatedPerfil;
        break;
      }

      // ─── ATUALIZAR TELEGRAM ID DO CLIENTE ───
      case "atualizar-telegram-cliente": {
        const telegram_id = sanitize(body.telegram_id);
        const cliente_id_target = sanitize(body.cliente_id);
        const cliente_email = sanitize(body.email);
        const cliente_telefone = sanitize(body.telefone);

        if (!telegram_id) {
          return new Response(JSON.stringify({ error: "telegram_id is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!cliente_id_target && !cliente_email && !cliente_telefone) {
          return new Response(JSON.stringify({ error: "cliente_id, email or telefone is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let clienteQuery = supabase
          .from("clientes")
          .update({ telegram_id: String(telegram_id) })
          .eq("empresa_id", empresa_id);

        if (cliente_id_target) {
          clienteQuery = clienteQuery.eq("id", cliente_id_target);
        } else if (cliente_email) {
          clienteQuery = clienteQuery.ilike("email", cliente_email.trim().toLowerCase());
        } else if (cliente_telefone) {
          clienteQuery = clienteQuery.ilike("telefone", `%${cliente_telefone.replace(/\D/g, "")}%`);
        }

        const { data: updatedCliente, error: clienteError } = await clienteQuery
          .select("id, nome, email, telefone, telegram_id")
          .single();

        if (clienteError) throw clienteError;
        result = updatedCliente;
        break;
      }

      // ─── CRIAR CLIENTE ───
      case "criar-cliente": {
        const nome = sanitize(body.nome);
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const clienteData: any = {
          empresa_id,
          nome,
          origem: "manual",
          ativo: body.ativo !== undefined ? body.ativo : true,
        };
        const cli_cpf_cnpj = sanitize(body.cpf_cnpj);
        const cli_telefone = sanitize(body.telefone);
        const cli_email = sanitize(body.email);
        const cli_cep = sanitize(body.cep);
        const cli_rua = sanitize(body.rua);
        const cli_numero = sanitize(body.numero);
        const cli_complemento = sanitize(body.complemento);
        const cli_bairro = sanitize(body.bairro);
        const cli_cidade = sanitize(body.cidade);
        const cli_estado = sanitize(body.estado);
        if (cli_cpf_cnpj) clienteData.cpf_cnpj = cli_cpf_cnpj;
        if (cli_telefone) clienteData.telefone = cli_telefone;
        if (cli_email) clienteData.email = cli_email;
        if (cli_cep) clienteData.cep = cli_cep;
        if (cli_rua) clienteData.rua = cli_rua;
        if (cli_numero) clienteData.numero = cli_numero;
        if (cli_complemento) clienteData.complemento = cli_complemento;
        if (cli_bairro) clienteData.bairro = cli_bairro;
        if (cli_cidade) clienteData.cidade = cli_cidade;
        if (cli_estado) clienteData.estado = cli_estado;

        const { data: newCli, error: cliError } = await supabase
          .from("clientes").insert(clienteData).select("*").single();
        if (cliError) throw cliError;
        result = newCli;
        break;
      }

      // ─── CRIAR FORNECEDOR ───
      case "criar-fornecedor": {
        const nome = sanitize(body.nome);
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const fornecedorData: any = {
          empresa_id,
          nome,
          ativo: body.ativo !== undefined ? body.ativo : true,
        };
        const cpf_cnpj = sanitize(body.cpf_cnpj);
        const telefone = sanitize(body.telefone);
        const email_forn = sanitize(body.email);
        const cep = sanitize(body.cep);
        const rua = sanitize(body.rua);
        const numero = sanitize(body.numero);
        const complemento = sanitize(body.complemento);
        const bairro = sanitize(body.bairro);
        const cidade = sanitize(body.cidade);
        const estado = sanitize(body.estado);
        if (cpf_cnpj) fornecedorData.cpf_cnpj = cpf_cnpj;
        if (telefone) fornecedorData.telefone = telefone;
        if (email_forn) fornecedorData.email = email_forn;
        if (cep) fornecedorData.cep = cep;
        if (rua) fornecedorData.rua = rua;
        if (numero) fornecedorData.numero = numero;
        if (complemento) fornecedorData.complemento = complemento;
        if (bairro) fornecedorData.bairro = bairro;
        if (cidade) fornecedorData.cidade = cidade;
        if (estado) fornecedorData.estado = estado;

        const { data: newForn, error: fornError } = await supabase
          .from("fornecedores").insert(fornecedorData).select("*").single();
        if (fornError) throw fornError;
        result = newForn;
        break;
      }

      // ─── CRIAR CATEGORIA ───
      case "criar-categoria": {
        const nome = sanitize(body.nome);
        const tipo = sanitize(body.tipo) || "despesa";
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!["receita", "despesa", "investimento"].includes(tipo)) {
          return new Response(JSON.stringify({ error: "tipo must be receita, despesa or investimento" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: newCat, error: catError } = await supabase
          .from("categorias").insert({ empresa_id, nome, tipo }).select("*").single();
        if (catError) throw catError;
        result = newCat;
        break;
      }

      // ─── CRIAR CONTA BANCÁRIA ───
      case "criar-conta-bancaria": {
        const nome = sanitize(body.nome);
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const contaData: any = {
          empresa_id,
          nome,
          principal: body.principal === true,
          saldo_inicial: Number(body.saldo_inicial) || 0,
          saldo_atual: Number(body.saldo_inicial) || 0,
        };
        const banco = sanitize(body.banco);
        const agencia = sanitize(body.agencia);
        const conta = sanitize(body.conta);
        if (banco) contaData.banco = banco;
        if (agencia) contaData.agencia = agencia;
        if (conta) contaData.conta = conta;

        if (contaData.principal) {
          await supabase.from("contas_bancarias").update({ principal: false }).eq("empresa_id", empresa_id).eq("principal", true);
        }
        const { data: newConta, error: contaError } = await supabase
          .from("contas_bancarias").insert(contaData).select("*").single();
        if (contaError) throw contaError;
        result = newConta;
        break;
      }

      // ─── CRIAR FORMA DE PAGAMENTO ───
      case "criar-forma-pagamento": {
        const descricao = sanitize(body.descricao);
        if (!descricao) {
          return new Response(JSON.stringify({ error: "descricao is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: newForma, error: formaError } = await supabase
          .from("formas_pagamento").insert({ empresa_id, descricao }).select("*").single();
        if (formaError) throw formaError;
        result = newForma;
        break;
      }

      // ─── CRIAR PROJETO ───
      case "criar-projeto": {
        const nome = sanitize(body.nome);
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const projetoData: any = {
          empresa_id,
          nome,
          status: sanitize(body.status) || "ativo",
          orcamento: Number(body.orcamento) || 0,
        };
        const descricaoPrj = sanitize(body.descricao);
        if (descricaoPrj) projetoData.descricao = descricaoPrj;

        const { data: newProj, error: projError } = await supabase
          .from("projetos").insert(projetoData).select("*").single();
        if (projError) throw projError;
        result = newProj;
        break;
      }

      // ─── LISTAR ANÚNCIOS (INTEGRAÇÕES DE ADS) ───
      case "listar-anuncios": {
        const { data: integracoes } = await supabase
          .from("integracoes")
          .select("*")
          .eq("empresa_id", empresa_id)
          .in("plataforma", ["meta_ads", "google_ads", "facebook_ads"]);

        // Also get vendas_digitais as ads performance proxy
        const { inicio, fim } = getDateRange(periodo);
        const { data: vendas } = await supabase
          .from("vendas_digitais")
          .select("*")
          .eq("empresa_id", empresa_id)
          .gte("data_venda", inicio)
          .lte("data_venda", fim);

        if (filters?.plataforma) {
          const plat = filters.plataforma.toLowerCase();
          result = {
            integracoes: (integracoes || []).filter((i: any) => i.plataforma.toLowerCase().includes(plat)),
            vendas_por_plataforma: (vendas || []).filter((v: any) => v.plataforma.toLowerCase().includes(plat)),
          };
        } else {
          result = {
            integracoes: integracoes || [],
            vendas_por_plataforma: vendas || [],
          };
        }

        const totalInvestido = (result.vendas_por_plataforma || []).reduce((s: number, v: any) => s + Number(v.taxa || 0), 0);
        const totalReceita = (result.vendas_por_plataforma || []).reduce((s: number, v: any) => s + Number(v.valor_bruto || 0), 0);
        result.resumo = {
          total_integracoes: (result.integracoes || []).length,
          total_vendas: (result.vendas_por_plataforma || []).length,
          total_investido: totalInvestido,
          total_receita: totalReceita,
          roas: totalInvestido > 0 ? (totalReceita / totalInvestido).toFixed(2) : null,
        };
        break;
      }

      // ─── LISTAR USUÁRIOS DA EMPRESA ───
      case "listar-usuarios": {
        let query = supabase
          .from("perfis")
          .select("id, nome, email, permissao, created_at, empresa_id, foto_url, telegram_id, evolution_webhook_url")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.permissao) query = query.eq("permissao", filters.permissao);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data: perfis } = await query;

        // Fetch roles for these users
        const userIds = (perfis || []).map((p: any) => p.id);
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("empresa_id", empresa_id)
          .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

        result = (perfis || []).map((p: any) => ({
          ...p,
          role: (roles || []).find((r: any) => r.user_id === p.id)?.role || "leitura",
        }));
        break;
      }

      // ─── HELPER: CHECK VINCULATION WITH PAID/RECEIVED LANCAMENTOS ───
      // Used by edit/delete actions to block changes on records linked to settled lancamentos

      // ─── EDITAR CLIENTE ───
      case "editar-cliente": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        // Check if client was added automatically
        const { data: cliOrigem } = await supabase.from("clientes").select("origem").eq("id", id).eq("empresa_id", empresa_id).single();
        if (cliOrigem && cliOrigem.origem !== "manual") {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este cliente foi adicionado automaticamente (via integração) e não pode ser editado. Solicite a alteração via suporte." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Check vinculation
        const { data: vincCliente } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("cliente_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincCliente && vincCliente.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este cliente possui lançamentos pagos/recebidos vinculados e não pode ser alterado." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const updateData: any = {};
        const fields = ["nome", "email", "telefone", "cpf_cnpj", "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado", "ativo"];
        for (const f of fields) { const v = sanitize(body[f]); if (v !== undefined) updateData[f] = f === "ativo" ? body[f] === true || body[f] === "true" : v; }
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updCli, error: updCliErr } = await supabase.from("clientes").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updCliErr) throw updCliErr;
        result = updCli;
        break;
      }

      // ─── EDITAR FORNECEDOR ───
      case "editar-fornecedor": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: vincForn } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("fornecedor_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincForn && vincForn.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este fornecedor possui lançamentos pagos/recebidos vinculados e não pode ser alterado." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const updateData: any = {};
        const fields = ["nome", "email", "telefone", "cpf_cnpj", "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado", "ativo"];
        for (const f of fields) { const v = sanitize(body[f]); if (v !== undefined) updateData[f] = f === "ativo" ? body[f] === true || body[f] === "true" : v; }
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updForn, error: updFornErr } = await supabase.from("fornecedores").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updFornErr) throw updFornErr;
        result = updForn;
        break;
      }

      // ─── EDITAR CATEGORIA ───
      case "editar-categoria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: vincCat } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("categoria_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincCat && vincCat.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta categoria possui lançamentos pagos/recebidos vinculados e não pode ser alterada." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const updateData: any = {};
        if (sanitize(body.nome)) updateData.nome = sanitize(body.nome);
        if (sanitize(body.tipo)) updateData.tipo = sanitize(body.tipo);
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updCat, error: updCatErr } = await supabase.from("categorias").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updCatErr) throw updCatErr;
        result = updCat;
        break;
      }

      // ─── EDITAR CONTA BANCÁRIA ───
      case "editar-conta-bancaria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: vincConta } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("conta_bancaria_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincConta && vincConta.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta conta bancária possui lançamentos pagos/recebidos vinculados e não pode ser alterada." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const updateData: any = {};
        const fields = ["nome", "banco", "agencia", "conta", "principal"];
        for (const f of fields) { const v = sanitize(body[f]); if (v !== undefined) updateData[f] = f === "principal" ? body[f] === true || body[f] === "true" : v; }
        if (body.saldo_atual !== undefined && sanitize(body.saldo_atual) !== undefined) updateData.saldo_atual = Number(body.saldo_atual);
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        if (updateData.principal === true) {
          await supabase.from("contas_bancarias").update({ principal: false }).eq("empresa_id", empresa_id).eq("principal", true).neq("id", id);
        }

        const { data: updConta, error: updContaErr } = await supabase.from("contas_bancarias").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updContaErr) throw updContaErr;
        result = updConta;
        break;
      }

      // ─── EDITAR FORMA DE PAGAMENTO ───
      case "editar-forma-pagamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: vincForma } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("forma_pagamento_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincForma && vincForma.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta forma de pagamento possui lançamentos pagos/recebidos vinculados e não pode ser alterada." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const descricao = sanitize(body.descricao);
        if (!descricao) return new Response(JSON.stringify({ error: "descricao is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updForma, error: updFormaErr } = await supabase.from("formas_pagamento").update({ descricao }).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updFormaErr) throw updFormaErr;
        result = updForma;
        break;
      }

      // ─── EDITAR PROJETO ───
      case "editar-projeto": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const updateData: any = {};
        if (sanitize(body.nome)) updateData.nome = sanitize(body.nome);
        if (sanitize(body.descricao)) updateData.descricao = sanitize(body.descricao);
        if (sanitize(body.status)) updateData.status = sanitize(body.status);
        if (body.orcamento !== undefined && sanitize(body.orcamento) !== undefined) updateData.orcamento = Number(body.orcamento);
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updProj, error: updProjErr } = await supabase.from("projetos").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updProjErr) throw updProjErr;
        result = updProj;
        break;
      }

      // ─── EDITAR LANÇAMENTO ───
      case "editar-lancamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        // Check if lancamento is paid/received - block edit
        const { data: lancExist } = await supabase.from("lancamentos").select("id, status, origem").eq("id", id).eq("empresa_id", empresa_id).maybeSingle();
        if (!lancExist) return new Response(JSON.stringify({ error: "Lançamento não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (["pago", "recebido"].includes(lancExist.status)) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este lançamento já foi pago/recebido e não pode ser alterado." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const updateData: any = {};
        const fields = ["descricao", "tipo", "status", "data_vencimento", "data_pagamento", "categoria_id", "cliente_id", "fornecedor_id", "conta_bancaria_id", "forma_pagamento_id", "projeto_id"];
        for (const f of fields) { const v = sanitize(body[f]); if (v !== undefined) updateData[f] = v; }
        if (body.valor !== undefined && sanitize(body.valor) !== undefined) updateData.valor = Number(body.valor);
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updLanc, error: updLancErr } = await supabase.from("lancamentos").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updLancErr) throw updLancErr;
        result = updLanc;
        break;
      }

      // ─── EXCLUIR CLIENTE ───
      case "excluir-cliente": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        // Check if client was added automatically
        const { data: cliDelOrigem } = await supabase.from("clientes").select("origem").eq("id", id).eq("empresa_id", empresa_id).single();
        if (cliDelOrigem && cliDelOrigem.origem !== "manual") {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este cliente foi adicionado automaticamente (via integração) e não pode ser excluído. Solicite a exclusão via suporte." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: vincDelCli } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("cliente_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelCli && vincDelCli.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este cliente possui lançamentos pagos/recebidos vinculados e não pode ser excluído." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delCliErr } = await supabase.from("clientes").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delCliErr) throw delCliErr;
        result = { message: "Cliente excluído com sucesso", id };
        break;
      }

      // ─── EXCLUIR FORNECEDOR ───
      case "excluir-fornecedor": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelForn } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("fornecedor_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelForn && vincDelForn.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este fornecedor possui lançamentos pagos/recebidos vinculados e não pode ser excluído." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delFornErr } = await supabase.from("fornecedores").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delFornErr) throw delFornErr;
        result = { message: "Fornecedor excluído com sucesso", id };
        break;
      }

      // ─── EXCLUIR CATEGORIA ───
      case "excluir-categoria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelCat } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("categoria_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelCat && vincDelCat.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta categoria possui lançamentos pagos/recebidos vinculados e não pode ser excluída." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delCatErr } = await supabase.from("categorias").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delCatErr) throw delCatErr;
        result = { message: "Categoria excluída com sucesso", id };
        break;
      }

      // ─── EXCLUIR CONTA BANCÁRIA ───
      case "excluir-conta-bancaria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelConta } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("conta_bancaria_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelConta && vincDelConta.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta conta bancária possui lançamentos pagos/recebidos vinculados e não pode ser excluída." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delContaErr } = await supabase.from("contas_bancarias").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delContaErr) throw delContaErr;
        result = { message: "Conta bancária excluída com sucesso", id };
        break;
      }

      // ─── EXCLUIR FORMA DE PAGAMENTO ───
      case "excluir-forma-pagamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelForma } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("forma_pagamento_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelForma && vincDelForma.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta forma de pagamento possui lançamentos pagos/recebidos vinculados e não pode ser excluída." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delFormaErr } = await supabase.from("formas_pagamento").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delFormaErr) throw delFormaErr;
        result = { message: "Forma de pagamento excluída com sucesso", id };
        break;
      }

      // ─── EXCLUIR PROJETO ───
      case "excluir-projeto": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error: delProjErr } = await supabase.from("projetos").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delProjErr) throw delProjErr;
        result = { message: "Projeto excluído com sucesso", id };
        break;
      }

      // ─── EXCLUIR LANÇAMENTO ───
      case "excluir-lancamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: lancDel } = await supabase.from("lancamentos").select("id, status").eq("id", id).eq("empresa_id", empresa_id).maybeSingle();
        if (!lancDel) return new Response(JSON.stringify({ error: "Lançamento não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (["pago", "recebido"].includes(lancDel.status)) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este lançamento já foi pago/recebido e não pode ser excluído." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delLancErr } = await supabase.from("lancamentos").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delLancErr) throw delLancErr;
        result = { message: "Lançamento excluído com sucesso", id };
        break;
      }

      default:
        return new Response(JSON.stringify({
          error: "Invalid action",
          available_actions: [
            "resumo-financeiro", "lancamentos", "despesas-pendentes", "receitas-pendentes",
            "resumo-categorias", "vendas-digitais", "recebimentos-digitais", "contas-bancarias",
            "clientes", "fornecedores", "projetos", "categorias", "formas-pagamento", "fluxo-caixa",
            "criar-lancamento", "criar-cliente", "criar-fornecedor", "criar-categoria", "criar-conta-bancaria",
            "criar-forma-pagamento", "criar-projeto", "atualizar-telegram-id", "atualizar-telegram-cliente",
            "listar-anuncios", "listar-usuarios",
            "editar-cliente", "editar-fornecedor", "editar-categoria", "editar-conta-bancaria",
            "editar-forma-pagamento", "editar-projeto", "editar-lancamento",
            "excluir-cliente", "excluir-fornecedor", "excluir-categoria", "excluir-conta-bancaria",
            "excluir-forma-pagamento", "excluir-projeto", "excluir-lancamento"
          ],
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const duration = Date.now() - new Date(requestTimestamp).getTime();
    const responseLog = {
      timestamp: new Date().toISOString(),
      action,
      empresa_id,
      duration_ms: duration,
      result_type: Array.isArray(result) ? "array" : typeof result,
      result_count: Array.isArray(result) ? result.length : (result && typeof result === "object" ? Object.keys(result).length : null),
      status: 200,
    };
    console.log("📤 [n8n-query] RESPONSE:", JSON.stringify(responseLog, null, 2));

    // Salvar log no banco
    try {
      await supabase.from("logs_integracoes").insert({
        empresa_id,
        plataforma: "n8n-query",
        evento: action,
        status: "sucesso",
        payload: {
          request: { action, periodo, filters, user_id },
          response: { duration_ms: duration, result_count: responseLog.result_count },
          endpoint: `${supabaseUrl}/functions/v1/n8n-query`,
          format: { method: "POST", content_type: "application/json", body_schema: { action: "string", empresa_id: "uuid", periodo: "string?", filters: "object?" } },
        },
      });
    } catch (logErr) {
      console.warn("⚠️ [n8n-query] Falha ao salvar log:", logErr);
    }

    return new Response(JSON.stringify({ success: true, action, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [n8n-query] ERROR:", error);

    // Tentar salvar log de erro
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const body2 = await req.clone().json().catch(() => ({}));
      await supabase.from("logs_integracoes").insert({
        empresa_id: body2.empresa_id || "00000000-0000-0000-0000-000000000000",
        plataforma: "n8n-query",
        evento: body2.action || "unknown",
        status: "erro",
        payload: { error: error.message, request: body2 },
      });
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
