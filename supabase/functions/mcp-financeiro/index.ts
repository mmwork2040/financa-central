import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const app = new Hono();

const mcpServer = new McpServer({
  name: "financeiro-mcp",
  version: "1.0.0",
});

// ─── Helpers ───

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

function getBrazilDate() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

function getDateRange(p?: string) {
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
  return { inicio: inicioDate + "T00:00:00.000-03:00", fim };
}

// ─── Tool: Resumo Financeiro ───
mcpServer.tool({
  name: "resumo_financeiro",
  description: "Retorna o resumo financeiro geral: receitas, despesas, saldo, vendas digitais e contas bancárias. Use quando o usuário pedir resumo, visão geral ou balanço.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      periodo: { type: "string", description: "Período: semana, mes, trimestre, semestre ou ano" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, periodo }: any) => {
    const supabase = getSupabase();
    const { inicio, fim } = getDateRange(periodo || "mes");
    const { data: lancamentos } = await supabase.from("lancamentos").select("tipo, valor, status").eq("empresa_id", empresa_id).gte("data_vencimento", inicio).lte("data_vencimento", fim);
    const receitas = (lancamentos || []).filter((l: any) => l.tipo === "receita");
    const despesas = (lancamentos || []).filter((l: any) => l.tipo === "despesa");
    const totalReceitas = receitas.reduce((s: number, l: any) => s + Number(l.valor), 0);
    const totalDespesas = despesas.reduce((s: number, l: any) => s + Number(l.valor), 0);
    const pendentes = (lancamentos || []).filter((l: any) => l.status === "pendente");
    const pagos = (lancamentos || []).filter((l: any) => l.status === "pago");
    const { data: contas } = await supabase.from("contas_bancarias").select("nome, saldo_atual").eq("empresa_id", empresa_id);
    const saldoTotal = (contas || []).reduce((s: number, c: any) => s + Number(c.saldo_atual), 0);
    const { data: vendas } = await supabase.from("vendas_digitais").select("valor_bruto, valor_liquido, taxa, status").eq("empresa_id", empresa_id).gte("data_venda", inicio).lte("data_venda", fim);
    const vendasAprovadas = (vendas || []).filter((v: any) => v.status === "aprovada");
    const result = {
      periodo: { inicio, fim },
      receitas: { total: totalReceitas, quantidade: receitas.length },
      despesas: { total: totalDespesas, quantidade: despesas.length },
      saldo: totalReceitas - totalDespesas,
      pendentes: { total: pendentes.reduce((s: number, l: any) => s + Number(l.valor), 0), quantidade: pendentes.length },
      pagos: { total: pagos.reduce((s: number, l: any) => s + Number(l.valor), 0), quantidade: pagos.length },
      vendas_digitais: {
        total_bruto: vendasAprovadas.reduce((s: number, v: any) => s + Number(v.valor_bruto), 0),
        total_liquido: vendasAprovadas.reduce((s: number, v: any) => s + Number(v.valor_liquido), 0),
        total_taxas: vendasAprovadas.reduce((s: number, v: any) => s + Number(v.taxa), 0),
        quantidade: vendasAprovadas.length,
      },
      contas_bancarias: contas || [],
      saldo_total_contas: saldoTotal,
    };
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

// ─── Tool: Lançamentos ───
mcpServer.tool({
  name: "lancamentos",
  description: "Lista lançamentos financeiros (receitas e despesas) com filtros. Use quando o usuário pedir lançamentos, movimentações, entradas ou saídas.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      periodo: { type: "string", description: "Período: semana, mes, trimestre, semestre ou ano" },
      tipo: { type: "string", description: "Filtro: receita ou despesa" },
      status: { type: "string", description: "Filtro: pendente ou pago" },
      categoria_id: { type: "string", description: "Filtro: UUID da categoria" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, periodo, tipo, status, categoria_id, limit }: any) => {
    const supabase = getSupabase();
    const { inicio, fim } = getDateRange(periodo || "mes");
    let query = supabase.from("lancamentos").select("*, categoria:categoria_id(nome), cliente:cliente_id(nome), fornecedor:fornecedor_id(nome), conta_bancaria:conta_bancaria_id(nome), forma_pagamento:forma_pagamento_id(descricao), projeto:projeto_id(nome)").eq("empresa_id", empresa_id).gte("data_vencimento", inicio).lte("data_vencimento", fim).order("data_vencimento", { ascending: false });
    if (tipo) query = query.eq("tipo", tipo);
    if (status) query = query.eq("status", status);
    if (categoria_id) query = query.eq("categoria_id", categoria_id);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Despesas Pendentes ───
mcpServer.tool({
  name: "despesas_pendentes",
  description: "Lista despesas com status pendente ordenadas por vencimento. Use quando o usuário pedir contas a pagar, despesas pendentes ou vencimentos.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, limit }: any) => {
    const supabase = getSupabase();
    const { data } = await supabase.from("lancamentos").select("descricao, valor, data_vencimento, categoria:categoria_id(nome), fornecedor:fornecedor_id(nome)").eq("empresa_id", empresa_id).eq("tipo", "despesa").eq("status", "pendente").order("data_vencimento", { ascending: true }).limit(limit || 20);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Receitas Pendentes ───
mcpServer.tool({
  name: "receitas_pendentes",
  description: "Lista receitas com status pendente ordenadas por vencimento. Use quando o usuário pedir contas a receber ou receitas pendentes.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, limit }: any) => {
    const supabase = getSupabase();
    const { data } = await supabase.from("lancamentos").select("descricao, valor, data_vencimento, categoria:categoria_id(nome), cliente:cliente_id(nome)").eq("empresa_id", empresa_id).eq("tipo", "receita").eq("status", "pendente").order("data_vencimento", { ascending: true }).limit(limit || 20);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Resumo por Categorias ───
mcpServer.tool({
  name: "resumo_categorias",
  description: "Totais de receitas e despesas agrupados por categoria. Use quando o usuário pedir resumo por categoria ou análise de gastos por tipo.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      periodo: { type: "string", description: "Período: semana, mes, trimestre, semestre ou ano" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, periodo }: any) => {
    const supabase = getSupabase();
    const { inicio, fim } = getDateRange(periodo || "mes");
    const { data: lancamentos } = await supabase.from("lancamentos").select("tipo, valor, categoria:categoria_id(nome)").eq("empresa_id", empresa_id).gte("data_vencimento", inicio).lte("data_vencimento", fim);
    const categorias: Record<string, { receitas: number; despesas: number }> = {};
    (lancamentos || []).forEach((l: any) => {
      const cat = l.categoria?.nome || "Sem categoria";
      if (!categorias[cat]) categorias[cat] = { receitas: 0, despesas: 0 };
      if (l.tipo === "receita") categorias[cat].receitas += Number(l.valor);
      else categorias[cat].despesas += Number(l.valor);
    });
    const result = Object.entries(categorias).map(([nome, vals]) => ({ categoria: nome, ...vals }));
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

// ─── Tool: Vendas Digitais ───
mcpServer.tool({
  name: "vendas_digitais",
  description: "Consulta vendas realizadas em plataformas digitais (Hotmart, Kiwify, Monetizze, Eduzz). Use quando o usuário pedir vendas online, vendas digitais ou relatório de vendas.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      periodo: { type: "string", description: "Período: semana, mes, trimestre, semestre ou ano" },
      plataforma: { type: "string", description: "Nome da plataforma (ex: Hotmart, Kiwify)" },
      status: { type: "string", description: "Status da venda (ex: aprovada, pendente)" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, periodo, plataforma, status, limit }: any) => {
    const supabase = getSupabase();
    const { inicio, fim } = getDateRange(periodo || "mes");
    let query = supabase.from("vendas_digitais").select("*").eq("empresa_id", empresa_id).gte("data_venda", inicio).lte("data_venda", fim).order("data_venda", { ascending: false });
    if (plataforma) query = query.ilike("plataforma", plataforma);
    if (status) query = query.ilike("status", status);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    const totalBruto = (data || []).reduce((s: number, v: any) => s + Number(v.valor_bruto), 0);
    const totalLiquido = (data || []).reduce((s: number, v: any) => s + Number(v.valor_liquido), 0);
    const totalTaxas = (data || []).reduce((s: number, v: any) => s + Number(v.taxa), 0);
    return { content: [{ type: "text", text: JSON.stringify({ vendas: data, resumo: { total_bruto: totalBruto, total_liquido: totalLiquido, total_taxas: totalTaxas, quantidade: (data || []).length } }) }] };
  },
});

// ─── Tool: Recebimentos Digitais ───
mcpServer.tool({
  name: "recebimentos_digitais",
  description: "Recebimentos vinculados a vendas digitais. Use quando o usuário pedir recebimentos pendentes de plataformas digitais.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      status: { type: "string", description: "Status: pendente ou recebido" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, status, limit }: any) => {
    const supabase = getSupabase();
    const { data: vendas } = await supabase.from("vendas_digitais").select("id").eq("empresa_id", empresa_id);
    const vendaIds = (vendas || []).map((v: any) => v.id);
    if (vendaIds.length === 0) return { content: [{ type: "text", text: "[]" }] };
    let query = supabase.from("recebimentos_digitais").select("*, venda:venda_id(produto, plataforma, cliente)").in("venda_id", vendaIds).order("data_prevista", { ascending: true });
    if (status) query = query.eq("status", status);
    if (limit) query = query.limit(limit);
    const { data } = await query;
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Contas Bancárias ───
mcpServer.tool({
  name: "contas_bancarias",
  description: "Lista todas as contas bancárias e seus saldos. Use quando o usuário pedir saldo, contas ou bancos.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id }: any) => {
    const supabase = getSupabase();
    const { data } = await supabase.from("contas_bancarias").select("*").eq("empresa_id", empresa_id);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Clientes ───
mcpServer.tool({
  name: "clientes",
  description: "Lista clientes com filtros de busca e status. Use quando o usuário pedir lista de clientes ou buscar um cliente.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      ativo: { type: "boolean", description: "Filtrar por status ativo" },
      search: { type: "string", description: "Busca por nome" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, ativo, search, limit }: any) => {
    const supabase = getSupabase();
    let query = supabase.from("clientes").select("*").eq("empresa_id", empresa_id).order("nome", { ascending: true });
    if (ativo !== undefined) query = query.eq("ativo", ativo);
    if (search) query = query.ilike("nome", `%${search}%`);
    if (limit) query = query.limit(limit);
    const { data } = await query;
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Fornecedores ───
mcpServer.tool({
  name: "fornecedores",
  description: "Lista fornecedores com filtros de busca e status. Use quando o usuário pedir lista de fornecedores ou buscar um fornecedor.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      ativo: { type: "boolean", description: "Filtrar por status ativo" },
      search: { type: "string", description: "Busca por nome" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, ativo, search, limit }: any) => {
    const supabase = getSupabase();
    let query = supabase.from("fornecedores").select("*").eq("empresa_id", empresa_id).order("nome", { ascending: true });
    if (ativo !== undefined) query = query.eq("ativo", ativo);
    if (search) query = query.ilike("nome", `%${search}%`);
    if (limit) query = query.limit(limit);
    const { data } = await query;
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Projetos ───
mcpServer.tool({
  name: "projetos",
  description: "Lista projetos com filtro por status. Use quando o usuário pedir lista de projetos.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      status: { type: "string", description: "Status: ativo, concluido ou cancelado" },
      limit: { type: "number", description: "Limite de resultados" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, status, limit }: any) => {
    const supabase = getSupabase();
    let query = supabase.from("projetos").select("*").eq("empresa_id", empresa_id).order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (limit) query = query.limit(limit);
    const { data } = await query;
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Categorias ───
mcpServer.tool({
  name: "categorias",
  description: "Lista todas as categorias cadastradas. Use quando o usuário pedir categorias de receitas ou despesas.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id }: any) => {
    const supabase = getSupabase();
    const { data } = await supabase.from("categorias").select("*").eq("empresa_id", empresa_id).order("nome", { ascending: true });
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Formas de Pagamento ───
mcpServer.tool({
  name: "formas_pagamento",
  description: "Lista formas de pagamento cadastradas. Use quando o usuário pedir métodos ou formas de pagamento.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id }: any) => {
    const supabase = getSupabase();
    const { data } = await supabase.from("formas_pagamento").select("*").eq("empresa_id", empresa_id);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});

// ─── Tool: Fluxo de Caixa ───
mcpServer.tool({
  name: "fluxo_caixa",
  description: "Comparativo mensal de receitas vs despesas. Use quando o usuário pedir fluxo de caixa, comparativo mensal ou evolução financeira.",
  inputSchema: {
    type: "object",
    properties: {
      empresa_id: { type: "string", description: "UUID da empresa" },
      periodo: { type: "string", description: "Período: semana, mes, trimestre, semestre ou ano" },
    },
    required: ["empresa_id"],
  },
  handler: async ({ empresa_id, periodo }: any) => {
    const supabase = getSupabase();
    const { inicio, fim } = getDateRange(periodo || "semestre");
    const { data: lancamentos } = await supabase.from("lancamentos").select("tipo, valor, data_vencimento").eq("empresa_id", empresa_id).gte("data_vencimento", inicio).lte("data_vencimento", fim);
    const meses: Record<string, { receitas: number; despesas: number }> = {};
    (lancamentos || []).forEach((l: any) => {
      const mes = l.data_vencimento?.slice(0, 7);
      if (!meses[mes]) meses[mes] = { receitas: 0, despesas: 0 };
      if (l.tipo === "receita") meses[mes].receitas += Number(l.valor);
      else meses[mes].despesas += Number(l.valor);
    });
    const result = Object.entries(meses).sort(([a], [b]) => a.localeCompare(b)).map(([mes, vals]) => ({ mes, ...vals, saldo: vals.receitas - vals.despesas }));
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
});

// ─── HTTP Transport ───
const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
