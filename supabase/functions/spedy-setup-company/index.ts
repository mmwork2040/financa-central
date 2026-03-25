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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { empresa_id, cert_password } = await req.json();
    if (!empresa_id) {
      return new Response(JSON.stringify({ error: "empresa_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user belongs to empresa
    const { data: belongs } = await supabase.rpc("user_belongs_to_empresa", {
      _user_id: user.id, _empresa_id: empresa_id,
    });
    if (!belongs) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get empresa data
    const { data: empresa, error: empError } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresa_id)
      .single();

    if (empError || !empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Spedy config
    const { data: spedyConfig } = await supabase
      .from("spedy_config")
      .select("*")
      .eq("ativo", true)
      .limit(1)
      .single();

    if (!spedyConfig?.api_key) {
      return new Response(JSON.stringify({ error: "Integração Spedy não configurada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cnpj = (empresa.cnpj || "").replace(/\D/g, "");
    if (cnpj.length < 14) {
      return new Response(JSON.stringify({ error: "CNPJ inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map tax regime
    const taxRegimeMap: Record<string, string> = {
      simplesNacional: "simplesNacional",
      simplesNacionalMEI: "simplesNacionalMEI",
      regimeNormal: "regimeNormal",
      simplesNacionalExcessoSublimite: "simplesNacionalExcessoSublimite",
    };

    // Build address
    const addressPayload: any = {};
    if (empresa.rua) addressPayload.street = empresa.rua;
    if (empresa.bairro) addressPayload.district = empresa.bairro;
    if (empresa.cep) addressPayload.postalCode = empresa.cep.replace(/\D/g, "");
    if (empresa.numero) addressPayload.number = empresa.numero;
    if (empresa.complemento) addressPayload.additionalInformation = empresa.complemento;
    if (empresa.cidade && empresa.estado) {
      addressPayload.city = { name: empresa.cidade, state: empresa.estado.toUpperCase() };
    }

    const companyPayload = {
      name: empresa.nome,
      legalName: empresa.razao_social || empresa.nome,
      federalTaxNumber: cnpj,
      stateTaxNumber: empresa.inscricao_estadual || undefined,
      cityTaxNumber: empresa.inscricao_municipal || undefined,
      email: empresa.email || undefined,
      phone: empresa.telefone ? empresa.telefone.replace(/\D/g, "") : undefined,
      address: addressPayload,
      taxRegime: taxRegimeMap[empresa.regime_tributario] || "simplesNacional",
    };

    let spedyCompanyId = empresa.spedy_company_id;

    if (spedyCompanyId) {
      // Update existing company
      const res = await fetch(`${spedyConfig.api_url}/companies/${spedyCompanyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Api-Key": spedyConfig.api_key },
        body: JSON.stringify(companyPayload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Spedy update company error:", err);
        return new Response(JSON.stringify({ error: "Erro ao atualizar empresa na Spedy", details: err }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Create new company
      const res = await fetch(`${spedyConfig.api_url}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": spedyConfig.api_key },
        body: JSON.stringify(companyPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        // If CNPJ already exists in Spedy, try to find and link it
        const isDuplicate = Array.isArray(data?.errors) &&
          data.errors.some((e: any) => typeof e.message === "string" && e.message.includes("CNPJ já possui"));
        if (isDuplicate) {
          console.log("CNPJ already exists in Spedy, searching for existing company...");
          // Try listing companies and filtering by CNPJ
          const searchRes = await fetch(`${spedyConfig.api_url}/companies`, {
            method: "GET",
            headers: { "Content-Type": "application/json", "X-Api-Key": spedyConfig.api_key },
          });
          const searchData = await searchRes.json();
          console.log("Spedy companies search response status:", searchRes.status, "type:", typeof searchData, "isArray:", Array.isArray(searchData));
          
          // Try to find matching company in various response formats
          let found: any = null;
          const items = Array.isArray(searchData) ? searchData 
            : Array.isArray(searchData?.data) ? searchData.data 
            : Array.isArray(searchData?.companies) ? searchData.companies 
            : [];
          
          found = items.find((c: any) => {
            const fedTax = (c.federalTaxNumber || c.cnpj || "").replace(/\D/g, "");
            return fedTax === cnpj;
          });

          if (found?.id) {
            spedyCompanyId = found.id;
            console.log("Found existing Spedy company:", spedyCompanyId);
          } else {
            console.error("Could not find existing Spedy company. Items count:", items.length, "CNPJ:", cnpj);
            // If we can't find it, just skip Spedy setup but don't block the flow
            return new Response(JSON.stringify({ 
              success: true, 
              warning: "CNPJ já cadastrado na Spedy. Vincule manualmente pelo painel de configurações." 
            }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          console.error("Spedy create company error:", data);
          return new Response(JSON.stringify({ error: "Erro ao criar empresa na Spedy", details: data }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        spedyCompanyId = data.id;
      }
      // Save spedy_company_id
      await supabase.from("empresas").update({ spedy_company_id: spedyCompanyId }).eq("id", empresa_id);
    }

    // Upload certificate if exists
    if (empresa.certificado_digital_url && cert_password) {
      try {
        const certPath = empresa.certificado_digital_url;
        const { data: certFile, error: dlError } = await supabase.storage
          .from("certificados")
          .download(certPath);

        if (dlError || !certFile) {
          console.error("Certificate download error:", dlError);
        } else {
          // Upload to Spedy as multipart/form-data
          const formData = new FormData();
          formData.append("certificateFile", certFile, "certificado.pfx");
          formData.append("password", cert_password);

          const certRes = await fetch(
            `${spedyConfig.api_url}/companies/${spedyCompanyId}/certificates`,
            {
              method: "POST",
              headers: { "X-Api-Key": spedyConfig.api_key },
              body: formData,
            }
          );

          if (!certRes.ok) {
            const certErr = await certRes.json().catch(() => ({}));
            console.error("Spedy certificate upload error:", certErr);
            return new Response(JSON.stringify({
              success: true,
              spedy_company_id: spedyCompanyId,
              certificate_error: "Erro ao enviar certificado para a Spedy. Verifique a senha.",
            }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (certError) {
        console.error("Certificate processing error:", certError);
      }
    }

    return new Response(JSON.stringify({ success: true, spedy_company_id: spedyCompanyId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("spedy-setup-company error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
