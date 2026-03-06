import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function calcNextDate(lastDate: Date, tipo: string | null): Date {
  const next = new Date(lastDate);
  switch (tipo) {
    case "semanal":
      next.setDate(next.getDate() + 7);
      break;
    case "quinzenal":
      next.setDate(next.getDate() + 15);
      break;
    case "trimestral":
      next.setMonth(next.getMonth() + 3);
      break;
    case "anual":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "mensal":
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing authorization");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const userId = user.id;

    const { data: perfil } = await supabase
      .from("perfis")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!perfil?.empresa_id) throw new Error("No empresa found");

    const empresaId = perfil.empresa_id;
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    // Limit: 12 months from now
    const limiteDate = new Date(hoje);
    limiteDate.setMonth(limiteDate.getMonth() + 12);
    const limiteStr = limiteDate.toISOString().split("T")[0];

    // Fetch ALL recurring lancamentos for this empresa
    const { data: allRecorrentes, error: fetchError } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("recorrente", true)
      .is("total_parcelas", null)
      .order("data_vencimento", { ascending: true });

    if (fetchError) throw fetchError;

    // Group by recorrencia_grupo_id first, then fallback to legacy key
    const chains = new Map<string, typeof allRecorrentes>();
    for (const lanc of allRecorrentes || []) {
      const key = lanc.recorrencia_grupo_id 
        ? `grupo:${lanc.recorrencia_grupo_id}`
        : `legacy:${lanc.descricao}|||${lanc.valor}|||${lanc.tipo}|||${lanc.recorrencia_tipo || 'mensal'}`;
      if (!chains.has(key)) chains.set(key, []);
      chains.get(key)!.push(lanc);
    }

    let created = 0;

    for (const [chainKey, chainLancs] of chains) {
      // Sort by date ascending
      chainLancs.sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));

      // Check if the most recent is cancelled — if so, stop
      const mostRecent = chainLancs[chainLancs.length - 1];
      if (mostRecent.status === "cancelado") continue;

      // Check recorrencia_fim
      const recFim = mostRecent.recorrencia_fim;
      if (recFim && recFim < hojeStr) continue;

      // Use recorrencia_grupo_id from chain or generate one for legacy
      const grupoId = mostRecent.recorrencia_grupo_id;
      const template = mostRecent;

      // If legacy chain without grupo_id, assign one to all members
      if (!grupoId && chainKey.startsWith("legacy:")) {
        const newGrupoId = crypto.randomUUID();
        const ids = chainLancs.map((l: any) => l.id);
        for (let i = 0; i < ids.length; i += 50) {
          const batch = ids.slice(i, i + 50);
          await supabase
            .from("lancamentos")
            .update({ recorrencia_grupo_id: newGrupoId } as any)
            .in("id", batch);
        }
        // Update in-memory
        for (const l of chainLancs) {
          l.recorrencia_grupo_id = newGrupoId;
        }
      }

      const effectiveGrupoId = grupoId || chainLancs[0].recorrencia_grupo_id;

      // Find the latest date in the chain
      const latestDateStr = mostRecent.data_vencimento;
      let currentDate = new Date(latestDateStr);

      // Loop generating until 12 months ahead
      for (let i = 0; i < 365; i++) {
        const nextDate = calcNextDate(currentDate, template.recorrencia_tipo);
        const nextDateStr = nextDate.toISOString().split("T")[0];

        // Stop if beyond 12 months
        if (nextDateStr > limiteStr) break;

        // Stop if beyond recorrencia_fim
        if (recFim && nextDateStr > recFim) break;

        // Check if this date already exists in the chain
        const alreadyInChain = chainLancs.some((l: any) => l.data_vencimento === nextDateStr);
        if (alreadyInChain) {
          currentDate = nextDate;
          continue;
        }

        // Database-level check to prevent duplicates
        const dupQuery: any = supabase
          .from("lancamentos")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("data_vencimento", nextDateStr)
          .eq("recorrente", true);

        if (effectiveGrupoId) {
          dupQuery.eq("recorrencia_grupo_id", effectiveGrupoId);
        } else {
          dupQuery
            .eq("descricao", template.descricao)
            .eq("valor", template.valor)
            .eq("tipo", template.tipo);
        }

        const { data: existing } = await dupQuery.limit(1);

        if (existing && existing.length > 0) {
          chainLancs.push(existing[0]);
          currentDate = nextDate;
          continue;
        }

        // Insert new occurrence
        const { data: inserted, error: insertError } = await supabase
          .from("lancamentos")
          .insert({
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
            recorrencia_fim: template.recorrencia_fim,
            recorrencia_grupo_id: effectiveGrupoId,
          })
          .select("*");

        if (!insertError && inserted) {
          created++;
          chainLancs.push(inserted[0]);
        }

        currentDate = nextDate;
      }
    }

    return new Response(
      JSON.stringify({ success: true, created, message: `${created} lançamentos recorrentes gerados.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
