import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SCREENS = [
  "users","permissions","fornecedores","clientes","categorias",
  "contas_bancarias","formas_pagamento","lancamentos","relatorios",
  "projetos","vendas_digitais","cartoes_credito"
];

async function seedDefaultProfiles(supabaseAdmin: any, empresaId: string) {
  // Sócio - full access
  const { data: socio } = await supabaseAdmin.from("perfis_acesso")
    .insert({ empresa_id: empresaId, nome: "Sócio", descricao: "Acesso total a todos os módulos", is_default: true })
    .select("id").single();
  if (socio) {
    await supabaseAdmin.from("perfis_acesso_permissoes").insert(
      DEFAULT_SCREENS.map(tela => ({ perfil_acesso_id: socio.id, tela, pode_incluir: true, pode_alterar: true, pode_excluir: true }))
    );
  }

  // Colaborador
  const { data: colab } = await supabaseAdmin.from("perfis_acesso")
    .insert({ empresa_id: empresaId, nome: "Colaborador", descricao: "Lançamentos, Clientes, Fornecedores, Categorias. Sem excluir, sem relatórios", is_default: true })
    .select("id").single();
  if (colab) {
    await supabaseAdmin.from("perfis_acesso_permissoes").insert([
      { perfil_acesso_id: colab.id, tela: "lancamentos", pode_incluir: true, pode_alterar: true, pode_excluir: false },
      { perfil_acesso_id: colab.id, tela: "clientes", pode_incluir: true, pode_alterar: true, pode_excluir: false },
      { perfil_acesso_id: colab.id, tela: "fornecedores", pode_incluir: true, pode_alterar: true, pode_excluir: false },
      { perfil_acesso_id: colab.id, tela: "categorias", pode_incluir: true, pode_alterar: true, pode_excluir: false },
    ]);
  }

  // Contador
  const { data: contador } = await supabaseAdmin.from("perfis_acesso")
    .insert({ empresa_id: empresaId, nome: "Contador", descricao: "Relatórios, Lançamentos, Categorias e Contas Bancárias em leitura. Emissão de notas fiscais.", is_default: true })
    .select("id").single();
  if (contador) {
    await supabaseAdmin.from("perfis_acesso_permissoes").insert([
      { perfil_acesso_id: contador.id, tela: "relatorios", pode_incluir: false, pode_alterar: false, pode_excluir: false },
      { perfil_acesso_id: contador.id, tela: "lancamentos", pode_incluir: false, pode_alterar: false, pode_excluir: false },
      { perfil_acesso_id: contador.id, tela: "categorias", pode_incluir: false, pode_alterar: false, pode_excluir: false },
      { perfil_acesso_id: contador.id, tela: "contas_bancarias", pode_incluir: false, pode_alterar: false, pode_excluir: false },
    ]);
  }
}

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
        .select("assinatura_status, assinatura_plano_id, trial_started_at, created_at, max_empresas_pj")
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
      let maxEmpresas = 1;

      const status = perfil?.assinatura_status || "trial";

      if (status === "ativo" && perfil?.assinatura_plano_id) {
        const { data: plano } = await supabaseAdmin
          .from("planos_assinatura")
          .select("max_empresas")
          .eq("id", perfil.assinatura_plano_id)
          .single();

        if (plano) {
          maxEmpresas = plano.max_empresas === 0 ? Infinity : (plano.max_empresas ?? 999);
        }
      } else if (status === "trial") {
        const trialStarted = perfil?.trial_started_at || perfil?.created_at;
        if (trialStarted) {
          const trialEnd = new Date(trialStarted);
          trialEnd.setDate(trialEnd.getDate() + 30);
          if (new Date() > trialEnd) {
            maxEmpresas = 0;
          }
        }
      } else {
        maxEmpresas = 0;
      }

      // Per-user cap set by super admin (max_empresas_pj on perfil)
      const perUserCap = (perfil as any)?.max_empresas_pj;
      if (typeof perUserCap === "number") {
        maxEmpresas = Math.min(maxEmpresas, perUserCap);
      }

      if (nonPersonalCount >= maxEmpresas) {
        const msg = maxEmpresas === 0
          ? "Você não tem permissão para criar empresas adicionais. Solicite ao administrador para liberar."
          : `Você atingiu o limite de ${maxEmpresas} empresa(s). Solicite ao administrador aumento do limite ou faça upgrade do plano.`;
        return new Response(JSON.stringify({ error: msg }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate CNPJ uniqueness
    if (cnpj && cnpj.trim()) {
      const normalizedCnpj = cnpj.trim().replace(/[^0-9]/g, '');
      
      if (normalizedCnpj) {
        const { data: existing } = await supabaseAdmin
          .from("empresas")
          .select("id, nome, cnpj")
          .filter("cnpj", "not.is", null)
          .limit(100); // Fetch some to check manually since complex index query is tricky with postgrest

        // Since postgrest doesn't support regexp_replace in filters easily, we can use a raw RPC or just check manually if the list is small,
        // but better to use a dedicated RPC or just trust the DB unique constraint we just created.
        // Let's use the DB constraint by attempting the insert and handling the error, 
        // OR we can use a query that matches the index logic.
        
        const { data: checkData, error: checkError } = await supabaseAdmin.rpc('check_cnpj_exists', { _cnpj: normalizedCnpj });
        
        if (!checkError && checkData) {
          return new Response(JSON.stringify({ error: `CNPJ já cadastrado por outra empresa.` }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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

    // Seed default access profiles
    try {
      await seedDefaultProfiles(supabaseAdmin, empresaId);
    } catch (seedErr) {
      console.error("Error seeding default profiles:", seedErr);
      // Non-blocking — empresa still created successfully
    }

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
