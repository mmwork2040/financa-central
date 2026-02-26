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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // Simple secret token validation
    const expectedToken = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(-12);
    if (!token || token !== expectedToken) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dbUrl = Deno.env.get("SUPABASE_DB_URL") || "Not available";

    return new Response(JSON.stringify({
      connection_string: dbUrl,
      host: "db.fwybnoctkktseemhacrw.supabase.co",
      port: 5432,
      database: "postgres",
      user: "postgres",
      note: "Use os dados acima para configurar o Postgres Chat Memory no n8n. DELETE esta função após copiar os dados!",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
