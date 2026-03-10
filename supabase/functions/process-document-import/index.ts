import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// LLM provider endpoints
const LLM_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  google_gemini: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
  anthropic: "https://api.anthropic.com/v1/messages",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
};

const SYSTEM_PROMPT = `Você é um assistente financeiro especializado em extrair dados de documentos fiscais e financeiros.
Analise o conteúdo fornecido e extraia TODOS os itens/transações encontrados.

Para cada item encontrado, retorne um objeto JSON com os seguintes campos:
- descricao (string): descrição do item/serviço/produto
- valor (number): valor numérico (positivo)
- data (string|null): data no formato YYYY-MM-DD se encontrada
- tipo_sugerido (string): "receita", "despesa" ou "investimento" - baseado no contexto
- destino_sugerido (string): "lancamento" ou "venda" - se parece uma venda de produto digital use "venda"
- categoria_sugerida (string|null): categoria inferida (ex: "Alimentação", "Transporte", "Software", etc.)
- fornecedor_cliente (string|null): nome do fornecedor ou cliente se identificado
- forma_pagamento (string|null): forma de pagamento se identificada (ex: "PIX", "Cartão de Crédito", "Boleto")
- observacoes (string|null): qualquer informação adicional relevante
- confianca (number): nível de confiança da extração de 0 a 100

Retorne SEMPRE um JSON válido no formato: { "itens": [...] }
Se o documento não contiver dados financeiros, retorne: { "itens": [], "mensagem": "Nenhum dado financeiro encontrado" }`;

async function callOpenAI(apiKey: string, model: string, content: string) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function callGemini(apiKey: string, model: string, content: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\nConteúdo do documento:\n${content}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    }),
  });
  if (!resp.ok) throw new Error(`Gemini error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.candidates[0].content.parts[0].text;
}

async function callAnthropic(apiKey: string, model: string, content: string) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.content[0].text;
}

async function callDeepSeek(apiKey: string, model: string, content: string) {
  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!resp.ok) throw new Error(`DeepSeek error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // Get user empresa_id
    const { data: perfil } = await supabase.from("perfis").select("empresa_id").eq("id", userId).single();
    if (!perfil?.empresa_id) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const empresaId = perfil.empresa_id;

    // Get the configured LLM (NOT lovable_ai)
    const { data: llmConfig } = await supabase
      .from("integracoes")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .in("plataforma", ["openai", "google_gemini", "anthropic", "deepseek"]);

    // Get LLM padrao from empresas
    const { data: empresa } = await supabase.from("empresas").select("llm_padrao").eq("id", empresaId).single();

    let activeLLM = null;
    if (empresa?.llm_padrao && llmConfig) {
      activeLLM = llmConfig.find((l: any) => l.plataforma === empresa.llm_padrao);
    }
    if (!activeLLM && llmConfig?.length) {
      activeLLM = llmConfig[0];
    }

    if (!activeLLM) {
      return new Response(JSON.stringify({ error: "Nenhuma LLM externa configurada. Configure uma integração de IA (OpenAI, Gemini, Anthropic ou DeepSeek) na página de Integrações." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, fileName } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Conteúdo do documento não fornecido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const platform = activeLLM.plataforma;
    const apiKey = activeLLM.api_key_encrypted;
    const model = activeLLM.webhook_secret || "";
    const docContent = `Arquivo: ${fileName || "documento"}\n\nConteúdo:\n${content}`;

    let result: string;
    switch (platform) {
      case "openai":
        result = await callOpenAI(apiKey, model || "gpt-4o", docContent);
        break;
      case "google_gemini":
        result = await callGemini(apiKey, model || "gemini-2.5-flash", docContent);
        break;
      case "anthropic":
        result = await callAnthropic(apiKey, model || "claude-3.5-sonnet", docContent);
        break;
      case "deepseek":
        result = await callDeepSeek(apiKey, model || "deepseek-chat", docContent);
        break;
      default:
        throw new Error(`Provedor LLM não suportado: ${platform}`);
    }

    // Parse the JSON result
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { itens: [], mensagem: "Não foi possível interpretar a resposta da IA" };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      provider: platform,
      model: model || "default",
      data: parsed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-document-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
