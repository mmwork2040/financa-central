import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { role, maxUses, expiresInDays, empresaId: targetEmpresaId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: callerData } = await callerClient.auth.getUser();
    if (!callerData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is super_admin
    const { data: superAdminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    const isSuperAdmin = !!superAdminCheck;

    // Get caller's empresa and verify admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("empresa_id, role")
      .eq("user_id", callerData.user.id)
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .single();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerar códigos de convite" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Super admin can target any empresa; regular admin only their own
    const finalEmpresaId = isSuperAdmin && targetEmpresaId ? targetEmpresaId : callerRole.empresa_id;

    // Generate a random 8-char code
    const code = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabaseAdmin.from("invite_codes").insert({
      empresa_id: finalEmpresaId,
      code,
      created_by: callerData.user.id,
      role: role || "leitura",
      max_uses: maxUses || 1,
      expires_at: expiresAt,
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, invite: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
