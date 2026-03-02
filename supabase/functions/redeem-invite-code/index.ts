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

    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Código é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const userId = callerData.user.id;

    // Find the invite code
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invite_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("active", true)
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: "Código de convite inválido ou expirado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Código de convite expirado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max uses (0 = unlimited)
    if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
      return new Response(JSON.stringify({ error: "Código de convite já atingiu o limite de usos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already belongs to this empresa
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("empresa_id", invite.empresa_id)
      .maybeSingle();

    if (existingRole) {
      return new Response(JSON.stringify({ error: "Você já faz parte desta empresa" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add user_role for the new empresa
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        empresa_id: invite.empresa_id,
        role: invite.role,
      });

    if (roleError) {
      console.error("Role insert error:", roleError);
      return new Response(JSON.stringify({ error: "Erro ao entrar na empresa" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update perfil empresa_id to the new one
    await supabaseAdmin
      .from("perfis")
      .update({ empresa_id: invite.empresa_id })
      .eq("id", userId);

    // Copy permissions from invite code to user
    const { data: invitePerms } = await supabaseAdmin
      .from("invite_code_permissoes")
      .select("tela, pode_incluir, pode_alterar, pode_excluir")
      .eq("invite_code_id", invite.id);

    if (invitePerms && invitePerms.length > 0) {
      // Remove any existing permissions for this user (fresh start)
      await supabaseAdmin
        .from("permissoes")
        .delete()
        .eq("perfis_id", userId);

      // Insert permissions from invite code
      const userPerms = invitePerms.map((p: any) => ({
        perfis_id: userId,
        tela: p.tela,
        pode_incluir: p.pode_incluir,
        pode_alterar: p.pode_alterar,
        pode_excluir: p.pode_excluir,
      }));

      const { error: permError } = await supabaseAdmin
        .from("permissoes")
        .insert(userPerms);

      if (permError) {
        console.error("Error copying permissions:", permError);
      }
    }

    // Increment uses and deactivate after use
    const newUses = invite.uses + 1;
    const shouldDeactivate = true; // Always deactivate after redemption

    // Get redeemer profile info
    const { data: redeemerProfile } = await supabaseAdmin
      .from("perfis")
      .select("nome, email")
      .eq("id", userId)
      .single();

    await supabaseAdmin
      .from("invite_codes")
      .update({
        uses: newUses,
        active: shouldDeactivate ? false : true,
        redeemed_by: userId,
        redeemed_at: new Date().toISOString(),
        redeemed_by_name: redeemerProfile?.nome || null,
        redeemed_by_email: redeemerProfile?.email || null,
      })
      .eq("id", invite.id);

    // Auto-create personal empresa if user doesn't have one
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("empresa_id")
      .eq("user_id", userId);

    const userEmpresaIds = userRoles?.map((r: any) => r.empresa_id) || [];

    if (userEmpresaIds.length > 0) {
      const { data: existingPersonal } = await supabaseAdmin
        .from("empresas")
        .select("id")
        .eq("pessoal", true)
        .in("id", userEmpresaIds)
        .maybeSingle();

      if (!existingPersonal) {
        // Create personal empresa
        const redeemerName = redeemerProfile?.nome || redeemerProfile?.email || "Usuário";
        const { data: personalEmpresa } = await supabaseAdmin
          .from("empresas")
          .insert({
            nome: `Pessoal - ${redeemerName}`,
            email: redeemerProfile?.email || null,
            pessoal: true,
          })
          .select("id")
          .single();

        if (personalEmpresa) {
          await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, empresa_id: personalEmpresa.id, role: "admin" });
        }
      }
    }

    // Get empresa name
    const { data: empresa } = await supabaseAdmin
      .from("empresas")
      .select("nome")
      .eq("id", invite.empresa_id)
      .single();

    return new Response(JSON.stringify({
      success: true,
      empresaNome: empresa?.nome || "Empresa",
      empresaId: invite.empresa_id,
    }), {
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
