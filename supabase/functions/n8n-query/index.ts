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
        const { data } = await supabase
          .from("lancamentos")
          .select("descricao, valor, data_vencimento, categoria:categoria_id(nome), fornecedor:fornecedor_id(nome)")
          .eq("empresa_id", empresa_id)
          .eq("tipo", "despesa")
          .eq("status", "pendente")
          .order("data_vencimento", { ascending: true })
          .limit(filters?.limit || 20);

        result = data;
        break;
      }

      // ─── RECEITAS PENDENTES ───
      case "receitas-pendentes": {
        const { data } = await supabase
          .from("lancamentos")
          .select("descricao, valor, data_vencimento, categoria:categoria_id(nome), cliente:cliente_id(nome)")
          .eq("empresa_id", empresa_id)
          .eq("tipo", "receita")
          .eq("status", "pendente")
          .order("data_vencimento", { ascending: true })
          .limit(filters?.limit || 20);

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
            .in("venda_id", vendaIds)
            .order("data_prevista", { ascending: true });

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
        const tipo = sanitize(body.tipo) || "despesa";
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

        if (!data_vencimento) {
          return new Response(JSON.stringify({ error: "data_vencimento is required (YYYY-MM-DD)" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
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

      default:
        return new Response(JSON.stringify({
          error: "Invalid action",
          available_actions: [
            "resumo-financeiro", "lancamentos", "despesas-pendentes", "receitas-pendentes",
            "resumo-categorias", "vendas-digitais", "recebimentos-digitais", "contas-bancarias",
            "clientes", "fornecedores", "projetos", "categorias", "formas-pagamento", "fluxo-caixa",
            "criar-lancamento", "atualizar-telegram-id", "atualizar-telegram-cliente",
            "listar-anuncios", "listar-usuarios"
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
