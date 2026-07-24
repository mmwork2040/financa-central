import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: role } = await supabase
      .from("user_roles")
      .select("empresa_id, created_at")
      .eq("role", "super_admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let url: string | null = null;
    let mensagem: string | null = null;
    if (role?.empresa_id) {
      const { data: emp } = await supabase
        .from("empresas")
        .select("chat_lancamentos_url, chat_lancamentos_mensagem")
        .eq("id", role.empresa_id)
        .maybeSingle();
      url = (emp as any)?.chat_lancamentos_url || null;
      mensagem = (emp as any)?.chat_lancamentos_mensagem || null;
    }
    return new Response(JSON.stringify({ url, mensagem }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ url: null, mensagem: null, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
