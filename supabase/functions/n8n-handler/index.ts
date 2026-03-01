import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const reqUrl = new URL(req.url);
    let empresaId = reqUrl.searchParams.get("empresa_id") || "";
    const action = reqUrl.searchParams.get("action") || "";

    const body = req.method !== "GET" ? await req.json() : {};

    // ─── Helper: resolve empresa_id from email if not provided ───
    const resolveEmpresaId = async (email?: string): Promise<string | null> => {
      if (empresaId) return empresaId;
      if (!email) return null;

      const { data: perfil } = await supabase
        .from("perfis")
        .select("id, nome, email, empresa_id")
        .ilike("email", email.trim().toLowerCase())
        .not("empresa_id", "is", null)
        .maybeSingle();

      if (perfil?.empresa_id) {
        empresaId = perfil.empresa_id;
        return empresaId;
      }
      return null;
    };

    // ─── Action: identify — Identify user by phone number ───
    if (action === "identify") {
      const phone = body.phone || "";
      if (!phone) {
        return new Response(JSON.stringify({ error: "phone is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const phoneClean = phone.replace(/\D/g, "");
      const phoneVariants = [phoneClean, `+${phoneClean}`, phoneClean.replace(/^55/, "")];

      // If empresa_id provided, search within it; otherwise search all
      for (const variant of phoneVariants) {
        let query = supabase
          .from("perfis")
          .select("id, nome, email, empresa_id, evolution_webhook_url")
          .ilike("evolution_webhook_url", `%${variant}%`)
          .not("empresa_id", "is", null);

        if (empresaId) {
          query = query.eq("empresa_id", empresaId);
        }

        const { data: perfil } = await query.maybeSingle();

        if (perfil) {
          empresaId = perfil.empresa_id!;

          // Fetch user's companies
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("empresa_id, role")
            .eq("user_id", perfil.id);

          let empresasList: any[] = [];
          if (userRoles && userRoles.length > 0) {
            const empresaIds = userRoles.map((r: any) => r.empresa_id);
            const { data: empresasData } = await supabase
              .from("empresas")
              .select("id, nome, pessoal")
              .in("id", empresaIds);
            empresasList = (empresasData || []).map((e: any) => ({
              empresa_id: e.id,
              nome: e.nome,
              pessoal: e.pessoal,
              role: userRoles.find((r: any) => r.empresa_id === e.id)?.role || "leitura",
            }));
          }

          return new Response(JSON.stringify({
            found: true,
            user_id: perfil.id,
            nome: perfil.nome,
            email: perfil.email,
            telefone: perfil.evolution_webhook_url || null,
            empresa_id: perfil.empresa_id,
            empresas: empresasList,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: identify-by-email — Identify user by telegram_id, phone or email ───
    if (action === "identify-by-email") {
      const phone = (body.phone || "").replace(/\D/g, "");
      const telegramId = body.telegram_id || "";
      const email = body.email || "";

      if (!phone && !telegramId && !email) {
        return new Response(JSON.stringify({ error: "phone, telegram_id or email is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let perfil: any = null;

      // 1. Try to find by telegram_id first
      if (!perfil && telegramId) {
        let q = supabase
          .from("perfis")
          .select("id, nome, email, empresa_id, evolution_webhook_url, telegram_id")
          .eq("telegram_id", String(telegramId))
          .not("empresa_id", "is", null);
        if (empresaId) q = q.eq("empresa_id", empresaId);
        const { data } = await q.maybeSingle();
        if (data) perfil = data;
      }

      // 2. Fallback: search by phone
      if (!perfil && phone) {
        const phoneVariants = [phone, `+${phone}`, phone.replace(/^55/, "")];
        for (const variant of phoneVariants) {
          let q = supabase
            .from("perfis")
            .select("id, nome, email, empresa_id, evolution_webhook_url, telegram_id")
            .ilike("evolution_webhook_url", `%${variant}%`)
            .not("empresa_id", "is", null);
          if (empresaId) q = q.eq("empresa_id", empresaId);
          const { data } = await q.maybeSingle();
          if (data) { perfil = data; break; }
        }
      }

      // 3. Fallback: search by email
      if (!perfil && email) {
        let q = supabase
          .from("perfis")
          .select("id, nome, email, empresa_id, evolution_webhook_url, telegram_id")
          .ilike("email", email.trim().toLowerCase())
          .not("empresa_id", "is", null);
        if (empresaId) q = q.eq("empresa_id", empresaId);
        const { data } = await q.maybeSingle();
        if (data) perfil = data;
      }

      if (!perfil) {
        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If user found but telegram_id not set, update it
      if (telegramId && !perfil.telegram_id) {
        await supabase
          .from("perfis")
          .update({ telegram_id: String(telegramId) })
          .eq("id", perfil.id);
      }

      empresaId = perfil.empresa_id!;

      // Check if user is super_admin
      const { data: emailUserRoles } = await supabase
        .from("user_roles")
        .select("empresa_id, role")
        .eq("user_id", perfil.id);

      let emailEmpresasList: any[] = [];
      if (emailUserRoles && emailUserRoles.length > 0) {
        const eIds = emailUserRoles.map((r: any) => r.empresa_id);
        const { data: eData } = await supabase
          .from("empresas")
          .select("id, nome, pessoal")
          .in("id", eIds);
        emailEmpresasList = (eData || []).map((e: any) => ({
          empresa_id: e.id,
          nome: e.nome,
          pessoal: e.pessoal,
          role: emailUserRoles.find((r: any) => r.empresa_id === e.id)?.role || "leitura",
        }));
      }

      return new Response(JSON.stringify({
        found: true,
        user_id: perfil.id,
        nome: perfil.nome,
        email: perfil.email,
        telefone: phone || perfil.evolution_webhook_url || null,
        telegram_id: perfil.telegram_id || telegramId || null,
        empresa_id: perfil.empresa_id,
        empresas: emailEmpresasList,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Action: chat — Send message and get AI response ───
    if (action === "chat") {
      const userId = body.user_id || "";
      const message = body.message || "";

      if (!userId || !message) {
        return new Response(JSON.stringify({ error: "user_id and message are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resolve empresa_id from user profile if not provided
      if (!empresaId) {
        const { data: userPerfil } = await supabase
          .from("perfis")
          .select("empresa_id")
          .eq("id", userId)
          .maybeSingle();
        if (userPerfil?.empresa_id) empresaId = userPerfil.empresa_id;
      }

      if (!empresaId) {
        return new Response(JSON.stringify({ error: "empresa_id could not be resolved" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user name
      const { data: perfil } = await supabase
        .from("perfis")
        .select("nome")
        .eq("id", userId)
        .single();

      const userName = perfil?.nome || "Usuário";

      // Get configured LLM
      const { data: empresa } = await supabase
        .from("empresas")
        .select("llm_padrao")
        .eq("id", empresaId)
        .single();

      const llmPadrao = empresa?.llm_padrao || null;
      let llmProvider: string | null = null;
      let apiKey: string | null = null;
      let selectedModel: string | null = null;

      if (llmPadrao) {
        if (llmPadrao === "lovable_ai") {
          llmProvider = "lovable_ai";
          apiKey = Deno.env.get("LOVABLE_API_KEY") || null;
        } else {
          const { data: integ } = await supabase
            .from("integracoes")
            .select("api_key_encrypted, ativo, webhook_secret")
            .eq("empresa_id", empresaId)
            .eq("plataforma", llmPadrao)
            .eq("ativo", true)
            .maybeSingle();

          if (integ?.api_key_encrypted) {
            llmProvider = llmPadrao;
            apiKey = integ.api_key_encrypted;
            selectedModel = integ.webhook_secret || null;
          }
        }
      }

      // Fallback to Lovable AI
      if (!llmProvider) {
        const lovableKey = Deno.env.get("LOVABLE_API_KEY");
        if (lovableKey) {
          llmProvider = "lovable_ai";
          apiKey = lovableKey;
        }
      }

      if (!llmProvider || !apiKey) {
        return new Response(JSON.stringify({ reply: "Não há IA configurada. Contate o administrador." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
        conteudo: message.trim(),
      });

      // Load recent messages
      const { data: recentMsgs } = await supabase
        .from("mensagens_chat")
        .select("remetente, conteudo")
        .eq("conversa_id", conversa.id)
        .order("created_at", { ascending: true })
        .limit(10);

      // Financial context
      const now = new Date();
      const mesAtual = now.toISOString().slice(0, 7);
      const inicioMes = `${mesAtual}-01`;
      const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data: lancamentos } = await supabase
        .from("lancamentos")
        .select("tipo, valor, status, descricao, data_vencimento")
        .eq("empresa_id", empresaId)
        .gte("data_vencimento", inicioMes)
        .lte("data_vencimento", fimMes)
        .order("data_vencimento", { ascending: false })
        .limit(20);

      const { data: contas } = await supabase
        .from("contas_bancarias")
        .select("nome, saldo_atual")
        .eq("empresa_id", empresaId)
        .limit(5);

      const receitas = (lancamentos || []).filter((l: any) => l.tipo === "receita");
      const despesas = (lancamentos || []).filter((l: any) => l.tipo === "despesa");
      const totalReceitas = receitas.reduce((s: number, l: any) => s + Number(l.valor), 0);
      const totalDespesas = despesas.reduce((s: number, l: any) => s + Number(l.valor), 0);
      const saldoContas = (contas || []).map((c: any) => `${c.nome}: R$${Number(c.saldo_atual).toFixed(2)}`).join("; ");
      const pendentes = (lancamentos || []).filter((l: any) => l.status === "pendente").length;

      const userContext = [
        `Mês: ${mesAtual}`,
        `Receitas: R$${totalReceitas.toFixed(2)} (${receitas.length})`,
        `Despesas: R$${totalDespesas.toFixed(2)} (${despesas.length})`,
        `Saldo: R$${(totalReceitas - totalDespesas).toFixed(2)}`,
        `Pendentes: ${pendentes}`,
        saldoContas ? `Contas: ${saldoContas}` : "",
      ].filter(Boolean).join(" | ");

      const systemPrompt = `Você é um assistente financeiro do FinançaCentral atendendo "${userName}".
Responda em português brasileiro, de forma concisa (máx 150 chars, exceto relatórios: máx 500).
Use SOMENTE os dados abaixo. Se não for sobre finanças, diga: "Só posso ajudar com assuntos financeiros."
DADOS: ${userContext}`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...(recentMsgs || []).map((m: any) => ({
          role: m.remetente === "usuario" ? "user" : "assistant",
          content: m.conteudo,
        })),
      ];

      // Call LLM (Lovable AI gateway format — OpenAI compatible)
      let llmUrl = "";
      let llmHeaders: Record<string, string> = {};
      let llmBody: any = {};

      if (llmProvider === "lovable_ai") {
        const model = selectedModel || "google/gemini-3-flash-preview";
        llmUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
        llmHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        llmBody = { model, messages, max_tokens: 100 };
      } else if (llmProvider === "openai") {
        const model = selectedModel || "gpt-4o-mini";
        llmUrl = "https://api.openai.com/v1/chat/completions";
        llmHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        llmBody = { model, messages, max_tokens: 100 };
      } else if (llmProvider === "google_gemini") {
        const model = selectedModel || "gemini-2.0-flash";
        llmUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        llmHeaders = { "Content-Type": "application/json" };
        llmBody = {
          contents: messages.filter((m: any) => m.role !== "system").map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          systemInstruction: { parts: [{ text: messages.find((m: any) => m.role === "system")?.content || "" }] },
          generationConfig: { maxOutputTokens: 100 },
        };
      } else if (llmProvider === "anthropic") {
        const model = selectedModel || "claude-3-haiku-20240307";
        llmUrl = "https://api.anthropic.com/v1/messages";
        llmHeaders = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" };
        llmBody = {
          model,
          max_tokens: 100,
          system: messages.find((m: any) => m.role === "system")?.content || "",
          messages: messages.filter((m: any) => m.role !== "system"),
        };
      } else if (llmProvider === "deepseek") {
        const model = selectedModel || "deepseek-chat";
        llmUrl = "https://api.deepseek.com/chat/completions";
        llmHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        llmBody = { model, messages, max_tokens: 100 };
      }

      const llmResponse = await fetch(llmUrl, {
        method: "POST",
        headers: llmHeaders,
        body: JSON.stringify(llmBody),
      });

      if (!llmResponse.ok) {
        console.error(`LLM error (${llmProvider}):`, llmResponse.status, await llmResponse.text());
        return new Response(JSON.stringify({ reply: "Erro ao processar. Tente novamente." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const llmData = await llmResponse.json();
      let reply = "";

      if (llmProvider === "google_gemini") {
        reply = llmData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (llmProvider === "anthropic") {
        reply = llmData?.content?.[0]?.text || "";
      } else {
        reply = llmData?.choices?.[0]?.message?.content || "";
      }

      reply = reply || "Desculpe, não consegui processar.";

      // Save AI response
      await supabase.from("mensagens_chat").insert({
        conversa_id: conversa.id,
        remetente: "sistema",
        conteudo: reply,
      });

      await supabase
        .from("conversas_chat")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversa.id);

      return new Response(JSON.stringify({ reply, conversa_id: conversa.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: get-financial-summary — Get financial data for n8n ───
    if (action === "get-financial-summary") {
      const userId = body.user_id || "";

      const now = new Date();
      const mesAtual = now.toISOString().slice(0, 7);
      const inicioMes = `${mesAtual}-01`;
      const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data: lancamentos } = await supabase
        .from("lancamentos")
        .select("tipo, valor, status, descricao, data_vencimento, categoria_id")
        .eq("empresa_id", empresaId)
        .gte("data_vencimento", inicioMes)
        .lte("data_vencimento", fimMes)
        .order("data_vencimento", { ascending: false })
        .limit(50);

      const { data: contas } = await supabase
        .from("contas_bancarias")
        .select("nome, saldo_atual, banco")
        .eq("empresa_id", empresaId);

      const receitas = (lancamentos || []).filter((l: any) => l.tipo === "receita");
      const despesas = (lancamentos || []).filter((l: any) => l.tipo === "despesa");

      return new Response(JSON.stringify({
        mes: mesAtual,
        total_receitas: receitas.reduce((s: number, l: any) => s + Number(l.valor), 0),
        total_despesas: despesas.reduce((s: number, l: any) => s + Number(l.valor), 0),
        qtd_receitas: receitas.length,
        qtd_despesas: despesas.length,
        pendentes: (lancamentos || []).filter((l: any) => l.status === "pendente").length,
        contas_bancarias: contas || [],
        lancamentos: lancamentos || [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Action: save-message — Save a message from n8n to a conversation ───
    if (action === "save-message") {
      const conversaId = body.conversa_id || "";
      const conteudo = body.conteudo || body.message || "";
      const remetente = body.remetente || "sistema";

      if (!conversaId || !conteudo) {
        return new Response(JSON.stringify({ error: "conversa_id and conteudo are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("mensagens_chat").insert({
        conversa_id: conversaId,
        remetente,
        conteudo,
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      error: "Unknown action. Available actions: identify, identify-by-email, chat, get-financial-summary, save-message" 
    }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("n8n-handler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
