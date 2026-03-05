import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── AUTHENTICATION ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(JSON.stringify({ error: "userId deve ser um UUID válido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cannot delete yourself
    if (callerId === userId) {
      return new Response(JSON.stringify({ error: "Você não pode excluir sua própria conta por aqui." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard: cannot delete super_admin
    const { data: isSuperTarget } = await supabaseAdmin.rpc("is_super_admin", { _user_id: userId });
    if (isSuperTarget) {
      return new Response(JSON.stringify({ error: "Não é possível excluir um Super Admin." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin or super_admin
    const { data: callerIsSuper } = await supabaseAdmin.rpc("is_super_admin", { _user_id: callerId });
    if (!callerIsSuper) {
      // Check if caller is admin of the same empresa
      const { data: callerEmpresa } = await supabaseAdmin
        .from("perfis")
        .select("empresa_id")
        .eq("id", callerId)
        .single();

      if (!callerEmpresa?.empresa_id) {
        return new Response(JSON.stringify({ error: "Sem permissão" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: callerRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .eq("empresa_id", callerEmpresa.empresa_id)
        .maybeSingle();

      if (callerRole?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Apenas administradores podem excluir usuários." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Delete user_roles first
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Delete permissoes
    await supabaseAdmin
      .from("permissoes")
      .delete()
      .eq("perfis_id", userId);

    // Delete profile
    await supabaseAdmin
      .from("perfis")
      .delete()
      .eq("id", userId);

    // Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return new Response(JSON.stringify({ error: "Erro ao excluir conta de autenticação: " + authDeleteError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ [delete-auth-user] Usuário ${userId} excluído completamente por ${callerId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
