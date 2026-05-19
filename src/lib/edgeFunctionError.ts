/**
 * Extrai a mensagem real de erro retornada por uma edge function chamada via
 * `supabase.functions.invoke`. O supabase-js coloca apenas
 * "Edge Function returned a non-2xx status code" em `error.message` e guarda
 * a Response original em `error.context`. Aqui lemos o body JSON dela.
 */
export async function extractEdgeError(error: any, fallback = "Erro ao processar requisição"): Promise<string> {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === "function") {
      const body = await ctx.clone().json().catch(() => null);
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    }
    if (ctx && typeof ctx.text === "function") {
      const txt = await ctx.clone().text().catch(() => "");
      if (txt) return txt.slice(0, 300);
    }
  } catch (_) {
    // ignore
  }
  return error?.message || fallback;
}
