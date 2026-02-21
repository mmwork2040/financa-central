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

    // Helper: create personal empresa for a user who has no remaining companies
    async function createPersonalEmpresa(admin: any, userId: string): Promise<string> {
      // Check if user already has a personal empresa
      const { data: userRoles } = await admin.from("user_roles").select("empresa_id").eq("user_id", userId);
      const empresaIds = userRoles?.map((r: any) => r.empresa_id) || [];
      
      if (empresaIds.length > 0) {
        const { data: existing } = await admin
          .from("empresas")
          .select("id")
          .eq("pessoal", true)
          .in("id", empresaIds)
          .maybeSingle();
        if (existing) {
          return existing.id;
        }
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

    const { action, requestId, motivo, empresaId } = await req.json();

    // check-expired doesn't require auth
    if (action === "check-expired") {
      const { data: expired } = await supabaseAdmin
        .from("solicitacoes_saida")
        .select("*")
        .eq("status", "pendente")
        .lt("expira_em", new Date().toISOString());

      if (expired && expired.length > 0) {
        for (const request of expired) {
          await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", request.user_id)
            .eq("empresa_id", request.empresa_id);

          const { data: remaining } = await supabaseAdmin
            .from("user_roles")
            .select("empresa_id")
            .eq("user_id", request.user_id);

      if (remaining && remaining.length > 0) {
            await supabaseAdmin
              .from("perfis")
              .update({ empresa_id: remaining[0].empresa_id })
              .eq("id", request.user_id);
          } else {
            // Create personal empresa for user with no remaining companies
            const newEmpresaId = await createPersonalEmpresa(supabaseAdmin, request.user_id);
            await supabaseAdmin
              .from("perfis")
              .update({ empresa_id: newEmpresaId, permissao: "admin" })
              .eq("id", request.user_id);
          }

          await supabaseAdmin
            .from("solicitacoes_saida")
            .update({
              status: "aprovado",
              auto_aprovado: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.id);
        }
      }

      return new Response(JSON.stringify({ success: true, processed: expired?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require auth
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

    // ACTION: create - user requests to leave
    if (action === "create") {
      if (!empresaId) throw new Error("empresaId é obrigatório");

      // Check if trying to leave a personal empresa (not allowed)
      const { data: empresa } = await supabaseAdmin
        .from("empresas")
        .select("pessoal")
        .eq("id", empresaId)
        .single();

      if (empresa?.pessoal) {
        throw new Error("Não é possível sair da sua conta pessoal.");
      }

      // Check for existing pending request
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

      const { data, error } = await supabaseAdmin
        .from("solicitacoes_saida")
        .insert({
          user_id: userId,
          empresa_id: empresaId,
          motivo: motivo || null,
          status: "pendente",
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, request: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: cancel - user cancels their own request OR admin cancels any pending request
    if (action === "cancel") {
      if (!requestId) throw new Error("requestId é obrigatório");

      // Check if user is admin
      const { data: isAdminUser } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      const { data: isSuperAdminUser } = await supabaseAdmin.rpc("is_super_admin", {
        _user_id: userId,
      });

      const isAdmin = isAdminUser || isSuperAdminUser;

      let query = supabaseAdmin
        .from("solicitacoes_saida")
        .update({ status: "cancelado", updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("status", "pendente");

      // Non-admins can only cancel their own requests
      if (!isAdmin) {
        query = query.eq("user_id", userId);
      }

      const { error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: approve - admin approves
    if (action === "approve") {
      if (!requestId) throw new Error("requestId é obrigatório");

      // Get the request
      const { data: request, error: fetchErr } = await supabaseAdmin
        .from("solicitacoes_saida")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pendente")
        .single();

      if (fetchErr || !request) throw new Error("Solicitação não encontrada ou já processada.");

      // Verify admin has permission
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

      // Remove user_role for this empresa
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", request.user_id)
        .eq("empresa_id", request.empresa_id);

      // Check remaining roles
      const { data: remaining } = await supabaseAdmin
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", request.user_id);

      if (remaining && remaining.length > 0) {
        // Switch to first remaining empresa
        await supabaseAdmin
          .from("perfis")
          .update({ empresa_id: remaining[0].empresa_id })
          .eq("id", request.user_id);
      } else {
        // Create personal empresa for user with no remaining companies
        const newEmpresaId = await createPersonalEmpresa(supabaseAdmin, request.user_id);
        await supabaseAdmin
          .from("perfis")
          .update({ empresa_id: newEmpresaId, permissao: "admin" })
          .eq("id", request.user_id);
      }

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

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: reject - admin rejects
    if (action === "reject") {
      if (!requestId) throw new Error("requestId é obrigatório");

      await supabaseAdmin
        .from("solicitacoes_saida")
        .update({
          status: "rejeitado",
          respondido_por: userId,
          respondido_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "pendente");

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
