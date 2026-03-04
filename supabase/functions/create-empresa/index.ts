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

    const { nomeEmpresa, cnpj, email, telefone, endereco } = await req.json();
    if (!nomeEmpresa) {
      return new Response(JSON.stringify({ error: "Nome da empresa é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Check if user is super_admin (bypass limits)
    const { data: isSA } = await supabaseAdmin.rpc("is_super_admin", { _user_id: userId });

    if (!isSA) {
      // Get user profile to check subscription
      const { data: perfil } = await supabaseAdmin
        .from("perfis")
        .select("assinatura_status, assinatura_plano_id, trial_started_at, created_at")
        .eq("id", userId)
        .single();

      // Count non-personal empresas the user owns (admin role)
      const { data: userRoles } = await supabaseAdmin
        .from("user_roles")
        .select("empresa_id")
        .eq("user_id", userId)
        .eq("role", "admin");

      const empresaIds = userRoles?.map((r: any) => r.empresa_id) || [];
      let nonPersonalCount = 0;

      if (empresaIds.length > 0) {
        const { count } = await supabaseAdmin
          .from("empresas")
          .select("id", { count: "exact", head: true })
          .eq("pessoal", false)
          .in("id", empresaIds);
        nonPersonalCount = count || 0;
      }

      // Determine max_empresas
      let maxEmpresas = 1; // default for non-subscribers

      const status = perfil?.assinatura_status || "trial";

      if (status === "ativo" && perfil?.assinatura_plano_id) {
        // Get plan limit
        const { data: plano } = await supabaseAdmin
          .from("planos_assinatura")
          .select("max_empresas")
          .eq("id", perfil.assinatura_plano_id)
          .single();

        if (plano) {
          maxEmpresas = plano.max_empresas === 0 ? Infinity : (plano.max_empresas ?? 999);
        }
      } else if (status === "trial") {
        // Check if trial is still active
        const trialStarted = perfil?.trial_started_at || perfil?.created_at;
        if (trialStarted) {
          const trialEnd = new Date(trialStarted);
          trialEnd.setDate(trialEnd.getDate() + 30);
          if (new Date() > trialEnd) {
            maxEmpresas = 0; // trial expired
          }
        }
      } else {
        maxEmpresas = 0; // expired/cancelled
      }

      if (nonPersonalCount >= maxEmpresas) {
        const msg = maxEmpresas === 0
          ? "Sua assinatura expirou. Assine um plano para criar empresas."
          : `Você atingiu o limite de ${maxEmpresas} empresa(s) do seu plano. Faça upgrade para criar mais.`;
        return new Response(JSON.stringify({ error: msg }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate CNPJ uniqueness
    if (cnpj && cnpj.trim()) {
      const { data: existing } = await supabaseAdmin
        .from("empresas")
        .select("id, nome")
        .ilike("cnpj", cnpj.trim())
        .limit(1)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: `CNPJ já cadastrado por outra empresa: "${existing.nome}"` }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create empresa
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .insert({
        nome: nomeEmpresa,
        cnpj: cnpj || null,
        email: email || null,
        telefone: telefone || null,
        endereco: endereco || null,
      })
      .select("id")
      .single();

    if (empresaError) {
      console.error("Empresa error:", empresaError);
      return new Response(JSON.stringify({ error: "Erro ao criar empresa" }), {
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
      return new Response(JSON.stringify({ error: "Erro ao atribuir permissão" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update perfil
    await supabaseAdmin
      .from("perfis")
      .update({ empresa_id: empresaId, permissao: "admin" })
      .eq("id", userId);

    return new Response(JSON.stringify({ success: true, empresaId, empresaNome: nomeEmpresa }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
