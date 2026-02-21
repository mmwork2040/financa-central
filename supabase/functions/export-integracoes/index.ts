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

    // Fetch source integrations
    const { data: sourceIntegracoes, error: fetchError } = await supabase
      .from("integracoes")
      .select("*")
      .eq("empresa_id", sourceEmpresaId);

    if (fetchError) throw fetchError;
    if (!sourceIntegracoes || sourceIntegracoes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma integração encontrada na empresa de origem" }),
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

    return new Response(
      JSON.stringify({ success: true, count: newIntegracoes.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
