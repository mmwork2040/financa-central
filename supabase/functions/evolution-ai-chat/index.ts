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

const buildSystemPrompt = (userName: string, userContext: string) => `Você é um assistente financeiro conciso do sistema FinançaCentral.
Você está atendendo EXCLUSIVAMENTE o usuário "${userName}".
REGRAS OBRIGATÓRIAS:
- A conversa é INDIVIDUAL e INTRANSFERÍVEL. NUNCA compartilhe dados de outros usuários.
- Use SOMENTE os dados fornecidos no contexto abaixo para responder. NÃO invente dados.
- Responda SOMENTE sobre assuntos do sistema financeiro (lançamentos, categorias, contas, clientes, fornecedores, relatórios).
- Limite TODAS as respostas a no máximo 150 caracteres, exceto relatórios financeiros (máximo 500 caracteres).
- Se o assunto não for relacionado ao sistema, responda: "Só posso ajudar com assuntos do sistema financeiro."
- Seja direto e objetivo. Sem saudações longas.
- Responda em português brasileiro.

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

    const body = await req.json();
    
    // Evolution API sends messages in this format
    const remoteJid = body?.data?.key?.remoteJid || body?.sender || "";
    const messageText = body?.data?.message?.conversation || 
                        body?.data?.message?.extendedTextMessage?.text || 
                        body?.message?.conversation ||
                        body?.text || "";
    const instanceName = body?.instance || body?.data?.instance || "";
    const empresaId = body?.empresa_id || "";

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
          // Try searching by a telefone-like pattern in nome or email isn't ideal,
          // let's also check clientes table for phone
          // But for user identification, we need perfis
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
        // User is providing their email for identification
        const { data: perfil } = await supabase
          .from("perfis")
          .select("id, nome, empresa_id")
          .eq("empresa_id", empresaId)
          .ilike("email", trimmedMsg)
          .maybeSingle();

        if (perfil) {
          userId = perfil.id;
          userName = perfil.nome;

          // Save phone association for future identification
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

      // Not identified and not providing email → ask for email
      return new Response(JSON.stringify({ reply: IDENTIFY_MSG }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Step 3: Get configured LLM ───
    const { data: empresa } = await supabase
      .from("empresas")
      .select("llm_padrao")
      .eq("id", empresaId)
      .single();

    const llmPadrao = empresa?.llm_padrao || null;

    let llmProvider: string | null = null;
    let apiKey: string | null = null;

    if (llmPadrao) {
      if (llmPadrao === "lovable_ai") {
        llmProvider = "lovable_ai";
        apiKey = Deno.env.get("LOVABLE_API_KEY") || null;
      } else {
        // Fetch credentials for the configured LLM
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

    // Fallback to Lovable AI if no LLM configured
    if (!llmProvider) {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableKey) {
        llmProvider = "lovable_ai";
        apiKey = lovableKey;
      }
    }

    // No LLM available at all
    if (!llmProvider || !apiKey) {
      return new Response(JSON.stringify({ reply: NO_AI_MSG }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Step 4: Load conversation history (last 10 messages) ───
    // Find or create conversation
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

    // Load recent messages for context (limit to save tokens)
    const { data: recentMsgs } = await supabase
      .from("mensagens_chat")
      .select("remetente, conteudo")
      .eq("conversa_id", conversa.id)
      .order("created_at", { ascending: true })
      .limit(10);

    // ─── Fetch user-specific financial data for context ───
    const now = new Date();
    const mesAtual = now.toISOString().slice(0, 7); // YYYY-MM
    const inicioMes = `${mesAtual}-01`;
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    // Get user's lancamentos (scoped to empresa)
    const { data: lancamentos } = await supabase
      .from("lancamentos")
      .select("tipo, valor, status, descricao, data_vencimento")
      .eq("empresa_id", empresaId)
      .gte("data_vencimento", inicioMes)
      .lte("data_vencimento", fimMes)
      .order("data_vencimento", { ascending: false })
      .limit(20);

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

    const userContext = [
      `Mês: ${mesAtual}`,
      `Receitas: R$${totalReceitas.toFixed(2)} (${receitas.length} lançamentos)`,
      `Despesas: R$${totalDespesas.toFixed(2)} (${despesas.length} lançamentos)`,
      `Saldo: R$${(totalReceitas - totalDespesas).toFixed(2)}`,
      `Pendentes: ${pendentes}`,
      saldoContas ? `Contas: ${saldoContas}` : "",
    ].filter(Boolean).join(" | ");

    const messages: any[] = [
      { role: "system", content: buildSystemPrompt(userName || "Usuário", userContext) },
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
    // Google Gemini needs key in URL
    if (llmProvider === "google_gemini") {
      url = `${config.url}?key=${apiKey}`;
    }

    const maxTokens = 100; // ~150 chars limit

    const llmResponse = await fetch(url, {
      method: "POST",
      headers: config.buildHeaders(apiKey),
      body: JSON.stringify(config.buildBody(messages, maxTokens)),
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      console.error(`LLM error (${llmProvider}):`, llmResponse.status, errText);

      // If rate limited or payment required on Lovable AI, inform user
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

    // Enforce 150 char limit (except financial reports)
    if (reply.length > 150 && !messageText.toLowerCase().includes("relatório") && !messageText.toLowerCase().includes("relatorio")) {
      reply = reply.substring(0, 147) + "...";
    } else if (reply.length > 500) {
      reply = reply.substring(0, 497) + "...";
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
