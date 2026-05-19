import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente financeiro RIGOROSO especializado em extrair dados de documentos fiscais e financeiros (cupons, notas, recibos, extratos, planilhas).

REGRAS DE EXTRAÇÃO:
- Para CADA item/linha encontrado retorne um objeto separado.
- valor SEMPRE número puro (ex: 1900.00) — nunca string "R$ 1.900,00".
- data no formato YYYY-MM-DD ou null.
- tipo_sugerido: "receita" ou "despesa" (use contexto).
- destino_sugerido: "lancamento" (padrão) ou "venda" (apenas se for venda em plataforma digital).
- categoria_sugerida: nome genérico curto (ex: "Alimentação", "Transporte", "Software", "Marketing", "Salários", "Combustível", "Honorários", "Material de Escritório", "Serviços", "Manutenção", "Telecomunicações", "Energia", "Aluguel", "Impostos"). Sempre preencher.
- fornecedor_cliente: razão social/nome quando houver.
- forma_pagamento: PIX, Cartão de Crédito, Cartão de Débito, Boleto, Dinheiro, Transferência, etc.
- observacoes: número da nota, CNPJ/CPF detectado, plataforma de venda, e/ou detalhes relevantes.
- confianca: 0-100. Itens abaixo de 50 são descartados pelo sistema.

Retorne SEMPRE JSON válido:
{ "itens": [...], "resumo": "breve resumo" }
Se não houver dados financeiros: { "itens": [], "resumo": "Nenhum dado financeiro identificado" }`;

const MODEL_DEFAULTS: Record<string, string> = {
  openai: "gpt-4o",
  google_gemini: "gemini-2.5-flash",
  anthropic: "claude-3-5-sonnet-20241022",
  deepseek: "deepseek-chat",
  lovable_ai: "google/gemini-3-flash-preview",
};

function buildUserPrompt(fileName: string, textContent?: string) {
  return `Arquivo: ${fileName}\n\n${textContent ? `Conteúdo extraído:\n${textContent}` : "Imagem anexada — analise visualmente o documento."}`;
}

async function callOpenAI(apiKey: string, model: string, fileName: string, textContent?: string, imageBase64?: string, mimeType?: string) {
  const userContent: any[] = [{ type: "text", text: buildUserPrompt(fileName, textContent) }];
  if (imageBase64) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mimeType || "image/png"};base64,${imageBase64}` },
    });
  }
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function callGemini(apiKey: string, model: string, fileName: string, textContent?: string, imageBase64?: string, mimeType?: string) {
  const parts: any[] = [{ text: `${SYSTEM_PROMPT}\n\n---\n\n${buildUserPrompt(fileName, textContent)}` }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: mimeType || "image/png", data: imageBase64 } });
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    }),
  });
  if (!resp.ok) throw new Error(`Gemini error ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.candidates[0].content.parts[0].text;
}

async function callAnthropic(apiKey: string, model: string, fileName: string, textContent?: string, imageBase64?: string, mimeType?: string) {
  const content: any[] = [{ type: "text", text: buildUserPrompt(fileName, textContent) }];
  if (imageBase64) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mimeType || "image/png", data: imageBase64 },
    });
  }
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
  if (!resp.ok) throw new Error(`Anthropic error ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.content[0].text;
}

async function callDeepSeek(apiKey: string, model: string, fileName: string, textContent?: string) {
  // DeepSeek não suporta visão em produção; só texto.
  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(fileName, textContent) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!resp.ok) throw new Error(`DeepSeek error ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices[0].message.content;
}

async function callLovableAI(apiKey: string, model: string, fileName: string, textContent?: string, imageBase64?: string, mimeType?: string) {
  const userContent: any[] = [{ type: "text", text: buildUserPrompt(fileName, textContent) }];
  if (imageBase64) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mimeType || "image/png"};base64,${imageBase64}` },
    });
  }
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error(`Lovable AI error ${resp.status}: ${await resp.text()}`);
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    const { data: perfil } = await admin.from("perfis").select("empresa_id").eq("id", userId).single();
    if (!perfil?.empresa_id) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const empresaId = perfil.empresa_id;

    const body = await req.json();
    const { fileName, textContent, imageBase64, mimeType, preferredLLM } = body;

    if (!textContent && !imageBase64) {
      return new Response(JSON.stringify({ error: "Conteúdo do documento não fornecido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolução de credenciais: 1) Global liberada para empresa  2) Integração da própria empresa
    let provider: string | null = null;
    let apiKey: string | null = null;
    let model: string | null = null;
    let source = "empresa";

    const { data: access } = await admin
      .from("ai_global_access")
      .select("liberado")
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (access?.liberado) {
      const { data: globalCfg } = await admin
        .from("ai_global_config")
        .select("provider, model, api_key, ativo")
        .eq("ativo", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (globalCfg?.api_key) {
        provider = globalCfg.provider;
        model = globalCfg.model || MODEL_DEFAULTS[globalCfg.provider];
        apiKey = globalCfg.api_key;
        source = "global";
      }
    }

    if (!provider) {
      const { data: llms } = await admin
        .from("integracoes")
        .select("plataforma, api_key_encrypted, webhook_secret")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .in("plataforma", ["openai", "google_gemini", "anthropic", "deepseek"]);

      let chosen = (llms || [])[0];
      if (preferredLLM) {
        const pref = (llms || []).find((l: any) => l.plataforma === preferredLLM);
        if (pref) chosen = pref;
      }
      if (chosen) {
        provider = chosen.plataforma;
        apiKey = chosen.api_key_encrypted;
        model = chosen.webhook_secret || MODEL_DEFAULTS[chosen.plataforma];
      }
    }

    if (!provider || !apiKey) {
      return new Response(JSON.stringify({
        error: "Nenhuma IA disponível. Solicite ao administrador a liberação da IA global ou configure uma integração de IA em Integrações.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: string;
    switch (provider) {
      case "openai": result = await callOpenAI(apiKey, model!, fileName, textContent, imageBase64, mimeType); break;
      case "google_gemini": result = await callGemini(apiKey, model!, fileName, textContent, imageBase64, mimeType); break;
      case "anthropic": result = await callAnthropic(apiKey, model!, fileName, textContent, imageBase64, mimeType); break;
      case "deepseek": result = await callDeepSeek(apiKey, model!, fileName, textContent); break;
      case "lovable_ai": result = await callLovableAI(apiKey, model!, fileName, textContent, imageBase64, mimeType); break;
      default: throw new Error(`Provedor não suportado: ${provider}`);
    }

    let parsed: any;
    try { parsed = JSON.parse(result); }
    catch {
      const m = result.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { itens: [], resumo: "Resposta da IA inválida" };
    }

    if (parsed.itens && Array.isArray(parsed.itens)) {
      parsed.itens = parsed.itens.filter((it: any) => (it.confianca ?? 100) >= 50);
    }

    return new Response(JSON.stringify({
      success: true,
      provider,
      model,
      source,
      resumo: parsed.resumo || null,
      data: parsed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("process-document-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
