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

    const { role, maxUses, expiresInDays, permissoes, perfilAcessoId } = await req.json();

    // Validar se pelo menos uma permissão foi selecionada se for perfil personalizado
    if (!perfilAcessoId && role !== "admin") {
      if (!permissoes || !Array.isArray(permissoes) || permissoes.length === 0) {
        return new Response(JSON.stringify({ error: "Defina pelo menos uma permissão de acesso para o código." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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

    const finalEmpresaId = callerRole.empresa_id;

    // Generate a random 8-char code
    const code = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();

    const expiresAt = expiresInDays && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabaseAdmin.from("invite_codes").insert({
      empresa_id: finalEmpresaId,
      code,
      created_by: callerData.user.id,
      role: role || "leitura",
      max_uses: typeof maxUses === "number" ? maxUses : 1,
      expires_at: expiresAt,
      perfil_acesso_id: perfilAcessoId || null,
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If perfilAcessoId is set, copy permissions from the profile
    if (perfilAcessoId) {
      const { data: profilePerms } = await supabaseAdmin
        .from("perfis_acesso_permissoes")
        .select("tela, pode_incluir, pode_alterar, pode_excluir")
        .eq("perfil_acesso_id", perfilAcessoId);

      if (profilePerms && profilePerms.length > 0) {
        const permRows = profilePerms.map((p: any) => ({
          invite_code_id: data.id,
          tela: p.tela,
          pode_incluir: p.pode_incluir,
          pode_alterar: p.pode_alterar,
          pode_excluir: p.pode_excluir,
        }));

        const { error: permError } = await supabaseAdmin
          .from("invite_code_permissoes")
          .insert(permRows);

        if (permError) {
          console.error("Error saving invite permissions from profile:", permError);
        }
      }
    } else if (permissoes && Array.isArray(permissoes) && permissoes.length > 0) {
      // Manual permissions (legacy behavior)
      const permRows = permissoes.map((p: any) => ({
        invite_code_id: data.id,
        tela: p.tela,
        pode_incluir: !!p.pode_incluir,
        pode_alterar: !!p.pode_alterar,
        pode_excluir: !!p.pode_excluir,
      }));

      const { error: permError } = await supabaseAdmin
        .from("invite_code_permissoes")
        .insert(permRows);

      if (permError) {
        console.error("Error saving invite permissions:", permError);
      }
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
