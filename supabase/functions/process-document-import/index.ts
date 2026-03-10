import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente financeiro RIGOROSO especializado em extrair dados de documentos fiscais e financeiros.
Analise o conteúdo fornecido e extraia TODOS os itens/transações encontrados.

CRITÉRIOS RIGOROSOS DE EXTRAÇÃO — siga EXATAMENTE estas regras:

══════════════════════════════════════════
PARA LANÇAMENTOS FINANCEIROS (destino_sugerido = "lancamento"):
══════════════════════════════════════════
Campos OBRIGATÓRIOS que devem ser extraídos:
- descricao (string): descrição clara do item/serviço. NUNCA genérica.
- valor (number): valor numérico POSITIVO puro (ex: 1900.00). NUNCA use formato brasileiro "R$ 1.900,00".
- tipo_sugerido: "receita" ou "despesa" — analise o contexto do documento para decidir.
- data (string|null): data no formato YYYY-MM-DD. Se não encontrada, null.

Campos OPCIONAIS que DEVEM ser extraídos se presentes no documento:
- categoria_sugerida (string|null): categoria inferida (ex: "Alimentação", "Transporte", "Software", "Marketing", "Salários")
- fornecedor_cliente (string|null): nome do fornecedor (se despesa) ou cliente (se receita)
- forma_pagamento (string|null): PIX, Cartão de Crédito, Boleto, Dinheiro, Transferência, etc.
- observacoes (string|null): informações adicionais relevantes (número de nota, CNPJ, etc.)

══════════════════════════════════════════
PARA VENDAS DIGITAIS (destino_sugerido = "venda"):
══════════════════════════════════════════
Use este destino quando o documento indicar venda de produto digital, plataforma de vendas, comissões, etc.

Campos esperados:
- descricao: nome do produto vendido
- valor (number): valor bruto da venda (número puro)
- data (string|null): data da venda YYYY-MM-DD
- fornecedor_cliente (string|null): nome do cliente comprador
- forma_pagamento (string|null): forma de pagamento detectada
- observacoes (string|null): plataforma (hotmart, kiwify, eduzz, etc.), taxa, email do cliente, documento CPF/CNPJ

══════════════════════════════════════════
REGRAS DE QUALIDADE (OBRIGATÓRIAS):
══════════════════════════════════════════
1. NÃO invente dados. Se não encontrar, retorne null.
2. valor SEMPRE número puro (500, 1900.00). NUNCA "R$ 1.900,00".
3. Cada item deve ter confiança de 0 a 100:
   - 90-100: dados explícitos no documento
   - 70-89: dados inferidos com alta certeza
   - 50-69: dados inferidos com alguma incerteza
   - 0-49: chute — NÃO inclua itens abaixo de 50
4. Se o documento contiver uma tabela, extraia CADA LINHA como um item separado.
5. Se for uma nota fiscal, extraia: número da NF, CNPJ do emitente, data de emissão nos campos de observacoes.
6. NUNCA agrupe múltiplos itens em um só. Cada produto/serviço = um item.

Retorne SEMPRE um JSON válido no formato:
{
  "itens": [...],
  "modelo_usado": "nome do modelo",
  "resumo": "breve resumo do que foi encontrado no documento"
}

Se o documento não contiver dados financeiros, retorne:
{ "itens": [], "modelo_usado": "nome do modelo", "resumo": "Nenhum dado financeiro identificado no documento" }`;

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

const MODEL_DEFAULTS: Record<string, string> = {
  openai: "gpt-4o",
  google_gemini: "gemini-2.5-flash",
  anthropic: "claude-3.5-sonnet",
  deepseek: "deepseek-chat",
};

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

    const { data: perfil } = await supabase.from("perfis").select("empresa_id").eq("id", userId).single();
    if (!perfil?.empresa_id) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const empresaId = perfil.empresa_id;

    const { data: llmConfig } = await supabase
      .from("integracoes")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .in("plataforma", ["openai", "google_gemini", "anthropic", "deepseek"]);

    const { data: empresa } = await supabase.from("empresas").select("llm_padrao").eq("id", empresaId).single();

    let activeLLM = null;
    if (empresa?.llm_padrao && llmConfig) {
      activeLLM = llmConfig.find((l: any) => l.plataforma === empresa.llm_padrao);
    }
    if (!activeLLM && llmConfig?.length) {
      activeLLM = llmConfig[0];
    }

    if (!activeLLM) {
      return new Response(JSON.stringify({ error: "Nenhuma IA configurada. Configure uma integração de Inteligência Artificial na página de Integrações." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, fileName, preferredLLM } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Conteúdo do documento não fornecido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (preferredLLM && llmConfig) {
      const preferred = llmConfig.find((l: any) => l.plataforma === preferredLLM);
      if (preferred) activeLLM = preferred;
    }

    const platform = activeLLM.plataforma;
    const apiKey = activeLLM.api_key_encrypted;
    const customModel = activeLLM.webhook_secret || "";
    const modelUsed = customModel || MODEL_DEFAULTS[platform] || "default";
    const docContent = `Arquivo: ${fileName || "documento"}\n\nConteúdo:\n${content}`;

    let result: string;
    switch (platform) {
      case "openai":
        result = await callOpenAI(apiKey, modelUsed, docContent);
        break;
      case "google_gemini":
        result = await callGemini(apiKey, modelUsed, docContent);
        break;
      case "anthropic":
        result = await callAnthropic(apiKey, modelUsed, docContent);
        break;
      case "deepseek":
        result = await callDeepSeek(apiKey, modelUsed, docContent);
        break;
      default:
        throw new Error(`Provedor LLM não suportado: ${platform}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { itens: [], resumo: "Não foi possível interpretar a resposta da IA" };
      }
    }

    // Filter out low-confidence items (below 50)
    if (parsed.itens && Array.isArray(parsed.itens)) {
      parsed.itens = parsed.itens.filter((item: any) => (item.confianca ?? 100) >= 50);
    }

    return new Response(JSON.stringify({
      success: true,
      provider: platform,
      model: modelUsed,
      resumo: parsed.resumo || null,
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
