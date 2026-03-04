import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// This function is intentionally a no-op.
// Digital receipts are now controlled manually by the user via the lancamentos screen.
// Previously, it auto-converted pending integration lancamentos to "recebido" when data_vencimento <= today.
// That behavior was removed per user request — only manual status changes are allowed.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: true,
      converted: 0,
      message: "Auto-conversão desativada. Recebimentos são controlados manualmente.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
