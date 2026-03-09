import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "enviar") {
      const { mensagem, tipo } = body;
      if (!mensagem || typeof mensagem !== "string" || mensagem.trim().length === 0 || mensagem.trim().length > 1000) {
        return new Response(JSON.stringify({ error: "Mensagem inválida (1-1000 caracteres)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get user profile
      const { data: perfil } = await supabase.from("perfis").select("nome, email, empresa_id").eq("id", user.id).single();
      if (!perfil?.empresa_id) {
        return new Response(JSON.stringify({ error: "Usuário sem empresa" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Insert suggestion
      const { data: sugestao, error: insertError } = await supabase.from("sugestoes_integracao").insert({
        user_id: user.id,
        empresa_id: perfil.empresa_id,
        user_nome: perfil.nome || perfil.email,
        user_email: perfil.email,
        mensagem: mensagem.trim(),
        tipo: tipo || "sugestao",
      }).select("id").single();

      if (insertError) throw insertError;

      // Notify all super admins
      const { data: superAdmins } = await supabase.from("user_roles").select("user_id, empresa_id").eq("role", "super_admin");

      if (superAdmins && superAdmins.length > 0) {
        const notifications = superAdmins.map((sa: any) => ({
          user_id: sa.user_id,
          empresa_id: sa.empresa_id,
          titulo: `💡 Nova sugestão de integração`,
          mensagem: `${perfil.nome || perfil.email}: ${mensagem.trim().slice(0, 100)}${mensagem.trim().length > 100 ? "..." : ""}`,
          tipo: "sugestao_integracao",
          referencia_id: sugestao.id,
        }));
        await supabase.from("notificacoes").insert(notifications);
      }

      return new Response(JSON.stringify({ success: true, id: sugestao.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "responder") {
      // Only super admins can respond
      const { data: isSA } = await supabase.rpc("is_super_admin", { _user_id: user.id });
      if (!isSA) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { sugestao_id, resposta } = body;
      if (!sugestao_id || !resposta || typeof resposta !== "string" || resposta.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get the suggestion
      const { data: sugestao, error: fetchError } = await supabase.from("sugestoes_integracao").select("*").eq("id", sugestao_id).single();
      if (fetchError || !sugestao) {
        return new Response(JSON.stringify({ error: "Sugestão não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Update suggestion
      const { error: updateError } = await supabase.from("sugestoes_integracao").update({
        resposta: resposta.trim(),
        status: "respondida",
        respondido_por: user.id,
        respondido_em: new Date().toISOString(),
      }).eq("id", sugestao_id);

      if (updateError) throw updateError;

      // Notify the user who sent the suggestion
      await supabase.from("notificacoes").insert({
        user_id: sugestao.user_id,
        empresa_id: sugestao.empresa_id,
        titulo: "✉️ Resposta à sua sugestão",
        mensagem: `Sua sugestão foi respondida: ${resposta.trim().slice(0, 150)}${resposta.trim().length > 150 ? "..." : ""}`,
        tipo: "sugestao_respondida",
        referencia_id: sugestao_id,
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "listar") {
      // Only super admins can list all
      const { data: isSA } = await supabase.rpc("is_super_admin", { _user_id: user.id });
      if (!isSA) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: sugestoes, error: listError } = await supabase
        .from("sugestoes_integracao")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (listError) throw listError;

      return new Response(JSON.stringify({ sugestoes: sugestoes || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
