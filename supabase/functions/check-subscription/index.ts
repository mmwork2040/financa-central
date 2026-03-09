import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({ subscribed: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    // Save customer ID to perfis for webhook lookups
    await supabaseClient
      .from("perfis")
      .update({ asaas_customer_id: customerId })
      .eq("id", user.id);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for trialing
      const trialSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });

      if (trialSubs.data.length === 0) {
        logStep("No active subscription");
        return new Response(
          JSON.stringify({ subscribed: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const sub = trialSubs.data[0];
      const endDate = new Date(sub.current_period_end * 1000).toISOString();

      // Update perfis status
      await supabaseClient
        .from("perfis")
        .update({ assinatura_status: "ativo" })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({
          subscribed: true,
          subscription_end: endDate,
          status: "trialing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const subscription = subscriptions.data[0];
    const subscriptionEnd = new Date(
      subscription.current_period_end * 1000
    ).toISOString();
    logStep("Active subscription found", {
      subscriptionId: subscription.id,
      endDate: subscriptionEnd,
    });

    // Try to match plan by amount
    const priceAmount =
      subscription.items.data[0]?.price?.unit_amount;
    if (priceAmount) {
      const realPrice = priceAmount / 100;
      const { data: plano } = await supabaseClient
        .from("planos_assinatura")
        .select("id")
        .eq("preco", realPrice)
        .eq("ativo", true)
        .limit(1)
        .single();

      if (plano) {
        await supabaseClient
          .from("perfis")
          .update({
            assinatura_status: "ativo",
            assinatura_plano_id: plano.id,
          })
          .eq("id", user.id);
      } else {
        await supabaseClient
          .from("perfis")
          .update({ assinatura_status: "ativo" })
          .eq("id", user.id);
      }
    }

    return new Response(
      JSON.stringify({
        subscribed: true,
        subscription_end: subscriptionEnd,
        status: "active",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
