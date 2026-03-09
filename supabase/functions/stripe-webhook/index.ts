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

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    console.log("[stripe-webhook] Evento recebido");

    // Parse the event payload
    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = event.type;
    const data = event.data?.object;

    if (!eventType || !data) {
      return new Response(JSON.stringify({ error: "Evento sem type ou data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[stripe-webhook] Tipo: ${eventType}`);

    // Find user by Stripe customer ID or email from metadata
    const stripeCustomerId = data.customer;
    const customerEmail = data.customer_email || data.customer_details?.email || event.data?.object?.metadata?.email;

    let userId: string | null = null;

    if (stripeCustomerId) {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id")
        .eq("asaas_customer_id", stripeCustomerId) // Reusing field for Stripe customer ID
        .limit(1)
        .single();
      if (perfil) userId = perfil.id;
    }

    if (!userId && customerEmail) {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id")
        .eq("email", customerEmail)
        .limit(1)
        .single();
      if (perfil) {
        userId = perfil.id;
        // Link Stripe customer ID for future lookups
        if (stripeCustomerId) {
          await supabase
            .from("perfis")
            .update({ asaas_customer_id: stripeCustomerId })
            .eq("id", userId);
        }
      }
    }

    if (!userId) {
      console.log("[stripe-webhook] Usuário não encontrado para customer:", stripeCustomerId, "email:", customerEmail);
      return new Response(JSON.stringify({ ok: true, user_not_found: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Stripe events to subscription status
    let newStatus: string | null = null;
    const updateData: Record<string, any> = {};

    switch (eventType) {
      case "checkout.session.completed": {
        newStatus = "ativo";
        // Try to match plan by amount
        const amountTotal = data.amount_total ? data.amount_total / 100 : null;
        if (amountTotal) {
          const { data: plano } = await supabase
            .from("planos_assinatura")
            .select("id")
            .eq("preco", amountTotal)
            .eq("ativo", true)
            .limit(1)
            .single();
          if (plano) updateData.assinatura_plano_id = plano.id;
        }
        break;
      }

      case "invoice.paid": {
        newStatus = "ativo";
        const amountPaid = data.amount_paid ? data.amount_paid / 100 : null;
        if (amountPaid) {
          const { data: plano } = await supabase
            .from("planos_assinatura")
            .select("id")
            .eq("preco", amountPaid)
            .eq("ativo", true)
            .limit(1)
            .single();
          if (plano) updateData.assinatura_plano_id = plano.id;
        }
        break;
      }

      case "invoice.payment_failed":
        newStatus = "vencido";
        break;

      case "customer.subscription.deleted":
        newStatus = "cancelled";
        updateData.assinatura_plano_id = null;
        break;

      case "customer.subscription.updated": {
        const subStatus = data.status;
        if (subStatus === "active" || subStatus === "trialing") {
          newStatus = "ativo";
        } else if (subStatus === "past_due") {
          newStatus = "vencido";
        } else if (subStatus === "canceled" || subStatus === "unpaid") {
          newStatus = "cancelled";
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Evento não mapeado: ${eventType}`);
        return new Response(JSON.stringify({ ok: true, skipped: true, event: eventType }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (newStatus) {
      updateData.assinatura_status = newStatus;

      const { error: updateError } = await supabase
        .from("perfis")
        .update(updateData)
        .eq("id", userId);

      if (updateError) {
        console.error("[stripe-webhook] Erro ao atualizar perfil:", updateError);
        return new Response(JSON.stringify({ error: "Erro ao atualizar status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[stripe-webhook] Usuário ${userId} atualizado para status: ${newStatus}`);
    }

    return new Response(JSON.stringify({ ok: true, event: eventType, status: newStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[stripe-webhook] Erro:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
