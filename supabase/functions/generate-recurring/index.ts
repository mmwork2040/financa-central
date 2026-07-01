import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function calcNextDate(lastDate: Date, tipo: string | null): Date {
  const next = new Date(lastDate);
  switch (tipo) {
    case "semanal":    next.setDate(next.getDate() + 7); break;
    case "quinzenal":  next.setDate(next.getDate() + 15); break;
    case "trimestral": next.setMonth(next.getMonth() + 3); break;
    case "anual":      next.setFullYear(next.getFullYear() + 1); break;
    case "mensal":
    default:           next.setMonth(next.getMonth() + 1); break;
  }
  return next;
}

const ymd = (d: Date) => d.toISOString().split("T")[0];

async function processEmpresa(supabase: any, empresaId: string): Promise<number> {
  const hoje = new Date();
  const hojeStr = ymd(hoje);
  const limiteDate = new Date(hoje);
  limiteDate.setMonth(limiteDate.getMonth() + 12);
  const limiteStr = ymd(limiteDate);

  let created = 0;

  // ============ RECORRENTES (série aberta) ============
  const { data: recorrentes } = await supabase
    .from("lancamentos").select("*")
    .eq("empresa_id", empresaId).eq("recorrente", true).is("total_parcelas", null)
    .order("data_vencimento", { ascending: true });

  const chains = new Map<string, any[]>();
  for (const l of recorrentes || []) {
    const key = l.recorrencia_grupo_id
      ? `g:${l.recorrencia_grupo_id}`
      : `l:${l.descricao}|${l.valor}|${l.tipo}|${l.recorrencia_tipo || 'mensal'}`;
    if (!chains.has(key)) chains.set(key, []);
    chains.get(key)!.push(l);
  }

  for (const [chainKey, chainLancs] of chains) {
    chainLancs.sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));
    const oldest = chainLancs[0];
    const mostRecent = chainLancs[chainLancs.length - 1];
    const recFim = chainLancs.reduce((acc: string | null, l: any) =>
      l.recorrencia_fim && (!acc || l.recorrencia_fim > acc) ? l.recorrencia_fim : acc, null);
    if (recFim && recFim < hojeStr) continue;

    let grupoId = mostRecent.recorrencia_grupo_id || oldest.recorrencia_grupo_id;
    if (!grupoId && chainKey.startsWith("l:")) {
      grupoId = crypto.randomUUID();
      await supabase.from("lancamentos").update({ recorrencia_grupo_id: grupoId })
        .in("id", chainLancs.map((l: any) => l.id));
    }

    const template = oldest;
    const existingDates = new Set(chainLancs.map((l: any) => l.data_vencimento));
    let currentDate = new Date(template.data_vencimento);

    for (let i = 0; i < 400; i++) {
      const nextDate = calcNextDate(currentDate, template.recorrencia_tipo);
      const nextDateStr = ymd(nextDate);
      currentDate = nextDate;
      if (nextDateStr > limiteStr) break;
      if (recFim && nextDateStr > recFim) break;
      if (existingDates.has(nextDateStr)) continue;

      const { error: insErr } = await supabase.from("lancamentos").insert({
        empresa_id: empresaId,
        descricao: template.descricao,
        valor: template.valor,
        tipo: template.tipo,
        status: "pendente",
        data_vencimento: nextDateStr,
        categoria_id: template.categoria_id,
        fornecedor_id: template.fornecedor_id,
        cliente_id: template.cliente_id,
        conta_bancaria_id: template.conta_bancaria_id,
        forma_pagamento_id: template.forma_pagamento_id,
        projeto_id: template.projeto_id,
        recorrente: true,
        recorrencia_tipo: template.recorrencia_tipo,
        recorrencia_fim: recFim,
        recorrencia_grupo_id: grupoId,
      });
      if (!insErr) { created++; existingDates.add(nextDateStr); }
    }
  }

  // ============ PARCELADAS (série fechada) ============
  const { data: parceladas } = await supabase
    .from("lancamentos").select("*")
    .eq("empresa_id", empresaId).eq("recorrente", false).gt("total_parcelas", 1)
    .order("data_vencimento", { ascending: true });

  const groups = new Map<string, any[]>();
  for (const l of parceladas || []) {
    const key = l.recorrencia_grupo_id
      ? `g:${l.recorrencia_grupo_id}`
      : `l:${l.descricao}|${l.valor}|${l.total_parcelas}|${l.created_at?.slice(0, 10)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(l);
  }

  for (const [_key, items] of groups) {
    items.sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));
    const first = items[0];
    const total = Number(first.total_parcelas);
    if (!total || total < 2) continue;
    if (items.length >= total) continue;

    let grupoId = items[0].recorrencia_grupo_id;
    if (!grupoId) {
      grupoId = crypto.randomUUID();
      await supabase.from("lancamentos").update({ recorrencia_grupo_id: grupoId })
        .in("id", items.map((l: any) => l.id));
    }

    // Se veio só o primeiro sem parcela_atual, assume que o valor é o TOTAL e divide
    if (!first.parcela_atual && items.length === 1) {
      const valorParcela = Math.round((first.valor / total) * 100) / 100;
      const baseDesc = first.descricao?.replace(/\s*\(\d+\/\d+\)$/, "") || first.descricao;
      await supabase.from("lancamentos").update({
        parcela_atual: 1,
        valor: valorParcela,
        descricao: `${baseDesc} (1/${total})`,
      }).eq("id", first.id);
      first.valor = valorParcela;
      first.parcela_atual = 1;
      first.descricao = `${baseDesc} (1/${total})`;
    }

    const existingDates = new Set(items.map((l: any) => l.data_vencimento));
    const baseDate = new Date(first.data_vencimento);
    const baseDesc = first.descricao.replace(/\s*\(\d+\/\d+\)$/, "");

    for (let i = items.length; i < total; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setMonth(nextDate.getMonth() + i);
      const nextStr = ymd(nextDate);
      if (existingDates.has(nextStr)) continue;

      const { error: insErr } = await supabase.from("lancamentos").insert({
        empresa_id: empresaId,
        descricao: `${baseDesc} (${i + 1}/${total})`,
        valor: first.valor,
        tipo: first.tipo,
        status: "pendente",
        data_vencimento: nextStr,
        categoria_id: first.categoria_id,
        fornecedor_id: first.fornecedor_id,
        cliente_id: first.cliente_id,
        conta_bancaria_id: first.conta_bancaria_id,
        forma_pagamento_id: first.forma_pagamento_id,
        projeto_id: first.projeto_id,
        recorrente: false,
        total_parcelas: total,
        parcela_atual: i + 1,
        recorrencia_grupo_id: grupoId,
      });
      if (!insErr) { created++; existingDates.add(nextStr); }
    }
  }

  return created;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Body pode conter empresa_id (usado por cron/backfill) ou all=true (todas as empresas)
    let body: any = {};
    try { if (req.method === "POST") body = await req.json().catch(() => ({})); } catch {}

    let empresaIds: string[] = [];

    if (body?.empresa_id) {
      empresaIds = [body.empresa_id];
    } else if (body?.all === true) {
      const { data: empresas } = await supabase.from("empresas").select("id");
      empresaIds = (empresas || []).map((e: any) => e.id);
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ success: true, created: 0, message: "No auth" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ success: true, created: 0, message: "Session expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const userId = claimsData.claims.sub as string;
      const { data: perfil } = await supabase.from("perfis").select("empresa_id").eq("id", userId).single();
      if (!perfil?.empresa_id) {
        return new Response(JSON.stringify({ success: true, created: 0, message: "Sem empresa" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      empresaIds = [perfil.empresa_id];
    }

    let totalCreated = 0;
    for (const empresaId of empresaIds) {
      try { totalCreated += await processEmpresa(supabase, empresaId); }
      catch (e) { console.error("processEmpresa error", empresaId, e); }
    }

    return new Response(
      JSON.stringify({ success: true, created: totalCreated, message: `${totalCreated} lançamentos gerados.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
