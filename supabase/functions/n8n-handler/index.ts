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

    const requestTimestamp = new Date().toISOString();
    
    // ─── AUTHENTICATION ───
    const n8nApiKey = Deno.env.get("N8N_API_KEY") || "";
    const authHeader = req.headers.get("Authorization");
    const apikeyHeader = req.headers.get("apikey") || req.headers.get("api-key");
    const token = authHeader?.replace("Bearer ", "") || apikeyHeader || "";

    const isAuthorized = token === serviceRoleKey || (n8nApiKey && token === n8nApiKey);

    if (!isAuthorized) {
      console.log("🚫 [n8n-handler] Acesso negado: credencial inválida");
      
      if (empresaId) {
        await supabase.from("logs_integracoes").insert({
          empresa_id: empresaId,
          plataforma: "n8n-handler",
          evento: action || "auth",
          status: "erro",
          payload: { error: "Acesso negado: credencial inválida", action }
        }).catch(() => {});
      }

      return new Response(JSON.stringify({ error: "Não autorizado. Envie a api-key correta no header Authorization ou api-key." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method !== "GET" ? await req.json() : {};

    // ─── Helper: gera variações de número de telefone para busca ───
    const generatePhoneVariants = (raw: string): string[] => {
      const digits = (raw || "").replace(/\D/g, "");
      if (!digits) return [];
      const variants = new Set<string>();
      variants.add(digits);

      let local = digits;
      if (digits.startsWith("55") && digits.length >= 12) {
        local = digits.slice(2);
        variants.add(local);
      }

      if (local.length === 11 || local.length === 10) {
        const ddd = local.slice(0, 2);
        let numero = local.slice(2);

        if (numero.length === 9 && numero.startsWith("9")) {
          variants.add(ddd + numero);
          variants.add(ddd + numero.slice(1));
        } else if (numero.length === 8) {
          variants.add(ddd + numero);
          variants.add(ddd + "9" + numero);
        }

        const base11 = numero.length === 9 ? ddd + numero : (numero.length === 8 ? ddd + "9" + numero : ddd + numero);
        const base10 = numero.length === 9 && numero.startsWith("9") ? ddd + numero.slice(1) : (numero.length === 8 ? ddd + numero : ddd + numero);
        variants.add("55" + base11);
        variants.add("55" + base10);

        variants.add(numero);
        if (numero.length === 9 && numero.startsWith("9")) variants.add(numero.slice(1));
        if (numero.length === 8) variants.add("9" + numero);
      }

      return Array.from(variants).filter(Boolean).sort((a, b) => b.length - a.length);
    };

    // ─── Action: identify ───
    if (action === "identify") {
      const phone = body.phone || "";
      const email = body.email || "";

      if (!phone && !email) {
        return new Response(JSON.stringify({ error: "phone or email is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let perfil: any = null;

      if (phone) {
        const phoneClean = phone.replace(/\D/g, "");
        const phoneVariants = generatePhoneVariants(phoneClean);

        for (const variant of phoneVariants) {
          let query = supabase
            .from("perfis")
            .select("id, nome, email, empresa_id, evolution_webhook_url")
            .ilike("evolution_webhook_url", `%${variant}%`)
            .not("empresa_id", "is", null);

          if (empresaId) query = query.eq("empresa_id", empresaId);

          const { data } = await query.maybeSingle();
          if (data) { perfil = data; break; }
        }
      }

      if (!perfil && email) {
        let query = supabase
          .from("perfis")
          .select("id, nome, email, empresa_id, evolution_webhook_url")
          .ilike("email", email.trim().toLowerCase())
          .not("empresa_id", "is", null);

        if (empresaId) query = query.eq("empresa_id", empresaId);

        const { data } = await query.maybeSingle();
        if (data) perfil = data;
      }

      if (perfil) {
          empresaId = perfil.empresa_id!;
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

          const response = {
            found: true,
            user_id: perfil.id,
            nome: perfil.nome,
            email: perfil.email,
            telefone: perfil.evolution_webhook_url || null,
            empresa_id: perfil.empresa_id,
            empresas: empresasList,
          };

          // Log success for identify
          await supabase.from("logs_integracoes").insert({
            empresa_id: perfil.empresa_id!,
            plataforma: "n8n-handler",
            evento: "identify",
            status: "sucesso",
            payload: { request: body, response }
          }).catch(() => {});

          return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Log failure for identify
      if (empresaId) {
        await supabase.from("logs_integracoes").insert({
          empresa_id: empresaId,
          plataforma: "n8n-handler",
          evento: "identify",
          status: "erro",
          payload: { request: body, response: { found: false }, message: "Usuário não encontrado" }
        }).catch(() => {});
      }

      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: identify-by-email ───
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

      if (!perfil && phone) {
        const phoneVariants = generatePhoneVariants(phone);
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

      if (telegramId && !perfil.telegram_id) {
        await supabase
          .from("perfis")
          .update({ telegram_id: String(telegramId) })
          .eq("id", perfil.id);
      }

      empresaId = perfil.empresa_id!;

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

    // ─── Action: chat ───
    if (action === "chat") {
      const userId = body.user_id || "";
      const message = body.message || "";

      if (!userId || !message) {
        return new Response(JSON.stringify({ error: "user_id and message are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      const { data: perfil } = await supabase
        .from("perfis")
        .select("nome")
        .eq("id", userId)
        .single();

      const userName = perfil?.nome || "Usuário";

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

      await supabase.from("mensagens_chat").insert({
        conversa_id: conversa.id,
        remetente: "usuario",
        conteudo: message.trim(),
      });

      const { data: recentMsgs } = await supabase
        .from("mensagens_chat")
        .select("remetente, conteudo")
        .eq("conversa_id", conversa.id)
        .order("created_at", { ascending: true })
        .limit(10);

      const now = new Date();
      const mesAtual = now.toISOString().slice(0, 7);
      const inicioMes = `${mesAtual}-01`;
      const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const { data: lancamentos } = await supabase
        .from("lancamentos")
        .select("id, tipo, valor, status, descricao, data_vencimento, recorrente, recorrencia_grupo_id")
        .eq("empresa_id", empresaId)
        .gte("data_vencimento", inicioMes)
        .lte("data_vencimento", fimMes)
        .order("data_vencimento", { ascending: false })
        .limit(30);

      const stopWords = ["o", "a", "os", "as", "de", "do", "da", "dos", "das", "em", "no", "na", "um", "uma",
        "para", "por", "com", "que", "me", "meu", "minha", "qual", "quais", "como", "onde",
        "tem", "tenho", "ter", "foi", "ser", "está", "são", "esse", "essa", "isso",
        "alterar", "mudar", "buscar", "encontrar", "mostrar", "ver", "listar"];
      const keywords = message.toLowerCase().replace(/[^\w\sà-ú]/g, "").split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.includes(w));
      
      let searchedLancamentos: any[] = [];
      if (keywords.length > 0) {
        const searchTerms = keywords.slice(0, 3);
        let query = supabase
          .from("lancamentos")
          .select("id, tipo, valor, status, descricao, data_vencimento, recorrente, recorrencia_grupo_id")
          .eq("empresa_id", empresaId);
        for (const term of searchTerms) {
          query = query.ilike("descricao", `%${term}%`);
        }
        const { data: searched } = await query.order("data_vencimento", { ascending: false }).limit(20);
        if (searched && searched.length > 0) searchedLancamentos = searched;
      }

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

      let searchContext = "";
      if (searchedLancamentos.length > 0) {
        const searchResults = searchedLancamentos.map((l: any) => 
          `- ID:${l.id} | "${l.descricao}" | ${l.tipo} | R$${Number(l.valor).toFixed(2)} | ${l.status} | Venc:${l.data_vencimento} | Recorrente:${l.recorrente ? "Sim" : "Não"}${l.recorrencia_grupo_id ? ` | Grupo:${l.recorrencia_grupo_id}` : ""}`
        ).join("\n");
        searchContext = `\n\nLANÇAMENTOS ENCONTRADOS POR BUSCA:\n${searchResults}`;
      }

      const lancamentosContext = (lancamentos || []).map((l: any) =>
        `- ID:${l.id} | "${l.descricao}" | ${l.tipo} | R$${Number(l.valor).toFixed(2)} | ${l.status} | Venc:${l.data_vencimento} | Recorrente:${l.recorrente ? "Sim" : "Não"}`
      ).join("\n");

      const userContext = [
        `Mês: ${mesAtual}`,
        `Receitas: R$${totalReceitas.toFixed(2)} (${receitas.length})`,
        `Despesas: R$${totalDespesas.toFixed(2)} (${despesas.length})`,
        `Saldo: R$${(totalReceitas - totalDespesas).toFixed(2)}`,
        `Pendentes: ${pendentes}`,
        saldoContas ? `Contas: ${saldoContas}` : "",
      ].filter(Boolean).join(" | ");

      const systemPrompt = `Você é um assistente financeiro do FinançaCentral atendendo "${userName}".
Responda em português brasileiro, de forma concisa (máx 300 chars, exceto relatórios: máx 500).
Use SOMENTE os dados abaixo. Se não for sobre finanças, diga: "Só posso ajudar com assuntos financeiros."

CAPACIDADES DE EDIÇÃO:
- Você PODE alterar descrições de lançamentos quando solicitado.
- Quando o usuário pedir para alterar/renomear um lançamento, responda com o formato EXATO:
  [AÇÃO:ATUALIZAR_DESCRICAO|ID:uuid-do-lancamento|NOVA_DESCRICAO:nova descrição aqui]
  seguido de uma confirmação amigável.
- Se encontrar MÚLTIPLOS lançamentos correspondentes (recorrentes), liste-os e pergunte se deseja alterar todos ou apenas um específico.
- Se o usuário confirmar "todos" ou "sim", use múltiplas linhas de ação, uma para cada ID.

DADOS: ${userContext + (lancamentosContext ? `\n\nLANÇAMENTOS DO MÊS:\n${lancamentosContext}` : "") + searchContext}`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...(recentMsgs || []).map((m: any) => ({
          role: m.remetente === "usuario" ? "user" : "assistant",
          content: m.conteudo,
        })),
      ];

      let llmUrl = "";
      let llmHeaders: Record<string, string> = {};
      let llmBody: any = {};

      if (llmProvider === "lovable_ai") {
        const model = selectedModel || "google/gemini-3-flash-preview";
        llmUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
        llmHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        llmBody = { model, messages, max_tokens: 300 };
      } else if (llmProvider === "openai") {
        const model = selectedModel || "gpt-4o-mini";
        llmUrl = "https://api.openai.com/v1/chat/completions";
        llmHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        llmBody = { model, messages, max_tokens: 300 };
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
          generationConfig: { maxOutputTokens: 300 },
        };
      } else if (llmProvider === "anthropic") {
        const model = selectedModel || "claude-3-haiku-20240307";
        llmUrl = "https://api.anthropic.com/v1/messages";
        llmHeaders = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" };
        llmBody = {
          model,
          max_tokens: 300,
          system: messages.find((m: any) => m.role === "system")?.content || "",
          messages: messages.filter((m: any) => m.role !== "system"),
        };
      } else if (llmProvider === "deepseek") {
        const model = selectedModel || "deepseek-chat";
        llmUrl = "https://api.deepseek.com/chat/completions";
        llmHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
        llmBody = { model, messages, max_tokens: 300 };
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

        reply = reply.replace(/\[AÇÃO:ATUALIZAR_DESCRICAO\|ID:[a-f0-9-]+\|NOVA_DESCRICAO:.+?\]/gi, "").trim();
        
        if (!reply) {
          if (successCount > 0 && failCount === 0) {
            reply = `✅ ${successCount} lançamento(s) atualizado(s) com sucesso!`;
          } else if (failCount > 0) {
            reply = `⚠️ ${successCount} atualizado(s), ${failCount} com erro. Verifique os dados.`;
          }
        }
      }

      if (reply.length > 800) {
        reply = reply.substring(0, 797) + "...";
      }

      await supabase.from("mensagens_chat").insert({
        conversa_id: conversa.id,
        remetente: "sistema",
        conteudo: reply,
      });

      await supabase
        .from("conversas_chat")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversa.id);

      const response = { reply, conversa_id: conversa.id };
      
      // Log success for chat
      await supabase.from("logs_integracoes").insert({
        empresa_id: empresaId,
        plataforma: "n8n-handler",
        evento: "chat",
        status: "sucesso",
        payload: { request: { userId, messageLength: message.length }, response }
      }).catch(() => {});

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Action: get-financial-summary ───
    if (action === "get-financial-summary") {
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

    // ─── Action: save-message ───
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

    // ─── LOG SUCCESS ───
    if (empresaId) {
      const duration = Date.now() - new Date(requestTimestamp).getTime();
      await supabase.from("logs_integracoes").insert({
        empresa_id: empresaId,
        plataforma: "n8n-handler",
        evento: action,
        status: "sucesso",
        payload: { 
          action, 
          body, 
          duration_ms: duration,
          timestamp: new Date().toISOString()
        }
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ 
      error: "Unknown action. Available actions: identify, identify-by-email, chat, get-financial-summary, save-message" 
    }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("n8n-handler error:", error);
    
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sbLog = createClient(supabaseUrl, serviceRoleKey);
      
      const eid = empresaId || "00000000-0000-0000-0000-000000000000";
      
      await sbLog.from("logs_integracoes").insert({
        empresa_id: eid,
        plataforma: "n8n-handler",
        evento: action || "unknown",
        status: "erro",
        payload: { 
          error: error.message, 
          stack: error.stack?.substring(0, 500),
          action: action
        }
      });
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
