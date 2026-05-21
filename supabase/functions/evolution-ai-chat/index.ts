import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// LLM provider configs
const LLM_CONFIGS: Record<string, { url: string; buildHeaders: (key: string) => Record<string, string>; buildBody: (messages: any[], maxTokens: number) => any; extractResponse: (data: any) => string }> = {
  lovable_ai: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    buildHeaders: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
    buildBody: (messages, maxTokens) => ({ model: "google/gemini-3-flash-preview", messages, max_tokens: maxTokens }),
    extractResponse: (data) => data?.choices?.[0]?.message?.content || "",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    buildHeaders: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
    buildBody: (messages, maxTokens) => ({ model: "gpt-4o-mini", messages, max_tokens: maxTokens }),
    extractResponse: (data) => data?.choices?.[0]?.message?.content || "",
  },
  google_gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    buildHeaders: (_key) => ({ "Content-Type": "application/json" }),
    buildBody: (messages, maxTokens) => ({
      contents: messages.filter((m: any) => m.role !== "system").map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      systemInstruction: { parts: [{ text: messages.find((m: any) => m.role === "system")?.content || "" }] },
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    extractResponse: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    buildHeaders: (key) => ({ "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }),
    buildBody: (messages, maxTokens) => ({
      model: "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      system: messages.find((m: any) => m.role === "system")?.content || "",
      messages: messages.filter((m: any) => m.role !== "system"),
    }),
    extractResponse: (data) => data?.content?.[0]?.text || "",
  },
  deepseek: {
    url: "https://api.deepseek.com/chat/completions",
    buildHeaders: (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" }),
    buildBody: (messages, maxTokens) => ({ model: "deepseek-chat", messages, max_tokens: maxTokens }),
    extractResponse: (data) => data?.choices?.[0]?.message?.content || "",
  },
};

const NO_AI_MSG = "Não há IA configurada no sistema. Entre em contato com o administrador.";

// ─── Helper: detect update intent and extract details ───
function detectUpdateIntent(text: string): { isUpdate: boolean; searchTerm: string; newDescription: string } {
  const lower = text.toLowerCase();
  // Patterns like "alterar descrição de X para Y", "renomear X para Y", "mudar X para Y"
  const patterns = [
    /(?:alterar|mudar|renomear|trocar|atualizar)\s+(?:a\s+)?(?:descri[çc][aã]o\s+)?(?:de\s+|do\s+|da\s+)?["']?(.+?)["']?\s+para\s+["']?(.+?)["']?$/i,
    /(?:alterar|mudar|renomear|trocar|atualizar)\s+["']?(.+?)["']?\s+para\s+["']?(.+?)["']?$/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) {
      return { isUpdate: true, searchTerm: match[1].trim(), newDescription: match[2].trim() };
    }
  }
  return { isUpdate: false, searchTerm: "", newDescription: "" };
}

// ─── Helper: extract search keywords from message ───
function extractSearchKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  // Remove common stop words
  const stopWords = ["o", "a", "os", "as", "de", "do", "da", "dos", "das", "em", "no", "na", "um", "uma",
    "para", "por", "com", "que", "me", "meu", "minha", "qual", "quais", "como", "onde",
    "tem", "tenho", "ter", "foi", "ser", "está", "são", "esse", "essa", "esse", "isso",
    "alterar", "mudar", "buscar", "encontrar", "mostrar", "ver", "listar"];
  const words = lower.replace(/[^\w\sà-ú]/g, "").split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
  return words;
}

const buildSystemPrompt = (userName: string, userContext: string, canUpdate: boolean) => `Você é um assistente financeiro conciso do sistema FinançaCentral.
Você está atendendo EXCLUSIVAMENTE o usuário "${userName}".
REGRAS OBRIGATÓRIAS:
- A conversa é INDIVIDUAL e INTRANSFERÍVEL. NUNCA compartilhe dados de outros usuários.
- Use SOMENTE os dados fornecidos no contexto abaixo para responder. NÃO invente dados.
- Responda SOMENTE sobre assuntos do sistema financeiro (lançamentos, categorias, contas, clientes, fornecedores, relatórios).
- Limite TODAS as respostas a no máximo 300 caracteres, exceto relatórios financeiros (máximo 800 caracteres).
- Se o assunto não for relacionado ao sistema, responda: "Só posso ajudar com assuntos do sistema financeiro."
- Seja direto e objetivo. Sem saudações longas.
- Responda em português brasileiro.
${canUpdate ? `
CAPACIDADES DE EDIÇÃO:
- Você PODE alterar descrições de lançamentos quando solicitado.
- Quando o usuário pedir para alterar/renomear um lançamento, responda com o formato EXATO:
  [AÇÃO:ATUALIZAR_DESCRICAO|ID:uuid-do-lancamento|NOVA_DESCRICAO:nova descrição aqui]
  seguido de uma confirmação amigável.
- Se encontrar MÚLTIPLOS lançamentos correspondentes (recorrentes), liste-os e pergunte se deseja alterar todos ou apenas um específico.
- Se o usuário confirmar "todos" ou "sim", use múltiplas linhas de ação, uma para cada ID.
` : ""}

DADOS DO USUÁRIO (contexto financeiro atual):
${userContext}`;

const IDENTIFY_MSG = "Não consegui identificar seu cadastro. Por favor, informe seu email de cadastro no sistema para que eu possa atendê-lo.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // empresa_id from query parameter (URL per company)
    const reqUrl = new URL(req.url);
    const empresaId = reqUrl.searchParams.get("empresa_id") || "";

    const body = await req.json();
    
    // Evolution API sends messages in this format
    const remoteJid = body?.data?.key?.remoteJid || body?.sender || "";
    const messageText = body?.data?.message?.conversation || 
                        body?.data?.message?.extendedTextMessage?.text || 
                        body?.message?.conversation ||
                        body?.text || "";

    if (!messageText.trim()) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract phone number from remoteJid (format: 5511999999999@s.whatsapp.net)
    const phoneNumber = remoteJid.replace(/@.*/, "").replace(/\D/g, "");

    if (!empresaId) {
      return new Response(JSON.stringify({ error: "empresa_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Step 1: Identify user by phone number ───
    let userId: string | null = null;
    let userName: string | null = null;

    if (phoneNumber) {
      // Search phone with different formats
      const phoneVariants = [phoneNumber, `+${phoneNumber}`, phoneNumber.replace(/^55/, "")];
      for (const variant of phoneVariants) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("id, nome, empresa_id")
          .eq("empresa_id", empresaId)
          .ilike("evolution_webhook_url", `%${variant}%`)
          .maybeSingle();
        
        if (!perfil) {
          continue;
        }
        userId = perfil.id;
        userName = perfil.nome;
        break;
      }
    }

    // ─── Step 2: If not identified by phone, check if message is an email ───
    if (!userId) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedMsg = messageText.trim().toLowerCase();
      
      if (emailRegex.test(trimmedMsg)) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("id, nome, empresa_id")
          .eq("empresa_id", empresaId)
          .ilike("email", trimmedMsg)
          .maybeSingle();

        if (perfil) {
          userId = perfil.id;
          userName = perfil.nome;

          if (phoneNumber) {
            await supabase
              .from("perfis")
              .update({ evolution_webhook_url: phoneNumber })
              .eq("id", perfil.id);
          }

          const reply = `Identificado! Olá, ${perfil.nome}. Como posso ajudar?`;
          return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const reply = "Email não encontrado no sistema. Verifique e tente novamente.";
          return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ reply: IDENTIFY_MSG }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Step 3: Get configured LLM ───
    // Prioridade 1: IA Global liberada para a empresa
    let llmProvider: string | null = null;
    let apiKey: string | null = null;
    let globalModel: string | null = null;
    let usingGlobal = false;
    let tokenLimit = 0;
    let tokensUsed = 0;

    const { data: globalAccess } = await supabase
      .from("ai_global_access")
      .select("liberado")
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (globalAccess?.liberado) {
      const { data: globalCfg } = await supabase
        .from("ai_global_config")
        .select("provider, model, api_key, ativo")
        .eq("ativo", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalCfg?.api_key) {
        const { data: limitData } = await supabase.rpc("get_ai_token_limit", { _empresa_id: empresaId });
        const { data: usedData } = await supabase.rpc("get_ai_tokens_used_month", { _empresa_id: empresaId });
        tokenLimit = Number(limitData || 0);
        tokensUsed = Number(usedData || 0);

        if (tokenLimit > 0 && tokensUsed >= tokenLimit) {
          return new Response(JSON.stringify({
            reply: `🚫 Limite mensal de tokens de IA atingido (${tokensUsed.toLocaleString("pt-BR")}/${tokenLimit.toLocaleString("pt-BR")}). Fale com o Super Admin para liberar mais.`,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        llmProvider = globalCfg.provider;
        apiKey = globalCfg.api_key;
        globalModel = globalCfg.model;
        usingGlobal = true;
      }
    }

    // Prioridade 2: LLM padrão da empresa via integracoes
    if (!llmProvider) {
      const { data: empresa } = await supabase
        .from("empresas")
        .select("llm_padrao")
        .eq("id", empresaId)
        .single();

      const llmPadrao = empresa?.llm_padrao || null;
      if (llmPadrao && llmPadrao !== "lovable_ai") {
        const { data: integ } = await supabase
          .from("integracoes")
          .select("api_key_encrypted, ativo")
          .eq("empresa_id", empresaId)
          .eq("plataforma", llmPadrao)
          .eq("ativo", true)
          .maybeSingle();

        if (integ?.api_key_encrypted) {
          llmProvider = llmPadrao;
          apiKey = integ.api_key_encrypted;
        }
      }
    }

    if (!llmProvider || !apiKey) {
      return new Response(JSON.stringify({
        reply: "🔒 IA não liberada para esta empresa. Solicite a liberação ao Super Admin em IA Global ou configure uma chave própria em Integrações.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Step 4: Load conversation history ───
    let { data: conversa } = await supabase
      .from("conversas_chat")
      .select("id")
      .eq("user_id", userId)
      .eq("empresa_id", empresaId)
      .eq("status", "ativa")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversa) {
      const { data: newConversa } = await supabase
        .from("conversas_chat")
        .insert({ user_id: userId, empresa_id: empresaId })
        .select("id")
        .single();
      conversa = newConversa;
    }

    if (!conversa) {
      return new Response(JSON.stringify({ reply: "Erro interno ao criar conversa." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message
    await supabase.from("mensagens_chat").insert({
      conversa_id: conversa.id,
      remetente: "usuario",
      conteudo: messageText.trim(),
    });

    // Load recent messages for context
    const { data: recentMsgs } = await supabase
      .from("mensagens_chat")
      .select("remetente, conteudo")
      .eq("conversa_id", conversa.id)
      .order("created_at", { ascending: true })
      .limit(10);

    // ─── Fetch user-specific financial data for context ───
    const now = new Date();
    const mesAtual = now.toISOString().slice(0, 7);
    const inicioMes = `${mesAtual}-01`;
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    // Current month lancamentos
    const { data: lancamentos } = await supabase
      .from("lancamentos")
      .select("id, tipo, valor, status, descricao, data_vencimento, recorrente, recorrencia_grupo_id")
      .eq("empresa_id", empresaId)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes)
      .order("data_vencimento", { ascending: false })
      .limit(30);

    // ─── Search lancamentos by keywords from user message ───
    const keywords = extractSearchKeywords(messageText);
    let searchedLancamentos: any[] = [];
    
    if (keywords.length > 0) {
      // Search by description across ALL periods (not just current month)
      const searchTerms = keywords.slice(0, 3); // max 3 keywords
      let query = supabase
        .from("lancamentos")
        .select("id, tipo, valor, status, descricao, data_vencimento, recorrente, recorrencia_grupo_id")
        .eq("empresa_id", empresaId);
      
      // Use ilike for each keyword (AND)
      for (const term of searchTerms) {
        query = query.ilike("descricao", `%${term}%`);
      }
      
      const { data: searched } = await query
        .order("data_vencimento", { ascending: false })
        .limit(20);
      
      if (searched && searched.length > 0) {
        searchedLancamentos = searched;
      }
    }

    // Get contas bancárias
    const { data: contas } = await supabase
      .from("contas_bancarias")
      .select("nome, saldo_atual")
      .eq("empresa_id", empresaId)
      .limit(5);

    // Build user context summary
    const receitas = (lancamentos || []).filter((l: any) => l.tipo === "receita");
    const despesas = (lancamentos || []).filter((l: any) => l.tipo === "despesa");
    const totalReceitas = receitas.reduce((s: number, l: any) => s + Number(l.valor), 0);
    const totalDespesas = despesas.reduce((s: number, l: any) => s + Number(l.valor), 0);
    const saldoContas = (contas || []).map((c: any) => `${c.nome}: R$${Number(c.saldo_atual).toFixed(2)}`).join("; ");
    const pendentes = (lancamentos || []).filter((l: any) => l.status === "pendente").length;

    // Build searched results context
    let searchContext = "";
    if (searchedLancamentos.length > 0) {
      const searchResults = searchedLancamentos.map((l: any) => 
        `- ID:${l.id} | "${l.descricao}" | ${l.tipo} | R$${Number(l.valor).toFixed(2)} | ${l.status} | Venc:${l.data_vencimento} | Recorrente:${l.recorrente ? "Sim" : "Não"}${l.recorrencia_grupo_id ? ` | Grupo:${l.recorrencia_grupo_id}` : ""}`
      ).join("\n");
      searchContext = `\n\nLANÇAMENTOS ENCONTRADOS POR BUSCA:\n${searchResults}`;
    }

    // Also list current month lancamentos with IDs
    const lancamentosContext = (lancamentos || []).map((l: any) =>
      `- ID:${l.id} | "${l.descricao}" | ${l.tipo} | R$${Number(l.valor).toFixed(2)} | ${l.status} | Venc:${l.data_vencimento} | Recorrente:${l.recorrente ? "Sim" : "Não"}`
    ).join("\n");

    const userContext = [
      `Mês: ${mesAtual}`,
      `Receitas: R$${totalReceitas.toFixed(2)} (${receitas.length} lançamentos)`,
      `Despesas: R$${totalDespesas.toFixed(2)} (${despesas.length} lançamentos)`,
      `Saldo: R$${(totalReceitas - totalDespesas).toFixed(2)}`,
      `Pendentes: ${pendentes}`,
      saldoContas ? `Contas: ${saldoContas}` : "",
    ].filter(Boolean).join(" | ");

    const fullContext = userContext + 
      (lancamentosContext ? `\n\nLANÇAMENTOS DO MÊS:\n${lancamentosContext}` : "") +
      searchContext;

    const messages: any[] = [
      { role: "system", content: buildSystemPrompt(userName || "Usuário", fullContext, true) },
      ...(recentMsgs || []).map((m: any) => ({
        role: m.remetente === "usuario" ? "user" : "assistant",
        content: m.conteudo,
      })),
    ];

    // ─── Step 5: Call LLM ───
    const config = LLM_CONFIGS[llmProvider];
    if (!config) {
      return new Response(JSON.stringify({ reply: NO_AI_MSG }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url = config.url;
    if (llmProvider === "google_gemini") {
      url = `${config.url}?key=${apiKey}`;
    }

    const maxTokens = 300;

    const llmResponse = await fetch(url, {
      method: "POST",
      headers: config.buildHeaders(apiKey),
      body: JSON.stringify(config.buildBody(messages, maxTokens)),
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      console.error(`LLM error (${llmProvider}):`, llmResponse.status, errText);

      if (llmResponse.status === 429 || llmResponse.status === 402) {
        return new Response(JSON.stringify({ reply: "Sistema temporariamente indisponível. Tente novamente em alguns minutos." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ reply: NO_AI_MSG }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmData = await llmResponse.json();
    let reply = config.extractResponse(llmData) || "Desculpe, não consegui processar sua mensagem.";

    // ─── Step 6: Process action commands from LLM response ───
    const actionRegex = /\[AÇÃO:ATUALIZAR_DESCRICAO\|ID:([a-f0-9-]+)\|NOVA_DESCRICAO:(.+?)\]/gi;
    let match;
    const updates: { id: string; newDesc: string }[] = [];
    
    while ((match = actionRegex.exec(reply)) !== null) {
      updates.push({ id: match[1], newDesc: match[2] });
    }

    if (updates.length > 0) {
      let successCount = 0;
      let failCount = 0;

      for (const upd of updates) {
        const { error } = await supabase
          .from("lancamentos")
          .update({ descricao: upd.newDesc })
          .eq("id", upd.id)
          .eq("empresa_id", empresaId);
        
        if (error) {
          console.error(`Failed to update lancamento ${upd.id}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      // Clean action tags from reply
      reply = reply.replace(/\[AÇÃO:ATUALIZAR_DESCRICAO\|ID:[a-f0-9-]+\|NOVA_DESCRICAO:.+?\]/gi, "").trim();
      
      if (!reply) {
        if (successCount > 0 && failCount === 0) {
          reply = `✅ ${successCount} lançamento(s) atualizado(s) com sucesso!`;
        } else if (failCount > 0) {
          reply = `⚠️ ${successCount} atualizado(s), ${failCount} com erro. Verifique os dados.`;
        }
      }
    }

    // Enforce character limits
    if (reply.length > 800) {
      reply = reply.substring(0, 797) + "...";
    }

    // Save AI response
    await supabase.from("mensagens_chat").insert({
      conversa_id: conversa.id,
      remetente: "sistema",
      conteudo: reply,
    });

    // Update conversation timestamp
    await supabase
      .from("conversas_chat")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversa.id);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("evolution-ai-chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message, reply: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
