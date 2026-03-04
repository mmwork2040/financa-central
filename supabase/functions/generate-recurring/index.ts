import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    if (!authHeader) throw new Error("Missing authorization");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: perfil } = await supabase
      .from("perfis")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (!perfil?.empresa_id) throw new Error("No empresa found");

    const empresaId = perfil.empresa_id;
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    // Limit: 12 months from now
    const limiteDate = new Date(hoje);
    limiteDate.setMonth(limiteDate.getMonth() + 12);
    const limiteStr = limiteDate.toISOString().split("T")[0];

    // Fetch ALL recurring lancamentos for this empresa (any status)
    const { data: allRecorrentes, error: fetchError } = await supabase
      .from("lancamentos")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("recorrente", true)
      .is("total_parcelas", null)
      .order("data_vencimento", { ascending: true });

    if (fetchError) throw fetchError;

    // Group by chain key: descricao + valor + tipo + recorrencia_tipo
    const chains = new Map<string, typeof allRecorrentes>();
    for (const lanc of allRecorrentes || []) {
      const key = `${lanc.descricao}|||${lanc.valor}|||${lanc.tipo}|||${lanc.recorrencia_tipo || 'mensal'}`;
      if (!chains.has(key)) chains.set(key, []);
      chains.get(key)!.push(lanc);
    }

    let created = 0;

    for (const [, chainLancs] of chains) {
      // Sort by date ascending
      chainLancs.sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));

      // Check if any lancamento in the chain is cancelled — if the most recent is cancelled, stop
      const mostRecent = chainLancs[chainLancs.length - 1];
      if (mostRecent.status === "cancelado") continue;

      // Check recorrencia_fim
      const recFim = mostRecent.recorrencia_fim;
      if (recFim && recFim < hojeStr) continue;

      // Find the latest date in the chain
      const latestDateStr = mostRecent.data_vencimento;
      const template = mostRecent; // Use the most recent as template

      // Generate forward from the latest date
      let currentDate = new Date(latestDateStr);

      // Loop generating until 12 months ahead
      for (let i = 0; i < 365; i++) { // safety limit
        const nextDate = calcNextDate(currentDate, template.recorrencia_tipo);
        const nextDateStr = nextDate.toISOString().split("T")[0];

        // Stop if beyond 12 months
        if (nextDateStr > limiteStr) break;

        // Stop if beyond recorrencia_fim
        if (recFim && nextDateStr > recFim) break;

        // Check if this date already exists in the chain (in-memory check)
        const alreadyInChain = chainLancs.some((l: any) => l.data_vencimento === nextDateStr);
        if (alreadyInChain) {
          currentDate = nextDate;
          continue;
        }

        // Database-level check to prevent duplicates from concurrent calls
        const { data: existing } = await supabase
          .from("lancamentos")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("descricao", template.descricao)
          .eq("valor", template.valor)
          .eq("tipo", template.tipo)
          .eq("data_vencimento", nextDateStr)
          .eq("recorrente", true)
          .limit(1);

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
          })
          .select("*");

        if (!insertError && inserted) {
          created++;
          chainLancs.push(inserted[0]); // Add to chain so we don't duplicate
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
