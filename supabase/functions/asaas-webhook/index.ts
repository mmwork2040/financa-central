import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify webhook token from query param
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token ausente" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token against asaas_config
    const { data: config } = await supabase
      .from("asaas_config")
      .select("webhook_token, ativo")
      .limit(1)
      .single();

    if (!config || !config.ativo || config.webhook_token !== token) {
      return new Response(JSON.stringify({ error: "Token inválido ou integração desativada" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("[asaas-webhook] Evento recebido:", JSON.stringify(body));

    const event = body.event;
    const payment = body.payment;

    if (!event || !payment) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract customer ID from Asaas payload
    const asaasCustomerId = payment.customer;
    const externalReference = payment.externalReference; // We use this to store user email or id

    if (!asaasCustomerId && !externalReference) {
      console.log("[asaas-webhook] Sem customer ou externalReference, ignorando.");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by asaas_customer_id or by email in externalReference
    let userId: string | null = null;

    if (asaasCustomerId) {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id")
        .eq("asaas_customer_id", asaasCustomerId)
        .limit(1)
        .single();
      if (perfil) userId = perfil.id;
    }

    if (!userId && externalReference) {
      // Try to find by email
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id")
        .eq("email", externalReference)
        .limit(1)
        .single();
      if (perfil) {
        userId = perfil.id;
        // Link asaas_customer_id for future lookups
        if (asaasCustomerId) {
          await supabase
            .from("perfis")
            .update({ asaas_customer_id: asaasCustomerId })
            .eq("id", userId);
        }
      }
    }

    if (!userId) {
      console.log("[asaas-webhook] Usuário não encontrado para customer:", asaasCustomerId, "ref:", externalReference);
      return new Response(JSON.stringify({ ok: true, user_not_found: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Asaas events to subscription status
    let newStatus: string | null = null;
    
    // Payment events
    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        newStatus = "ativo";
        break;
      case "PAYMENT_OVERDUE":
        newStatus = "vencido";
        break;
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
        newStatus = "cancelled";
        break;
      // Subscription events
      case "PAYMENT_CREATED":
        // Don't change status on creation, wait for confirmation
        break;
      case "PAYMENT_UPDATED":
        // Only update if status changes meaningfully
        if (payment.status === "CONFIRMED" || payment.status === "RECEIVED") {
          newStatus = "ativo";
        } else if (payment.status === "OVERDUE") {
          newStatus = "vencido";
        }
        break;
    }

    if (newStatus) {
      const updateData: Record<string, any> = { assinatura_status: newStatus };
      
      // If activating, try to find matching plan by value
      if (newStatus === "ativo" && payment.value) {
        const { data: plano } = await supabase
          .from("planos_assinatura")
          .select("id")
          .eq("preco", payment.value)
          .eq("ativo", true)
          .limit(1)
          .single();
        
        if (plano) {
          updateData.assinatura_plano_id = plano.id;
        }
      }

      const { error: updateError } = await supabase
        .from("perfis")
        .update(updateData)
        .eq("id", userId);

      if (updateError) {
        console.error("[asaas-webhook] Erro ao atualizar perfil:", updateError);
        return new Response(JSON.stringify({ error: "Erro ao atualizar status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[asaas-webhook] Usuário ${userId} atualizado para status: ${newStatus}`);
    }

    return new Response(JSON.stringify({ ok: true, event, status: newStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[asaas-webhook] Erro:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
