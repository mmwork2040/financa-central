import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlatformMetrics {
  plataforma: string;
  totalGasto: number;
  totalReceita: number;
  totalCliques: number;
  totalImpressoes: number;
  totalConversoes: number;
  roas: number;
  campanhas: CampaignData[];
}

interface CampaignData {
  nome: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
  receita: number;
}

async function fetchMetaAdsData(apiKey: string, periodo: number): Promise<PlatformMetrics> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - periodo);
  const since = dateFrom.toISOString().split("T")[0];
  const until = new Date().toISOString().split("T")[0];

  // Step 1: Get ad accounts
  const accountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id&access_token=${apiKey}`
  );
  const accountsData = await accountsRes.json();

  if (accountsData.error) {
    throw new Error(`Meta Ads API: ${accountsData.error.message}`);
  }

  const accounts = accountsData.data || [];
  if (accounts.length === 0) {
    return {
      plataforma: "Meta Ads",
      totalGasto: 0,
      totalReceita: 0,
      totalCliques: 0,
      totalImpressoes: 0,
      totalConversoes: 0,
      roas: 0,
      campanhas: [],
    };
  }

  let totalGasto = 0;
  let totalCliques = 0;
  let totalImpressoes = 0;
  let totalConversoes = 0;
  let totalReceita = 0;
  const campanhas: CampaignData[] = [];

  for (const account of accounts) {
    // Step 2: Get campaigns with insights
    const campaignsRes = await fetch(
      `https://graph.facebook.com/v19.0/${account.id}/campaigns?fields=name,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,actions,action_values}&limit=50&access_token=${apiKey}`
    );
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      console.error(`Error fetching campaigns for ${account.id}:`, campaignsData.error.message);
      continue;
    }

    for (const campaign of campaignsData.data || []) {
      const insights = campaign.insights?.data?.[0];
      if (!insights) continue;

      const gasto = parseFloat(insights.spend || "0");
      const impressoes = parseInt(insights.impressions || "0", 10);
      const cliques = parseInt(insights.clicks || "0", 10);

      // Extract conversions (purchases, leads, etc.)
      let conversoes = 0;
      let receita = 0;

      if (insights.actions) {
        for (const action of insights.actions) {
          if (["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"].includes(action.action_type)) {
            conversoes += parseInt(action.value || "0", 10);
          }
          if (["lead", "offsite_conversion.fb_pixel_lead", "complete_registration"].includes(action.action_type)) {
            conversoes += parseInt(action.value || "0", 10);
          }
        }
      }

      if (insights.action_values) {
        for (const av of insights.action_values) {
          if (["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"].includes(av.action_type)) {
            receita += parseFloat(av.value || "0");
          }
        }
      }

      totalGasto += gasto;
      totalCliques += cliques;
      totalImpressoes += impressoes;
      totalConversoes += conversoes;
      totalReceita += receita;

      campanhas.push({
        nome: campaign.name,
        gasto,
        impressoes,
        cliques,
        conversoes,
        receita,
      });
    }
  }

  return {
    plataforma: "Meta Ads",
    totalGasto,
    totalReceita,
    totalCliques,
    totalImpressoes,
    totalConversoes,
    roas: totalGasto > 0 ? totalReceita / totalGasto : 0,
    campanhas,
  };
}

async function fetchGoogleAdsData(apiKey: string, _periodo: number): Promise<PlatformMetrics> {
  // Google Ads requires OAuth + developer token + customer ID
  // This is a placeholder that returns empty data until properly configured
  return {
    plataforma: "Google Ads",
    totalGasto: 0,
    totalReceita: 0,
    totalCliques: 0,
    totalImpressoes: 0,
    totalConversoes: 0,
    roas: 0,
    campanhas: [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { empresa_id, periodo = 30 } = await req.json();

    if (!empresa_id) {
      throw new Error("empresa_id is required");
    }

    // Fetch active integrations using service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: integracoes, error: fetchError } = await adminSupabase
      .from("integracoes")
      .select("plataforma, api_key_encrypted, api_secret_encrypted, ambiente")
      .eq("empresa_id", empresa_id)
      .eq("ativo", true)
      .in("plataforma", ["meta_ads", "google_ads"]);

    if (fetchError) throw fetchError;

    const results: PlatformMetrics[] = [];

    for (const integ of integracoes || []) {
      const apiKey = integ.api_key_encrypted || "";

      try {
        let metrics: PlatformMetrics;

        if (integ.plataforma === "meta_ads") {
          metrics = await fetchMetaAdsData(apiKey, periodo);
        } else if (integ.plataforma === "google_ads") {
          metrics = await fetchGoogleAdsData(apiKey, periodo);
        } else {
          continue;
        }

        results.push(metrics);

        // Log success
        await adminSupabase.from("logs_integracoes").insert({
          empresa_id,
          plataforma: integ.plataforma,
          evento: "sync_ads_data",
          status: "success",
          payload: {
            periodo,
            totalGasto: metrics.totalGasto,
            totalReceita: metrics.totalReceita,
            campanhas_count: metrics.campanhas.length,
          },
        });
      } catch (err: any) {
        console.error(`Error fetching ${integ.plataforma}:`, err.message);

        // Log error
        await adminSupabase.from("logs_integracoes").insert({
          empresa_id,
          plataforma: integ.plataforma,
          evento: "sync_ads_data",
          status: "error",
          payload: { error: err.message, periodo },
        });

        // Return platform with zero data and error info
        results.push({
          plataforma: integ.plataforma === "meta_ads" ? "Meta Ads" : "Google Ads",
          totalGasto: 0,
          totalReceita: 0,
          totalCliques: 0,
          totalImpressoes: 0,
          totalConversoes: 0,
          roas: 0,
          campanhas: [],
        });
      }
    }

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
