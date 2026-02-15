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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = callerData.user.id;
    const userEmail = callerData.user.email || "";

    // Check if user already has a personal empresa
    const { data: existing } = await supabaseAdmin
      .from("empresas")
      .select("id")
      .eq("pessoal", true)
      .in("id", 
        (await supabaseAdmin.from("user_roles").select("empresa_id").eq("user_id", userId))
          .data?.map((r: any) => r.empresa_id) || []
      )
      .maybeSingle();

    if (existing) {
      // Already has personal empresa, just activate it
      await supabaseAdmin.from("perfis").update({ empresa_id: existing.id, permissao: "admin" }).eq("id", userId);
      return new Response(JSON.stringify({ success: true, empresaId: existing.id, empresaNome: "Pessoal" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user name from perfis
    const { data: perfil } = await supabaseAdmin.from("perfis").select("nome").eq("id", userId).single();
    const userName = perfil?.nome || userEmail;

    // Create personal empresa
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .insert({
        nome: `Pessoal - ${userName}`,
        email: userEmail,
        pessoal: true,
      })
      .select("id")
      .single();

    if (empresaError) {
      console.error("Empresa error:", empresaError);
      return new Response(JSON.stringify({ error: "Erro ao criar conta pessoal" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const empresaId = empresa.id;

    // Create admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, empresa_id: empresaId, role: "admin" });

    if (roleError) {
      console.error("Role error:", roleError);
      await supabaseAdmin.from("empresas").delete().eq("id", empresaId);
      return new Response(JSON.stringify({ error: "Erro ao configurar permissões" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update perfil
    await supabaseAdmin
      .from("perfis")
      .update({ empresa_id: empresaId, permissao: "admin" })
      .eq("id", userId);

    return new Response(JSON.stringify({ success: true, empresaId, empresaNome: `Pessoal - ${userName}` }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
