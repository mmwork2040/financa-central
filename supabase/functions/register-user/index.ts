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
    const { email, password, nome, phone } = await req.json();

    if (!email || !password || !nome || !phone) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios (nome, email, senha e telefone)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phoneClean = phone.replace(/\D/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      return new Response(
        JSON.stringify({ error: "Número de telefone inválido. Informe com DDD." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check phone uniqueness (skip orphaned perfis whose auth user was deleted)
    const { data: existingPhone } = await supabaseAdmin
      .from("perfis")
      .select("id")
      .eq("evolution_webhook_url", phoneClean)
      .maybeSingle();

    if (existingPhone) {
      // Verify the auth user still exists; if not, clear the orphaned phone
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existingPhone.id);
      if (!authUser?.user) {
        // Orphaned record – clear the phone so it can be reused
        await supabaseAdmin
          .from("perfis")
          .update({ evolution_webhook_url: null })
          .eq("id", existingPhone.id);
      } else {
        return new Response(
          JSON.stringify({ error: "Este número de telefone já está cadastrado." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create auth user (no empresa)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError) {
      const msg = authError.message?.includes("already")
        ? "Este email já está registrado."
        : authError.message;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (authData.user) {
      const userId = authData.user.id;

      // Small delay to ensure trigger has created the perfis record
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save phone to perfis
      await supabaseAdmin
        .from("perfis")
        .update({ evolution_webhook_url: phoneClean })
        .eq("id", userId);

      // Auto-create personal empresa
      const { data: empresa, error: empresaError } = await supabaseAdmin
        .from("empresas")
        .insert({
          nome: `Pessoal - ${nome}`,
          email: email,
          pessoal: true,
        })
        .select("id")
        .single();

      if (!empresaError && empresa) {
        // Create admin role for personal empresa
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, empresa_id: empresa.id, role: "admin" });

        // NOTE: Do NOT set empresa_id on perfis here so onboarding still shows
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Conta criada com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
