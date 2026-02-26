const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const dbUrl = Deno.env.get("SUPABASE_DB_URL") || "Not available";

  return new Response(JSON.stringify({
    connection_string: dbUrl,
    host: "db.fwybnoctkktseemhacrw.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    note: "Copie a senha da connection_string e DELETE esta função imediatamente!",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
