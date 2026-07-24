import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o assistente de suporte do ContabilizaAI (sistema web de gestão financeira e contábil para PMEs).
Responda dúvidas sobre uso do sistema: lançamentos, contas bancárias, cartões, categorias, clientes, fornecedores, vendas digitais, notas fiscais, integrações, relatórios, dashboard, configurações e assinaturas.

Regras estritas:
- Seja SEMPRE curto e objetivo. Máximo 3 frases ou uma lista curta com no máximo 5 itens.
- Nunca explique conceitos além do necessário. Vá direto ao passo a passo.
- Se não souber, diga: "Não tenho essa informação. Recomendo abrir um chamado com o suporte humano."
- Não invente rotas ou funcionalidades. Use apenas menus reais: Página Inicial, Lançamentos, Contas Bancárias, Cartões de Crédito, Categorias, Clientes, Fornecedores, Vendas Digitais, Anúncios, Notas Fiscais, Projetos, Relatórios, Integrações, Configurações, Suporte, Perfil.
- Sempre em português (pt-BR).`;

type LlmConfig = {
  url: string;
  headers: (k: string) => Record<string, string>;
  body: (msgs: any[], model: string) => any;
  extract: (d: any) => string;
};

const LLM: Record<string, LlmConfig> = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    headers: (k) => ({ Authorization: `Bearer ${k}`, "Content-Type": "application/json" }),
    body: (msgs, model) => ({ model: model || "gpt-4o-mini", messages: msgs, max_tokens: 400 }),
    extract: (d) => d?.choices?.[0]?.message?.content || "",
  },
  deepseek: {
    url: "https://api.deepseek.com/chat/completions",
    headers: (k) => ({ Authorization: `Bearer ${k}`, "Content-Type": "application/json" }),
    body: (msgs, model) => ({ model: model || "deepseek-chat", messages: msgs, max_tokens: 400 }),
    extract: (d) => d?.choices?.[0]?.message?.content || "",
  },
  lovable_ai: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    headers: (k) => ({ Authorization: `Bearer ${k}`, "Content-Type": "application/json" }),
    body: (msgs, model) => ({ model: model || "google/gemini-3.6-flash", messages: msgs, max_tokens: 400 }),
    extract: (d) => d?.choices?.[0]?.message?.content || "",
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    headers: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }),
    body: (msgs, model) => ({
      model: model || "claude-3-5-haiku-20241022",
      max_tokens: 400,
      system: msgs.find((m: any) => m.role === "system")?.content || "",
      messages: msgs.filter((m: any) => m.role !== "system"),
    }),
    extract: (d) => d?.content?.[0]?.text || "",
  },
  google_gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    headers: () => ({ "Content-Type": "application/json" }),
    body: (msgs, model) => ({
      contents: msgs
        .filter((m: any) => m.role !== "system")
        .map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      systemInstruction: { parts: [{ text: msgs.find((m: any) => m.role === "system")?.content || "" }] },
      generationConfig: { maxOutputTokens: 400 },
    }),
    extract: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: cfg } = await supabase
      .from("ai_global_config")
      .select("provider, model, api_key, ativo")
      .eq("ativo", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cfg || !cfg.provider || !cfg.api_key) {
      return new Response(JSON.stringify({ error: "IA não configurada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const provider = cfg.provider as string;
    const conf = LLM[provider];
    if (!conf) {
      return new Response(JSON.stringify({ error: `Provider não suportado: ${provider}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const fullMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    let url = conf.url;
    let headers = conf.headers(cfg.api_key);
    if (provider === "google_gemini") {
      const m = cfg.model || "gemini-2.0-flash";
      url = `${conf.url}/${m}:generateContent?key=${encodeURIComponent(cfg.api_key)}`;
    }

    const llmRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(conf.body(fullMessages, cfg.model || "")),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error("LLM error:", llmRes.status, errText);
      return new Response(JSON.stringify({ error: "Falha ao consultar IA", detail: errText.slice(0, 300) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await llmRes.json();
    const reply = conf.extract(data) || "Sem resposta.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
