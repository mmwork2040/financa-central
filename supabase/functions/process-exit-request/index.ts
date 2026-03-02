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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Helper: deactivate invite codes for user in a specific empresa
    async function revokeInviteCodes(admin: any, userId: string, empresaId: string) {
      await admin
        .from("invite_codes")
        .update({ active: false })
        .eq("redeemed_by", userId)
        .eq("empresa_id", empresaId);
    }

    // Helper: log exit request action to logs_integracoes
    async function logExitAction(admin: any, empresaId: string, userId: string, resultado: string, detalhes: string) {
      await admin.from("logs_integracoes").insert({
        empresa_id: empresaId,
        plataforma: "sistema",
        evento: "saida_empresa",
        status: resultado,
        payload: { user_id: userId, detalhes },
      });
    }

    // Helper: find or create personal empresa for a user
    async function findOrCreatePersonalEmpresa(admin: any, userId: string): Promise<string> {
      const { data: userRoles } = await admin.from("user_roles").select("empresa_id").eq("user_id", userId);
      const empresaIds = userRoles?.map((r: any) => r.empresa_id) || [];

      if (empresaIds.length > 0) {
        const { data: existing } = await admin
          .from("empresas")
          .select("id")
          .eq("pessoal", true)
          .in("id", empresaIds)
          .maybeSingle();
        if (existing) return existing.id;
      }

      const { data: perfil } = await admin.from("perfis").select("nome, email").eq("id", userId).single();
      const userName = perfil?.nome || perfil?.email || "Usuário";
      const userEmail = perfil?.email || "";

      const { data: empresa } = await admin
        .from("empresas")
        .insert({ nome: `Pessoal - ${userName}`, email: userEmail, pessoal: true })
        .select("id")
        .single();

      const newId = empresa!.id;
      await admin.from("user_roles").insert({ user_id: userId, empresa_id: newId, role: "admin" });
      return newId;
    }

    // Helper: switch user to their personal empresa
    async function switchToPersonalEmpresa(admin: any, userId: string) {
      const personalId = await findOrCreatePersonalEmpresa(admin, userId);
      await admin
        .from("perfis")
        .update({ empresa_id: personalId })
        .eq("id", userId);
    }

    const { action, requestId, motivo, empresaId } = await req.json();

    // ─── CHECK-EXPIRED ───────────────────────────────────────────
    // User_role already removed at create time. Just finalize: revoke codes, mark approved, log.
    if (action === "check-expired") {
      const { data: expired } = await supabaseAdmin
        .from("solicitacoes_saida")
        .select("*")
        .eq("status", "pendente")
        .lt("expira_em", new Date().toISOString());

      if (expired && expired.length > 0) {
        for (const request of expired) {
          await revokeInviteCodes(supabaseAdmin, request.user_id, request.empresa_id);

          await supabaseAdmin
            .from("solicitacoes_saida")
            .update({
              status: "aprovado",
              auto_aprovado: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.id);

          await logExitAction(supabaseAdmin, request.empresa_id, request.user_id, "success", "Saída auto-aprovada por expiração do prazo de 7 dias");
        }
      }

      return new Response(JSON.stringify({ success: true, processed: expired?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── AUTH ─────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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
    const userId = claimsData.claims.sub;

    // ─── CREATE ──────────────────────────────────────────────────
    // Immediately disconnect user from empresa and switch to personal
    if (action === "create") {
      if (!empresaId) throw new Error("empresaId é obrigatório");

      const { data: empresa } = await supabaseAdmin
        .from("empresas")
        .select("pessoal")
        .eq("id", empresaId)
        .single();

      if (empresa?.pessoal) {
        throw new Error("Não é possível sair da sua conta pessoal.");
      }

      const { data: existing } = await supabaseAdmin
        .from("solicitacoes_saida")
        .select("id")
        .eq("user_id", userId)
        .eq("empresa_id", empresaId)
        .eq("status", "pendente")
        .maybeSingle();

      if (existing) {
        throw new Error("Você já possui uma solicitação pendente para esta empresa.");
      }

      // Get user's current role in this empresa before removing
      const { data: currentRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      const roleOriginal = currentRole?.role || "leitura";

      // Remove user_role immediately (disconnect from empresa)
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("empresa_id", empresaId);

      // Switch user to personal empresa
      await switchToPersonalEmpresa(supabaseAdmin, userId);

      // Create the exit request with saved original role
      const { data, error } = await supabaseAdmin
        .from("solicitacoes_saida")
        .insert({
          user_id: userId,
          empresa_id: empresaId,
          motivo: motivo || null,
          status: "pendente",
          role_original: roleOriginal,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, request: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CANCEL ──────────────────────────────────────────────────
    // Restore user_role and re-enable access to the empresa
    if (action === "cancel") {
      if (!requestId) throw new Error("requestId é obrigatório");

      // Get the request details before updating
      const { data: request, error: fetchErr } = await supabaseAdmin
        .from("solicitacoes_saida")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pendente")
        .single();

      if (fetchErr || !request) throw new Error("Solicitação não encontrada ou já processada.");

      // Check permissions: own request or admin
      const { data: isAdminUser } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      const { data: isSuperAdminUser } = await supabaseAdmin.rpc("is_super_admin", {
        _user_id: userId,
      });
      const isAdmin = isAdminUser || isSuperAdminUser;

      if (!isAdmin && request.user_id !== userId) {
        throw new Error("Sem permissão para cancelar esta solicitação.");
      }

      // Restore user_role with the original role
      const roleToRestore = request.role_original || "leitura";
      await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: request.user_id,
          empresa_id: request.empresa_id,
          role: roleToRestore,
        });

      // Mark as cancelled
      await supabaseAdmin
        .from("solicitacoes_saida")
        .update({ status: "cancelado", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      await logExitAction(supabaseAdmin, request.empresa_id, request.user_id, "success", "Solicitação de saída cancelada — acesso restaurado");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── APPROVE ─────────────────────────────────────────────────
    // User already disconnected at create time. Just revoke codes, log, finalize.
    if (action === "approve") {
      if (!requestId) throw new Error("requestId é obrigatório");

      const { data: request, error: fetchErr } = await supabaseAdmin
        .from("solicitacoes_saida")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pendente")
        .single();

      if (fetchErr || !request) throw new Error("Solicitação não encontrada ou já processada.");

      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      const { data: isSuperAdmin } = await supabaseAdmin.rpc("is_super_admin", {
        _user_id: userId,
      });

      if (!isAdmin && !isSuperAdmin) {
        throw new Error("Sem permissão para aprovar solicitações.");
      }

      // Revoke invite codes
      await revokeInviteCodes(supabaseAdmin, request.user_id, request.empresa_id);

      // Mark as approved
      await supabaseAdmin
        .from("solicitacoes_saida")
        .update({
          status: "aprovado",
          respondido_por: userId,
          respondido_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      await logExitAction(supabaseAdmin, request.empresa_id, request.user_id, "success", "Saída aprovada pelo administrador");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REJECT ──────────────────────────────────────────────────
    // Restore user_role and re-enable access (same as cancel but initiated by admin)
    if (action === "reject") {
      if (!requestId) throw new Error("requestId é obrigatório");

      const { data: request, error: fetchErr } = await supabaseAdmin
        .from("solicitacoes_saida")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pendente")
        .single();

      if (fetchErr || !request) throw new Error("Solicitação não encontrada ou já processada.");

      // Restore user_role with the original role
      const roleToRestore = request.role_original || "leitura";
      await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: request.user_id,
          empresa_id: request.empresa_id,
          role: roleToRestore,
        });

      // Mark as rejected
      await supabaseAdmin
        .from("solicitacoes_saida")
        .update({
          status: "rejeitado",
          respondido_por: userId,
          respondido_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      await logExitAction(supabaseAdmin, request.empresa_id, request.user_id, "success", "Solicitação de saída rejeitada — acesso restaurado");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
