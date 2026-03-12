import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Aceitar body como objeto direto ou string JSON (parse automático)
    let rawBody: any = {};
    const bodyText = await req.text();
    if (bodyText && bodyText.trim()) {
      try { rawBody = JSON.parse(bodyText); } catch (_) { rawBody = {}; }
    }
    // Se o n8n enviar o body como string JSON escapada, fazer parse novamente
    if (typeof rawBody === "string") {
      try { rawBody = JSON.parse(rawBody); } catch (_) { /* mantém como está */ }
    }
    // Se veio encapsulado em { output: "..." } do n8n
    if (rawBody && typeof rawBody === "object" && typeof rawBody.output === "string") {
      try { rawBody = JSON.parse(rawBody.output); } catch (_) { /* mantém como está */ }
    }
    // Se veio como array com um item [{ output: "..." }] ou [{ json_montado: {...} }]
    if (Array.isArray(rawBody)) {
      const first = rawBody[0];
      if (first?.output) {
        try { rawBody = typeof first.output === "string" ? JSON.parse(first.output) : first.output; } catch (_) { rawBody = first; }
      } else if (first?.json_montado) {
        rawBody = first.json_montado;
      } else {
        rawBody = first || {};
      }
    }
    // Se veio com json_montado como wrapper
    if (rawBody && typeof rawBody === "object" && rawBody.json_montado && !rawBody.action) {
      rawBody = rawBody.json_montado;
    }
    // Helper: limpar valores que são placeholders literais do n8n (ex: "{empresa_id}", "", undefined)
    const sanitize = (val: any): any => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === "string") {
        const trimmed = val.trim();
        // Detectar placeholders literais: {param}, {{param}}, $fromAI(...), strings vazias
        if (!trimmed || /^\{.*\}$/.test(trimmed) || /^\$fromAI\(/.test(trimmed)) return undefined;
      }
      return val;
    };

    // ─── Helper: normalizar texto conforme norma culta pt-BR ───
    const normalizeText = (text: string | undefined | null, type: "nome" | "descricao" | "endereco" | "estado" = "nome"): string | undefined => {
      if (!text || typeof text !== "string") return undefined;
      let s = text.trim().replace(/\s{2,}/g, " "); // remover espaços extras

      if (type === "estado") {
        // Estados: sempre maiúsculo (UF de 2 chars ou nome por extenso)
        if (s.length === 2) return s.toUpperCase();
        // Nome de estado por extenso: Title Case
        return s.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
      }

      // Artigos, preposições e conjunções que permanecem minúsculas (exceto início)
      const minusculas = new Set([
        "da", "de", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos",
        "para", "por", "com", "sem", "a", "o", "as", "os", "à", "ao", "às", "aos",
        "um", "uma", "uns", "umas", "que", "ou",
      ]);

      // Title Case inteligente
      const titleCase = (str: string): string => {
        return str.toLowerCase().split(" ").map((word, index) => {
          if (!word) return word;
          // Primeira palavra sempre capitalizada
          if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
          // Preposições/artigos ficam minúsculas
          if (minusculas.has(word)) return word;
          // Siglas comuns (2-4 chars all consonants or known acronyms)
          if (word.length <= 4 && /^[A-Z]+$/i.test(word) && !/[aeiouáéíóúâêîôû]/i.test(word)) return word.toUpperCase();
          // Capitalizar
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(" ");
      };

      // Correções ortográficas comuns
      const correcoes: Record<string, string> = {
        // ── Financeiro / Pagamentos ──
        "recebimento": "Recebimento", "pagamento": "Pagamento",
        "transferencia": "Transferência", "transferência": "Transferência",
        "cartao": "Cartão", "cartão": "Cartão",
        "credito": "Crédito", "crédito": "Crédito",
        "debito": "Débito", "débito": "Débito",
        "pix": "Pix", "PIX": "Pix",
        "boleto": "Boleto", "dinheiro": "Dinheiro",
        "faturamento": "Faturamento", "fatura": "Fatura",
        "parcela": "Parcela", "parcelas": "Parcelas",
        "juros": "Juros", "multa": "Multa", "multas": "Multas",
        "desconto": "Desconto", "descontos": "Descontos",
        "reembolso": "Reembolso", "estorno": "Estorno",
        "deposito": "Depósito", "depósito": "Depósito",
        "saque": "Saque", "saques": "Saques",
        "taxa": "Taxa", "taxas": "Taxas",
        "tarifa": "Tarifa", "tarifas": "Tarifas",
        "anuidade": "Anuidade",
        "rendimento": "Rendimento", "rendimentos": "Rendimentos",
        "dividendo": "Dividendo", "dividendos": "Dividendos",
        "pro-labore": "Pró-Labore", "prolabore": "Pró-Labore", "pró-labore": "Pró-Labore",
        "bonificacao": "Bonificação", "bonificação": "Bonificação",
        "gratificacao": "Gratificação", "gratificação": "Gratificação",
        "adiantamento": "Adiantamento",
        "provisionamento": "Provisionamento", "provisao": "Provisão", "provisão": "Provisão",
        // ── Categorias / Despesas comuns ──
        "alimentacao": "Alimentação", "alimentação": "Alimentação",
        "educacao": "Educação", "educação": "Educação",
        "habitacao": "Habitação", "habitação": "Habitação",
        "comunicacao": "Comunicação", "comunicação": "Comunicação",
        "manutencao": "Manutenção", "manutenção": "Manutenção",
        "comissao": "Comissão", "comissão": "Comissão",
        "comissoes": "Comissões",
        "servico": "Serviço", "serviço": "Serviço",
        "servicos": "Serviços", "serviços": "Serviços",
        "eletronico": "Eletrônico", "eletrônico": "Eletrônico",
        "eletronicos": "Eletrônicos", "eletrônicos": "Eletrônicos",
        "veiculo": "Veículo", "veículo": "Veículo",
        "veiculos": "Veículos", "veículos": "Veículos",
        "automovel": "Automóvel", "automóvel": "Automóvel",
        "combustivel": "Combustível", "combustível": "Combustível",
        "gasolina": "Gasolina", "diesel": "Diesel", "etanol": "Etanol",
        "estacionamento": "Estacionamento", "pedagio": "Pedágio", "pedágio": "Pedágio",
        "numero": "Número", "telefone": "Telefone",
        "salario": "Salário", "salário": "Salário",
        "salarios": "Salários", "salários": "Salários",
        "ferias": "Férias", "férias": "Férias",
        "rescisao": "Rescisão", "rescisão": "Rescisão",
        "decimo": "Décimo", "décimo": "Décimo",
        "beneficio": "Benefício", "benefício": "Benefício",
        "beneficios": "Benefícios", "benefícios": "Benefícios",
        "vale-transporte": "Vale-Transporte", "vale-refeicao": "Vale-Refeição", "vale-refeição": "Vale-Refeição",
        "vale-alimentacao": "Vale-Alimentação", "vale-alimentação": "Vale-Alimentação",
        "lucro": "Lucro", "lucros": "Lucros",
        "investimento": "Investimento", "investimentos": "Investimentos",
        "emprestimo": "Empréstimo", "empréstimo": "Empréstimo",
        "emprestimos": "Empréstimos", "empréstimos": "Empréstimos",
        "financiamento": "Financiamento", "financiamentos": "Financiamentos",
        "imposto": "Imposto", "impostos": "Impostos",
        "tributo": "Tributo", "tributos": "Tributos",
        "contribuicao": "Contribuição", "contribuição": "Contribuição",
        "seguro": "Seguro", "seguros": "Seguros",
        "aluguel": "Aluguel", "alugueis": "Aluguéis", "aluguéis": "Aluguéis",
        "condominio": "Condomínio", "condomínio": "Condomínio",
        "iptu": "IPTU", "ipva": "IPVA", "icms": "ICMS", "iss": "ISS",
        "irpf": "IRPF", "irpj": "IRPJ", "inss": "INSS", "fgts": "FGTS",
        "pis": "PIS", "cofins": "COFINS", "csll": "CSLL",
        "das": "DAS", "mei": "MEI", "simples": "Simples",
        "energia": "Energia", "agua": "Água", "gas": "Gás", "gás": "Gás",
        "internet": "Internet", "telefonia": "Telefonia",
        "assinatura": "Assinatura", "assinaturas": "Assinaturas",
        "licenca": "Licença", "licença": "Licença",
        "software": "Software", "hardware": "Hardware",
        "hospedagem": "Hospedagem", "dominio": "Domínio", "domínio": "Domínio",
        // ── Escritório / Empresa ──
        "escritorio": "Escritório", "escritório": "Escritório",
        "consultoria": "Consultoria", "assessoria": "Assessoria",
        "contabil": "Contábil", "contábil": "Contábil",
        "contabilidade": "Contabilidade",
        "juridico": "Jurídico", "jurídico": "Jurídico",
        "advocacia": "Advocacia", "honorario": "Honorário", "honorário": "Honorário",
        "honorarios": "Honorários", "honorários": "Honorários",
        "logistica": "Logística", "logística": "Logística",
        "frete": "Frete", "fretes": "Fretes",
        "entrega": "Entrega", "entregas": "Entregas",
        "transporte": "Transporte", "transportes": "Transportes",
        "propaganda": "Propaganda", "publicidade": "Publicidade",
        "marketing": "Marketing", "vendas": "Vendas",
        "recepcao": "Recepção", "recepção": "Recepção",
        "administracao": "Administração", "administração": "Administração",
        "producao": "Produção", "produção": "Produção",
        "fabricacao": "Fabricação", "fabricação": "Fabricação",
        "distribuicao": "Distribuição", "distribuição": "Distribuição",
        "importacao": "Importação", "importação": "Importação",
        "exportacao": "Exportação", "exportação": "Exportação",
        "estoque": "Estoque", "estoques": "Estoques",
        "inventario": "Inventário", "inventário": "Inventário",
        "mercadoria": "Mercadoria", "mercadorias": "Mercadorias",
        "materia-prima": "Matéria-Prima", "matéria-prima": "Matéria-Prima",
        "insumo": "Insumo", "insumos": "Insumos",
        "equipamento": "Equipamento", "equipamentos": "Equipamentos",
        "ferramenta": "Ferramenta", "ferramentas": "Ferramentas",
        "maquinario": "Maquinário", "maquinário": "Maquinário",
        // ── Pessoas / Relações ──
        "fornecedor": "Fornecedor", "fornecedores": "Fornecedores",
        "cliente": "Cliente", "clientes": "Clientes",
        "funcionario": "Funcionário", "funcionário": "Funcionário",
        "funcionarios": "Funcionários", "funcionários": "Funcionários",
        "colaborador": "Colaborador", "colaboradores": "Colaboradores",
        "socio": "Sócio", "sócio": "Sócio",
        "socios": "Sócios", "sócios": "Sócios",
        "autonomo": "Autônomo", "autônomo": "Autônomo",
        "terceirizado": "Terceirizado", "terceirizados": "Terceirizados",
        "prestador": "Prestador", "prestadores": "Prestadores",
        // ── Documentos / Contratos ──
        "contrato": "Contrato", "contratos": "Contratos",
        "nota-fiscal": "Nota Fiscal", "nota fiscal": "Nota Fiscal",
        "recibo": "Recibo", "recibos": "Recibos",
        "orcamento": "Orçamento", "orçamento": "Orçamento",
        "proposta": "Proposta", "propostas": "Propostas",
        "pedido": "Pedido", "pedidos": "Pedidos",
        "compra": "Compra", "compras": "Compras",
        "venda": "Venda",
        // ── Setores / Áreas ──
        "financeiro": "Financeiro", "comercial": "Comercial",
        "operacional": "Operacional", "tecnico": "Técnico", "técnico": "Técnico",
        "tecnologia": "Tecnologia", "informatica": "Informática", "informática": "Informática",
        "recursos-humanos": "Recursos Humanos", "rh": "RH",
        "departamento": "Departamento",
        "diretoria": "Diretoria", "gerencia": "Gerência", "gerência": "Gerência",
        "supervisao": "Supervisão", "supervisão": "Supervisão",
        // ── Plataformas digitais ──
        "hotmart": "Hotmart", "eduzz": "Eduzz", "monetizze": "Monetizze",
        "kiwify": "Kiwify", "braip": "Braip", "perfectpay": "PerfectPay",
        "stripe": "Stripe", "paypal": "PayPal", "pagseguro": "PagSeguro",
        "mercadopago": "Mercado Pago", "mercado-pago": "Mercado Pago",
        "cielo": "Cielo", "stone": "Stone", "rede": "Rede",
        "getnet": "Getnet", "safrapay": "SafraPay",
        "shopee": "Shopee", "shopify": "Shopify",
        "amazon": "Amazon", "magalu": "Magalu",
        "ifood": "iFood", "uber": "Uber", "rappi": "Rappi", "99": "99",
        // ── Bancos ──
        "bradesco": "Bradesco", "itau": "Itaú", "itaú": "Itaú",
        "santander": "Santander", "caixa": "Caixa",
        "nubank": "Nubank", "inter": "Inter", "c6": "C6",
        "sicoob": "Sicoob", "sicredi": "Sicredi",
        "safra": "Safra", "original": "Original",
        "neon": "Neon", "pagbank": "PagBank",
        "btg": "BTG", "xp": "XP",
      };

      if (type === "nome" || type === "descricao") {
        s = titleCase(s);
        // Aplicar correções de acentuação em palavras individuais
        s = s.split(" ").map((word) => {
          const lower = word.toLowerCase();
          return correcoes[lower] || word;
        }).join(" ");
      }

      if (type === "endereco") {
        s = titleCase(s);
        // Abreviações de endereço padrão
        s = s.replace(/\b(rua|r\.)\b/i, "Rua")
          .replace(/\b(avenida|av\.)\b/i, "Avenida")
          .replace(/\b(travessa|tv\.)\b/i, "Travessa")
          .replace(/\b(praca|praça|pç\.)\b/i, "Praça")
          .replace(/\b(alameda|al\.)\b/i, "Alameda")
          .replace(/\b(rodovia|rod\.)\b/i, "Rodovia");
      }

      return s;
    };

    const body = rawBody;
    const action = sanitize(body.action) || body.action;
    const empresa_id = sanitize(body.empresa_id);
    const user_id = sanitize(body.user_id);
    const periodo = sanitize(body.periodo);
    const data_inicio_custom = sanitize(body.data_inicio);
    const data_fim_custom = sanitize(body.data_fim);
    
    // Suportar filtros como objeto aninhado OU como parâmetros top-level (flat)
    const filters = body.filters || {};
    const flatFilterKeys = ["tipo", "status", "categoria_id", "plataforma", "ativo", "search", "limit", "permissao"];
    for (const key of flatFilterKeys) {
      const rawVal = body[key] !== undefined ? body[key] : filters[key];
      const cleanVal = sanitize(rawVal);
      if (cleanVal !== undefined) {
        filters[key] = cleanVal;
      } else {
        delete filters[key];
      }
    }

    const requestTimestamp = new Date().toISOString();
    const requestLog = {
      timestamp: requestTimestamp,
      method: req.method,
      url: req.url,
      action,
      empresa_id,
      user_id: user_id || null,
      periodo: periodo || null,
      filters: filters || null,
      headers: {
        content_type: req.headers.get("content-type"),
        origin: req.headers.get("origin"),
        user_agent: req.headers.get("user-agent"),
      },
    };
    console.log("📥 [n8n-query] REQUEST:", JSON.stringify(requestLog, null, 2));

    // ─── UUID VALIDATION ───
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!empresa_id) {
      console.log("❌ [n8n-query] ERRO: empresa_id ausente");
      return new Response(JSON.stringify({ error: "empresa_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!uuidRegex.test(empresa_id)) {
      console.log(`❌ [n8n-query] ERRO: empresa_id inválido: ${empresa_id}`);
      return new Response(JSON.stringify({ error: "empresa_id must be a valid UUID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (user_id && !uuidRegex.test(user_id)) {
      console.log(`❌ [n8n-query] ERRO: user_id inválido: ${user_id}`);
      return new Response(JSON.stringify({ error: "user_id must be a valid UUID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── PERMISSION CHECK ───
    // Map actions to screen keys and required permission type
    const actionPermissionMap: Record<string, { tela: string; tipo?: "pode_incluir" | "pode_alterar" | "pode_excluir" }> = {
      // Leitura (view)
      "lancamentos": { tela: "lancamentos" },
      "despesas-pendentes": { tela: "lancamentos" },
      "receitas-pendentes": { tela: "lancamentos" },
      "resumo-financeiro": { tela: "dashboard" },
      "resumo-categorias": { tela: "dashboard" },
      "fluxo-caixa": { tela: "dashboard" },
      "clientes": { tela: "clientes" },
      "fornecedores": { tela: "fornecedores" },
      "categorias": { tela: "categorias" },
      "contas-bancarias": { tela: "contas_bancarias" },
      "formas-pagamento": { tela: "formas_pagamento" },
      "projetos": { tela: "projetos" },
      "vendas-digitais": { tela: "vendas_digitais" },
      "recebimentos-digitais": { tela: "vendas_digitais" },
      "listar-anuncios": { tela: "anuncios" },
      "listar-usuarios": { tela: "users" },
      "extrato-conta": { tela: "contas_bancarias" },
      
      // Criação (pode_incluir)
      "criar-lancamento": { tela: "lancamentos", tipo: "pode_incluir" },
      "criar-cliente": { tela: "clientes", tipo: "pode_incluir" },
      "criar-fornecedor": { tela: "fornecedores", tipo: "pode_incluir" },
      "criar-categoria": { tela: "categorias", tipo: "pode_incluir" },
      "criar-conta-bancaria": { tela: "contas_bancarias", tipo: "pode_incluir" },
      "criar-forma-pagamento": { tela: "formas_pagamento", tipo: "pode_incluir" },
      "criar-projeto": { tela: "projetos", tipo: "pode_incluir" },
      "transferir-entre-contas": { tela: "contas_bancarias", tipo: "pode_alterar" },
      "criar-venda": { tela: "vendas_digitais", tipo: "pode_incluir" },
      // Edição (pode_alterar)
      "editar-cliente": { tela: "clientes", tipo: "pode_alterar" },
      "editar-fornecedor": { tela: "fornecedores", tipo: "pode_alterar" },
      "editar-categoria": { tela: "categorias", tipo: "pode_alterar" },
      "editar-conta-bancaria": { tela: "contas_bancarias", tipo: "pode_alterar" },
      "editar-forma-pagamento": { tela: "formas_pagamento", tipo: "pode_alterar" },
      "editar-projeto": { tela: "projetos", tipo: "pode_alterar" },
      "editar-lancamento": { tela: "lancamentos", tipo: "pode_alterar" },
      "editar-venda": { tela: "vendas_digitais", tipo: "pode_alterar" },
      "atualizar-telegram-cliente": { tela: "clientes", tipo: "pode_alterar" },
      // Exclusão (pode_excluir)
      "excluir-cliente": { tela: "clientes", tipo: "pode_excluir" },
      "excluir-fornecedor": { tela: "fornecedores", tipo: "pode_excluir" },
      "excluir-categoria": { tela: "categorias", tipo: "pode_excluir" },
      "excluir-conta-bancaria": { tela: "contas_bancarias", tipo: "pode_excluir" },
      "excluir-forma-pagamento": { tela: "formas_pagamento", tipo: "pode_excluir" },
      "excluir-projeto": { tela: "projetos", tipo: "pode_excluir" },
      "excluir-lancamento": { tela: "lancamentos", tipo: "pode_excluir" },
      "excluir-venda": { tela: "vendas_digitais", tipo: "pode_excluir" },
    };

    // Check permissions — user_id is MANDATORY for actions that require permissions
    const permRule = actionPermissionMap[action];
    if (permRule) {
      if (!user_id) {
        console.log(`🚫 [n8n-query] Acesso negado: user_id ausente para ação '${action}' que requer permissão`);
        return new Response(JSON.stringify({
          error: "Acesso negado",
          message: "user_id é obrigatório para esta ação. Identifique o usuário antes de prosseguir.",
        }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user belongs to this empresa
      const { data: userBelongs } = await supabase.rpc("user_belongs_to_empresa", {
        _user_id: user_id,
        _empresa_id: empresa_id,
      });

      if (!userBelongs) {
        console.log(`🚫 [n8n-query] Acesso negado: user ${user_id} não pertence à empresa ${empresa_id}`);
        return new Response(JSON.stringify({
          error: "Acesso negado",
          message: "Você não pertence a esta empresa.",
        }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user is super_admin (global bypass) or admin of this empresa
      const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", { _user_id: user_id });

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .eq("empresa_id", empresa_id)
        .maybeSingle();

      const role = userRole?.role;
      const isAdminOrSuper = isSuperAdmin === true || role === "admin" || role === "super_admin";

      if (!isAdminOrSuper) {
        // Check screen-level permissions
        const { data: userPerms } = await supabase
          .from("permissoes")
          .select("tela, pode_incluir, pode_alterar, pode_excluir")
          .eq("perfis_id", user_id);

        const perms = userPerms || [];

        // If perms.length === 0 → no permissions defined, block ALL access (deny by default)
        if (perms.length === 0) {
          const tipoLabel = permRule.tipo 
            ? (permRule.tipo === "pode_incluir" ? "incluir" : permRule.tipo === "pode_alterar" ? "alterar" : "excluir")
            : "visualizar";
          console.log(`🚫 [n8n-query] Acesso negado: user ${user_id} sem permissões definidas, tentou '${tipoLabel}' na tela '${permRule.tela}'`);
          return new Response(JSON.stringify({
            error: "Acesso negado",
            message: `Você não tem permissão para acessar '${permRule.tela}'. Solicite ao administrador.`,
          }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If user has permissions defined, check access
        const screenPerm = perms.find((p: any) => p.tela === permRule.tela);

        if (!screenPerm) {
          // User has permissions but not for this screen → blocked
          console.log(`🚫 [n8n-query] Acesso negado: user ${user_id} sem permissão para tela '${permRule.tela}'`);
          return new Response(JSON.stringify({
            error: "Acesso negado",
            message: `Você não tem permissão para acessar '${permRule.tela}'.`,
          }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check specific action permission (create/edit/delete/view)
        if (permRule.tipo && !screenPerm[permRule.tipo]) {
          const viewOnlyScreens = ["vendas_digitais", "anuncios", "dashboard"];
          const tipoLabel = viewOnlyScreens.includes(permRule.tela) && permRule.tipo === "pode_incluir"
            ? "visualizar"
            : permRule.tipo === "pode_incluir" ? "incluir" : permRule.tipo === "pode_alterar" ? "alterar" : "excluir";
          console.log(`🚫 [n8n-query] Acesso negado: user ${user_id} sem permissão '${tipoLabel}' na tela '${permRule.tela}'`);
          return new Response(JSON.stringify({
            error: "Acesso negado",
            message: `Você não tem permissão para ${tipoLabel} em '${permRule.tela}'.`,
          }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      console.log(`✅ [n8n-query] Permissão concedida: user ${user_id}, action '${action}'`);
    }

    // Helper: data atual no fuso horário do Brasil (UTC-3)
    const getBrazilDate = () => {
      const now = new Date();
      const brDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      return brDate;
    };

    // Helper: date range from periodo or custom dates (usando horário do Brasil)
    const getDateRange = (p?: string) => {
      // Custom date range takes priority
      if (data_inicio_custom && data_fim_custom) {
        return {
          inicio: data_inicio_custom + "T00:00:00.000-03:00",
          fim: data_fim_custom + "T23:59:59.000-03:00",
        };
      }
      if (data_inicio_custom) {
        const now = getBrazilDate();
        const fimDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        return {
          inicio: data_inicio_custom + "T00:00:00.000-03:00",
          fim: fimDate + "T23:59:59.000-03:00",
        };
      }
      if (data_fim_custom) {
        return {
          inicio: "2000-01-01T00:00:00.000-03:00",
          fim: data_fim_custom + "T23:59:59.000-03:00",
        };
      }

      const now = getBrazilDate();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();
      const fimDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const fim = fimDate + "T23:59:59.000-03:00";
      let inicioDate: string;
      switch (p) {
        case "semana": {
          const d = new Date(year, month, day - 7);
          inicioDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          break;
        }
        case "mes":
          inicioDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
          break;
        case "trimestre": {
          const d = new Date(year, month - 2, 1);
          inicioDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
          break;
        }
        case "semestre": {
          const d = new Date(year, month - 5, 1);
          inicioDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
          break;
        }
        case "ano":
          inicioDate = `${year}-01-01`;
          break;
        default:
          inicioDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      }
      const inicio = inicioDate + "T00:00:00.000-03:00";
      return { inicio, fim };
    };

    let result: any = null;

    switch (action) {
      // ─── RESUMO FINANCEIRO GERAL ───
      case "resumo-financeiro": {
        const { inicio, fim } = getDateRange(periodo);

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, status, descricao, data_vencimento, data_pagamento")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim);

        const receitas = (lancamentos || []).filter((l: any) => l.tipo === "receita");
        const despesas = (lancamentos || []).filter((l: any) => l.tipo === "despesa");
        const totalReceitas = receitas.reduce((s: number, l: any) => s + Number(l.valor), 0);
        const totalDespesas = despesas.reduce((s: number, l: any) => s + Number(l.valor), 0);
        const pendentes = (lancamentos || []).filter((l: any) => l.status === "pendente");
        const pagos = (lancamentos || []).filter((l: any) => l.status === "pago");

        const { data: contas } = await supabase
          .from("contas_bancarias")
          .select("nome, saldo_atual")
          .eq("empresa_id", empresa_id);

        const saldoTotal = (contas || []).reduce((s: number, c: any) => s + Number(c.saldo_atual), 0);

        // Incluir vendas digitais no resumo
        const { data: vendas } = await supabase
          .from("vendas_digitais")
          .select("valor_bruto, valor_liquido, taxa, status")
          .eq("empresa_id", empresa_id)
          .gte("data_venda", inicio)
          .lte("data_venda", fim);

        const vendasAprovadas = (vendas || []).filter((v: any) => v.status === "aprovada");
        const totalVendasBruto = vendasAprovadas.reduce((s: number, v: any) => s + Number(v.valor_bruto), 0);
        const totalVendasLiquido = vendasAprovadas.reduce((s: number, v: any) => s + Number(v.valor_liquido), 0);
        const totalVendasTaxas = vendasAprovadas.reduce((s: number, v: any) => s + Number(v.taxa), 0);

        result = {
          periodo: { inicio, fim },
          receitas: { total: totalReceitas, quantidade: receitas.length },
          despesas: { total: totalDespesas, quantidade: despesas.length },
          saldo: totalReceitas - totalDespesas,
          pendentes: { total: pendentes.reduce((s: number, l: any) => s + Number(l.valor), 0), quantidade: pendentes.length },
          pagos: { total: pagos.reduce((s: number, l: any) => s + Number(l.valor), 0), quantidade: pagos.length },
          vendas_digitais: {
            total_bruto: totalVendasBruto,
            total_liquido: totalVendasLiquido,
            total_taxas: totalVendasTaxas,
            quantidade: vendasAprovadas.length,
            todas_vendas: (vendas || []).length,
          },
          contas_bancarias: contas || [],
          saldo_total_contas: saldoTotal,
        };
        break;
      }

      // ─── LANÇAMENTOS (RECEITAS E DESPESAS) ───
      case "lancamentos": {
        const { inicio, fim } = getDateRange(periodo);
        let query = supabase
          .from("lancamentos")
          .select("*, categoria:categoria_id(nome), cliente:cliente_id(nome), fornecedor:fornecedor_id(nome), conta_bancaria:conta_bancaria_id(nome), forma_pagamento:forma_pagamento_id(descricao), projeto:projeto_id(nome)")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim)
          .order("data_vencimento", { ascending: false });

        if (filters?.tipo) query = query.eq("tipo", filters.tipo);
        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.categoria_id) query = query.eq("categoria_id", filters.categoria_id);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }

      // ─── DESPESAS PENDENTES ───
      case "despesas-pendentes": {
        let query = supabase
          .from("lancamentos")
          .select("descricao, valor, data_vencimento, categoria:categoria_id(nome), fornecedor:fornecedor_id(nome)")
          .eq("empresa_id", empresa_id)
          .eq("tipo", "despesa")
          .eq("status", "pendente");

        // Aplicar filtro de datas se fornecido
        if (data_inicio_custom || data_fim_custom || periodo) {
          const { inicio, fim } = getDateRange(periodo);
          query = query.gte("data_vencimento", inicio).lte("data_vencimento", fim);
        }

        query = query.order("data_vencimento", { ascending: true }).limit(filters?.limit || 20);
        const { data } = await query;
        result = data;
        break;
      }

      // ─── RECEITAS PENDENTES ───
      case "receitas-pendentes": {
        let query = supabase
          .from("lancamentos")
          .select("descricao, valor, data_vencimento, categoria:categoria_id(nome), cliente:cliente_id(nome)")
          .eq("empresa_id", empresa_id)
          .eq("tipo", "receita")
          .eq("status", "pendente");

        // Aplicar filtro de datas se fornecido
        if (data_inicio_custom || data_fim_custom || periodo) {
          const { inicio, fim } = getDateRange(periodo);
          query = query.gte("data_vencimento", inicio).lte("data_vencimento", fim);
        }

        query = query.order("data_vencimento", { ascending: true }).limit(filters?.limit || 20);
        const { data } = await query;
        result = data;
        break;
      }

      // ─── RESUMO POR CATEGORIAS ───
      case "resumo-categorias": {
        const { inicio, fim } = getDateRange(periodo);

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, categoria:categoria_id(nome)")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim);

        const categorias: Record<string, { receitas: number; despesas: number }> = {};
        (lancamentos || []).forEach((l: any) => {
          const cat = l.categoria?.nome || "Sem categoria";
          if (!categorias[cat]) categorias[cat] = { receitas: 0, despesas: 0 };
          if (l.tipo === "receita") categorias[cat].receitas += Number(l.valor);
          else categorias[cat].despesas += Number(l.valor);
        });

        result = Object.entries(categorias).map(([nome, vals]) => ({ categoria: nome, ...vals }));
        break;
      }

      // ─── VENDAS DIGITAIS ───
      case "vendas-digitais": {
        const { inicio, fim } = getDateRange(periodo);
        let query = supabase
          .from("vendas_digitais")
          .select("*")
          .eq("empresa_id", empresa_id)
          .gte("data_venda", inicio)
          .lte("data_venda", fim)
          .order("data_venda", { ascending: false });

        if (filters?.plataforma) query = query.ilike("plataforma", filters.plataforma);
        if (filters?.status) query = query.ilike("status", filters.status);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data, error } = await query;
        if (error) throw error;

        const totalBruto = (data || []).reduce((s: number, v: any) => s + Number(v.valor_bruto), 0);
        const totalLiquido = (data || []).reduce((s: number, v: any) => s + Number(v.valor_liquido), 0);
        const totalTaxas = (data || []).reduce((s: number, v: any) => s + Number(v.taxa), 0);

        result = {
          vendas: data,
          resumo: { total_bruto: totalBruto, total_liquido: totalLiquido, total_taxas: totalTaxas, quantidade: (data || []).length },
        };
        break;
      }

      // ─── RECEBIMENTOS DIGITAIS ───
      case "recebimentos-digitais": {
        const { data: vendas } = await supabase
          .from("vendas_digitais")
          .select("id")
          .eq("empresa_id", empresa_id);

        const vendaIds = (vendas || []).map((v: any) => v.id);

        if (vendaIds.length > 0) {
          let query = supabase
            .from("recebimentos_digitais")
            .select("*, venda:venda_id(produto, plataforma, cliente)")
            .in("venda_id", vendaIds);

          // Aplicar filtro de datas se fornecido
          if (data_inicio_custom || data_fim_custom || periodo) {
            const { inicio, fim } = getDateRange(periodo);
            query = query.gte("data_prevista", inicio).lte("data_prevista", fim);
          }

          query = query.order("data_prevista", { ascending: true });
          if (filters?.status) query = query.eq("status", filters.status);
          if (filters?.limit) query = query.limit(filters.limit);

          const { data } = await query;
          result = data;
        } else {
          result = [];
        }
        break;
      }

      // ─── CONTAS BANCÁRIAS ───
      case "contas-bancarias": {
        let query = supabase
          .from("contas_bancarias")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.search) {
          query = query.or(`nome.ilike.%${filters.search}%,banco.ilike.%${filters.search}%`);
        }
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── CLIENTES ───
      case "clientes": {
        let query = supabase
          .from("clientes")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.ativo !== undefined) query = query.eq("ativo", filters.ativo);
        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── FORNECEDORES ───
      case "fornecedores": {
        let query = supabase
          .from("fornecedores")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.ativo !== undefined) query = query.eq("ativo", filters.ativo);
        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── PROJETOS ───
      case "projetos": {
        let query = supabase
          .from("projetos")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("created_at", { ascending: false });

        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── CATEGORIAS ───
      case "categorias": {
        let query = supabase
          .from("categorias")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.tipo) query = query.eq("tipo", filters.tipo);
        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }

      // ─── FORMAS DE PAGAMENTO ───
      case "formas-pagamento": {
        let query = supabase
          .from("formas_pagamento")
          .select("*")
          .eq("empresa_id", empresa_id)
          .order("descricao", { ascending: true });

        if (filters?.search) query = query.ilike("descricao", `%${filters.search}%`);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data } = await query;
        result = data;
        break;
      }


      // ─── FLUXO DE CAIXA (comparativo mensal) ───
      case "fluxo-caixa": {
        const { inicio, fim } = getDateRange(periodo || "semestre");

        const { data: lancamentos } = await supabase
          .from("lancamentos")
          .select("tipo, valor, data_vencimento")
          .eq("empresa_id", empresa_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim);

        const meses: Record<string, { receitas: number; despesas: number }> = {};
        (lancamentos || []).forEach((l: any) => {
          const mes = l.data_vencimento?.slice(0, 7); // YYYY-MM
          if (!meses[mes]) meses[mes] = { receitas: 0, despesas: 0 };
          if (l.tipo === "receita") meses[mes].receitas += Number(l.valor);
          else meses[mes].despesas += Number(l.valor);
        });

        result = Object.entries(meses)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mes, vals]) => ({ mes, ...vals, saldo: vals.receitas - vals.despesas }));
        break;
      }

      // ─── CRIAR LANÇAMENTO (RECEITA OU DESPESA) — com resolução automática de dependências ───
      case "criar-lancamento": {
        const descricao = normalizeText(sanitize(body.descricao), "descricao");
        const valor = body.valor;
        const tipo = sanitize(body.tipo);
        let status_lanc = sanitize(body.status);
        const data_vencimento = sanitize(body.data_vencimento);
        const projeto_id = sanitize(body.projeto_id);
        const data_pagamento = sanitize(body.data_pagamento);

        // Campos que podem vir como UUID ou como nome para resolução automática
        let categoria_id = sanitize(body.categoria_id);
        let cliente_id = sanitize(body.cliente_id);
        let fornecedor_id = sanitize(body.fornecedor_id);
        let conta_bancaria_id = sanitize(body.conta_bancaria_id);
        let forma_pagamento_id = sanitize(body.forma_pagamento_id);

        // Nomes para buscar/criar automaticamente (normalizar para Title Case pt-BR)
        const categoria_nome = normalizeText(sanitize(body.categoria_nome), "nome");
        const cliente_nome = normalizeText(sanitize(body.cliente_nome), "nome");
        const cliente_cpf_cnpj = sanitize(body.cliente_cpf_cnpj);
        const fornecedor_nome = normalizeText(sanitize(body.fornecedor_nome), "nome");
        const fornecedor_cpf_cnpj = sanitize(body.fornecedor_cpf_cnpj);
        const conta_bancaria_nome = normalizeText(sanitize(body.conta_bancaria_nome), "nome");
        const conta_bancaria_banco = sanitize(body.conta_bancaria_banco);
        const conta_bancaria_agencia = sanitize(body.conta_bancaria_agencia);
        const conta_bancaria_conta = sanitize(body.conta_bancaria_conta);
        const forma_pagamento_nome = normalizeText(sanitize(body.forma_pagamento_nome), "descricao");

        if (!descricao || valor === undefined || valor === null) {
          return new Response(JSON.stringify({ error: "descricao and valor are required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!tipo || !["receita", "despesa"].includes(tipo)) {
          return new Response(JSON.stringify({ 
            error: "Tipo obrigatório", 
            message: "O campo 'tipo' é obrigatório e deve ser 'receita' ou 'despesa'. Pergunte ao usuário qual o tipo do lançamento." 
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (!data_vencimento) {
          return new Response(JSON.stringify({ error: "data_vencimento is required (YYYY-MM-DD)" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ── Helper: buscar por nome ou criar se não existir ──
        const resolveOrCreate = async (
          table: string, nameField: string, nameValue: string, extraInsert: Record<string, any> = {}
        ): Promise<string | null> => {
          if (!nameValue) return null;
          // Buscar existente por nome (ilike)
          const { data: existing } = await supabase
            .from(table)
            .select("id")
            .eq("empresa_id", empresa_id)
            .ilike(nameField, nameValue.trim())
            .limit(1)
            .maybeSingle();
          if (existing) return existing.id;
          // Criar novo
          const insertPayload: any = { empresa_id, [nameField]: nameValue.trim(), ...extraInsert };
          const { data: created } = await supabase.from(table).insert(insertPayload).select("id").single();
          return created?.id || null;
        };

        const registros_criados: Record<string, any> = {};

        // ── Resolver categoria ──
        if (!categoria_id && categoria_nome) {
          const catId = await resolveOrCreate("categorias", "nome", categoria_nome, { tipo });
          if (catId) { categoria_id = catId; registros_criados.categoria = { id: catId, nome: categoria_nome }; }
        }

        // ── Resolver cliente (para receita) ──
        if (!cliente_id && cliente_nome && tipo === "receita") {
          const extraCliente: Record<string, any> = { origem: "n8n" };
          if (cliente_cpf_cnpj) extraCliente.cpf_cnpj = cliente_cpf_cnpj;
          const cliId = await resolveOrCreate("clientes", "nome", cliente_nome, extraCliente);
          if (cliId) { cliente_id = cliId; registros_criados.cliente = { id: cliId, nome: cliente_nome, cpf_cnpj: cliente_cpf_cnpj || null }; }
        }

        // ── Resolver fornecedor (para despesa) ──
        if (!fornecedor_id && fornecedor_nome && tipo === "despesa") {
          const extraFornecedor: Record<string, any> = {};
          if (fornecedor_cpf_cnpj) extraFornecedor.cpf_cnpj = fornecedor_cpf_cnpj;
          const forId = await resolveOrCreate("fornecedores", "nome", fornecedor_nome, extraFornecedor);
          if (forId) { fornecedor_id = forId; registros_criados.fornecedor = { id: forId, nome: fornecedor_nome, cpf_cnpj: fornecedor_cpf_cnpj || null }; }
        }

        // ── Resolver conta bancária (buscar por nome OU banco) ──
        if (!conta_bancaria_id && conta_bancaria_nome) {
          // Primeiro buscar por nome
          const { data: cbByNome } = await supabase
            .from("contas_bancarias")
            .select("id")
            .eq("empresa_id", empresa_id)
            .ilike("nome", conta_bancaria_nome.trim())
            .limit(1)
            .maybeSingle();
          if (cbByNome) {
            conta_bancaria_id = cbByNome.id;
            registros_criados.conta_bancaria = { id: cbByNome.id, nome: conta_bancaria_nome, encontrado_por: "nome" };
          } else {
            // Buscar por campo banco
            const { data: cbByBanco } = await supabase
              .from("contas_bancarias")
              .select("id, nome")
              .eq("empresa_id", empresa_id)
              .ilike("banco", conta_bancaria_nome.trim())
              .limit(1)
              .maybeSingle();
            if (cbByBanco) {
              conta_bancaria_id = cbByBanco.id;
              registros_criados.conta_bancaria = { id: cbByBanco.id, nome: cbByBanco.nome, encontrado_por: "banco" };
            } else {
              // Criar nova conta bancária com dados extras se disponíveis
              const insertData: any = { empresa_id, nome: conta_bancaria_nome.trim(), saldo_inicial: 0, saldo_atual: 0, principal: false };
              if (conta_bancaria_agencia) insertData.agencia = conta_bancaria_agencia;
              if (conta_bancaria_conta) insertData.conta = conta_bancaria_conta;
              // Use conta_bancaria_banco if provided, otherwise detect from name
              if (conta_bancaria_banco) {
                insertData.banco = conta_bancaria_banco.trim();
              } else {
                const bancos = ["santander", "itaú", "itau", "bradesco", "nubank", "inter", "caixa", "bb", "banco do brasil", "sicoob", "sicredi", "c6", "original", "safra", "btg"];
                if (bancos.some(b => conta_bancaria_nome.trim().toLowerCase().includes(b))) {
                  insertData.banco = conta_bancaria_nome.trim();
                }
              }
              const { data: created } = await supabase.from("contas_bancarias")
                .insert(insertData)
                .select("id").single();
              if (created) {
                conta_bancaria_id = created.id;
                registros_criados.conta_bancaria = { id: created.id, nome: conta_bancaria_nome, criado: true, agencia: conta_bancaria_agencia || null, conta: conta_bancaria_conta || null };
              }
            }
          }
        }

        // ── Resolver forma de pagamento ──
        if (!forma_pagamento_id && forma_pagamento_nome) {
          const fpId = await resolveOrCreate("formas_pagamento", "descricao", forma_pagamento_nome);
          if (fpId) { forma_pagamento_id = fpId; registros_criados.forma_pagamento = { id: fpId, descricao: forma_pagamento_nome }; }
        }

        // ── Fallback para conta bancária: principal ou única ──
        if (!conta_bancaria_id) {
          const { data: allContas } = await supabase
            .from("contas_bancarias")
            .select("id, nome, principal")
            .eq("empresa_id", empresa_id);
          const contas = allContas || [];
          const principal = contas.find((c: any) => c.principal);
          if (principal) {
            conta_bancaria_id = principal.id;
            registros_criados.conta_bancaria_fallback = { id: principal.id, nome: principal.nome, motivo: "conta_principal" };
          } else if (contas.length === 1) {
            conta_bancaria_id = contas[0].id;
            registros_criados.conta_bancaria_fallback = { id: contas[0].id, nome: contas[0].nome, motivo: "unica_conta" };
          }
          // Se múltiplas contas e nenhuma principal, conta_bancaria_id permanece null
        }

        // Verificar se a empresa é pessoal (dispensa cliente/fornecedor)
        const { data: empresaInfo } = await supabase
          .from("empresas")
          .select("pessoal")
          .eq("id", empresa_id)
          .single();
        const isPessoal = empresaInfo?.pessoal === true;

        // Validação condicional: receita exige cliente, despesa exige fornecedor (exceto pessoal)
        const camposObrigatorios: { campo: string; valor: string | null; label: string }[] = [
          { campo: "categoria_id", valor: categoria_id, label: "Categoria (envie categoria_id ou categoria_nome)" },
          { campo: "forma_pagamento_id", valor: forma_pagamento_id, label: "Forma de Pagamento (envie forma_pagamento_id ou forma_pagamento_nome)" },
          { campo: "conta_bancaria_id", valor: conta_bancaria_id, label: "Conta Bancária (envie conta_bancaria_id ou conta_bancaria_nome)" },
        ];

        if (!isPessoal) {
          if (tipo === "receita") {
            camposObrigatorios.push({ campo: "cliente_id", valor: cliente_id, label: "Cliente (envie cliente_id ou cliente_nome)" });
          } else {
            camposObrigatorios.push({ campo: "fornecedor_id", valor: fornecedor_id, label: "Fornecedor (envie fornecedor_id ou fornecedor_nome)" });
          }
        }

        const faltando = camposObrigatorios.filter(c => !c.valor).map(c => c.label);
        if (faltando.length > 0) {
          return new Response(JSON.stringify({ 
            error: "Campos obrigatórios não informados", 
            message: `Para criar um lançamento do tipo '${tipo}', informe: ${faltando.join(", ")}. Você pode enviar o UUID (_id) ou o nome (_nome) — se o nome não existir, será cadastrado automaticamente.`,
            campos_faltando: faltando 
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ── Auto-definir status quando data_pagamento é informada ──
        if (!status_lanc) {
          if (data_pagamento) {
            status_lanc = tipo === "receita" ? "recebido" : "pago";
          } else {
            status_lanc = "pendente";
          }
        }

        // Parse valor: handle Brazilian format "3.000,00" → 3000.00
        // Also handle plain number like 500 or 500.00 (already numeric)
        let valorNumerico: number;
        if (typeof valor === "number") {
          valorNumerico = valor;
        } else if (typeof valor === "string") {
          const trimmed = valor.replace(/[R$\s]/g, "").trim();
          // Detect format: if has both dot and comma, it's Brazilian "3.000,00"
          // If has only comma, it could be "500,00" (Brazilian decimal)
          // If has only dot, it could be "500.00" (standard decimal) or "3.000" (Brazilian thousands)
          const hasDot = trimmed.includes(".");
          const hasComma = trimmed.includes(",");
          if (hasComma) {
            // Brazilian format: dots are thousands separators, comma is decimal
            const cleaned = trimmed.replace(/\./g, "").replace(",", ".");
            valorNumerico = parseFloat(cleaned);
          } else if (hasDot) {
            // Check if dot is thousands separator (e.g. "3.000") or decimal (e.g. "500.00")
            const parts = trimmed.split(".");
            if (parts.length === 2 && parts[1].length === 3) {
              // "3.000" → thousands separator, no decimals
              valorNumerico = parseFloat(trimmed.replace(/\./g, ""));
            } else {
              // "500.00" → standard decimal
              valorNumerico = parseFloat(trimmed);
            }
          } else {
            valorNumerico = parseFloat(trimmed);
          }
        } else {
          valorNumerico = Number(valor);
        }
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
          return new Response(JSON.stringify({ error: "Valor inválido", message: "O campo 'valor' deve ser um número positivo. Exemplo: 3000.00 ou '3.000,00'" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ── Recorrência e parcelamento ──
        const recorrente = body.recorrente === true || body.recorrente === "true";
        const recorrencia_tipo = sanitize(body.recorrencia_tipo) || "mensal";
        const recorrencia_inicio = sanitize(body.recorrencia_inicio);
        const recorrencia_fim = sanitize(body.recorrencia_fim);
        const total_parcelas_raw = body.total_parcelas;
        const totalParcelas = total_parcelas_raw ? parseInt(String(total_parcelas_raw)) : null;

        if (recorrente && totalParcelas && totalParcelas > 1) {
          return new Response(JSON.stringify({ 
            error: "Recorrente e parcelado são mutuamente exclusivos",
            message: "Envie recorrente=true OU total_parcelas, não ambos."
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // ── Parcelamento: dividir valor em N parcelas ──
        if (!recorrente && totalParcelas && totalParcelas > 1) {
          const valorParcela = Math.round((valorNumerico / totalParcelas) * 100) / 100;
          const baseDate = new Date(data_vencimento);
          const parcelas = Array.from({ length: totalParcelas }, (_, i) => {
            const d = new Date(baseDate);
            d.setMonth(d.getMonth() + i);
            return {
              empresa_id,
              descricao: `${descricao} (${i + 1}/${totalParcelas})`,
              valor: valorParcela,
              tipo,
              status: status_lanc,
              data_vencimento: d.toISOString().split("T")[0],
              origem: "n8n",
              parcela_atual: i + 1,
              total_parcelas: totalParcelas,
              recorrente: false,
              ...(categoria_id ? { categoria_id } : {}),
              ...(cliente_id ? { cliente_id } : {}),
              ...(fornecedor_id ? { fornecedor_id } : {}),
              ...(conta_bancaria_id ? { conta_bancaria_id } : {}),
              ...(forma_pagamento_id ? { forma_pagamento_id } : {}),
              ...(projeto_id ? { projeto_id } : {}),
              ...(i === 0 && data_pagamento ? { data_pagamento } : {}),
            };
          });

          const { data: newLancs, error: insertError } = await supabase
            .from("lancamentos")
            .insert(parcelas)
            .select("*");

          if (insertError) throw insertError;

          result = {
            parcelas_criadas: totalParcelas,
            valor_parcela: valorParcela,
            valor_total: valorNumerico,
            lancamentos: newLancs,
            ...(Object.keys(registros_criados).length > 0 ? { registros_criados } : {}),
          };
          break;
        }

        // ── Único ou Recorrente ──
        const insertData: any = {
          empresa_id,
          descricao,
          valor: valorNumerico,
          tipo,
          status: status_lanc,
          data_vencimento: recorrente && recorrencia_inicio ? recorrencia_inicio : data_vencimento,
          origem: "n8n",
        };
        if (categoria_id) insertData.categoria_id = categoria_id;
        if (cliente_id) insertData.cliente_id = cliente_id;
        if (fornecedor_id) insertData.fornecedor_id = fornecedor_id;
        if (conta_bancaria_id) insertData.conta_bancaria_id = conta_bancaria_id;
        if (forma_pagamento_id) insertData.forma_pagamento_id = forma_pagamento_id;
        if (projeto_id) insertData.projeto_id = projeto_id;
        if (data_pagamento) insertData.data_pagamento = data_pagamento;

        if (recorrente) {
          insertData.recorrente = true;
          insertData.recorrencia_tipo = recorrencia_tipo;
          insertData.recorrencia_grupo_id = crypto.randomUUID();
          if (recorrencia_fim) insertData.recorrencia_fim = recorrencia_fim;
        }

        const { data: newLanc, error: insertError } = await supabase
          .from("lancamentos")
          .insert(insertData)
          .select("*")
          .single();

        if (insertError) throw insertError;

        // ── Atualizar saldo da conta bancária ──
        if (conta_bancaria_id && ["pago", "recebido"].includes(status_lanc || "")) {
          const delta = tipo === "receita" ? valorNumerico : -valorNumerico;
          const { data: contaAtual } = await supabase
            .from("contas_bancarias")
            .select("saldo_atual")
            .eq("id", conta_bancaria_id)
            .single();
          if (contaAtual) {
            const novoSaldo = Number(contaAtual.saldo_atual) + delta;
            await supabase
              .from("contas_bancarias")
              .update({ saldo_atual: novoSaldo })
              .eq("id", conta_bancaria_id);
          }
        }

        // ── Se recorrente, chamar generate-recurring para criar ocorrências futuras ──
        if (recorrente) {
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
            // Use service role to call generate-recurring internally
            const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            // Note: generate-recurring requires user auth, so we skip auto-generation here
            // The user can trigger it from the UI or via cron
          } catch (e) {
            console.warn("Could not trigger generate-recurring:", e);
          }
        }

        result = {
          lancamento: newLanc,
          ...(recorrente ? { recorrente: true, recorrencia_tipo, recorrencia_grupo_id: insertData.recorrencia_grupo_id } : {}),
          ...(Object.keys(registros_criados).length > 0 ? { registros_criados } : {}),
        };
        break;
      }

      // ─── ATUALIZAR TELEGRAM ID DO USUÁRIO ───
      case "atualizar-telegram-id": {
        const telegram_id = sanitize(body.telegram_id);
        const target_user_id = sanitize(body.user_id) || sanitize(user_id);
        const target_email = sanitize(body.email);

        if (!telegram_id) {
          return new Response(JSON.stringify({ error: "telegram_id is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!target_user_id && !target_email) {
          return new Response(JSON.stringify({ error: "user_id or email is required to identify the user" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let updateQuery = supabase
          .from("perfis")
          .update({ telegram_id: String(telegram_id) });

        if (target_user_id) {
          updateQuery = updateQuery.eq("id", target_user_id);
        } else if (target_email) {
          updateQuery = updateQuery.ilike("email", target_email.trim().toLowerCase());
        }

        const { data: updatedPerfil, error: updateError } = await updateQuery
          .select("id, nome, email, telegram_id")
          .single();

        if (updateError) throw updateError;
        result = updatedPerfil;
        break;
      }

      // ─── ATUALIZAR TELEGRAM ID DO CLIENTE ───
      case "atualizar-telegram-cliente": {
        const telegram_id = sanitize(body.telegram_id);
        const cliente_id_target = sanitize(body.cliente_id);
        const cliente_email = sanitize(body.email);
        const cliente_telefone = sanitize(body.telefone);

        if (!telegram_id) {
          return new Response(JSON.stringify({ error: "telegram_id is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!cliente_id_target && !cliente_email && !cliente_telefone) {
          return new Response(JSON.stringify({ error: "cliente_id, email or telefone is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let clienteQuery = supabase
          .from("clientes")
          .update({ telegram_id: String(telegram_id) })
          .eq("empresa_id", empresa_id);

        if (cliente_id_target) {
          clienteQuery = clienteQuery.eq("id", cliente_id_target);
        } else if (cliente_email) {
          clienteQuery = clienteQuery.ilike("email", cliente_email.trim().toLowerCase());
        } else if (cliente_telefone) {
          clienteQuery = clienteQuery.ilike("telefone", `%${cliente_telefone.replace(/\D/g, "")}%`);
        }

        const { data: updatedCliente, error: clienteError } = await clienteQuery
          .select("id, nome, email, telefone, telegram_id")
          .single();

        if (clienteError) throw clienteError;
        result = updatedCliente;
        break;
      }

      // ─── CRIAR CLIENTE ───
      case "criar-cliente": {
        const nome = normalizeText(sanitize(body.nome), "nome");
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verificar duplicata
        const { data: cliExist } = await supabase.from("clientes").select("id, nome").eq("empresa_id", empresa_id).ilike("nome", nome.trim()).maybeSingle();
        if (cliExist) {
          return new Response(JSON.stringify({ error: "Registro duplicado", message: `Já existe um cliente com o nome "${nome}".`, registro_existente: cliExist }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const clienteData: any = {
          empresa_id,
          nome,
          origem: "manual",
          ativo: body.ativo !== undefined ? body.ativo : true,
        };
        const cli_cpf_cnpj = sanitize(body.cpf_cnpj);
        const cli_telefone = sanitize(body.telefone);
        const cli_email = sanitize(body.email);
        const cli_cep = sanitize(body.cep);
        const cli_rua = normalizeText(sanitize(body.rua), "endereco");
        const cli_numero = sanitize(body.numero);
        const cli_complemento = normalizeText(sanitize(body.complemento), "endereco");
        const cli_bairro = normalizeText(sanitize(body.bairro), "nome");
        const cli_cidade = normalizeText(sanitize(body.cidade), "nome");
        const cli_estado = normalizeText(sanitize(body.estado), "estado");
        if (cli_cpf_cnpj) clienteData.cpf_cnpj = cli_cpf_cnpj;
        if (cli_telefone) clienteData.telefone = cli_telefone;
        if (cli_email) clienteData.email = cli_email;
        if (cli_cep) clienteData.cep = cli_cep;
        if (cli_rua) clienteData.rua = cli_rua;
        if (cli_numero) clienteData.numero = cli_numero;
        if (cli_complemento) clienteData.complemento = cli_complemento;
        if (cli_bairro) clienteData.bairro = cli_bairro;
        if (cli_cidade) clienteData.cidade = cli_cidade;
        if (cli_estado) clienteData.estado = cli_estado;

        const { data: newCli, error: cliError } = await supabase
          .from("clientes").insert(clienteData).select("*").single();
        if (cliError) throw cliError;
        result = newCli;
        break;
      }

      // ─── CRIAR FORNECEDOR ───
      case "criar-fornecedor": {
        const nome = normalizeText(sanitize(body.nome), "nome");
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verificar duplicata
        const { data: fornExist } = await supabase.from("fornecedores").select("id, nome").eq("empresa_id", empresa_id).ilike("nome", nome.trim()).maybeSingle();
        if (fornExist) {
          return new Response(JSON.stringify({ error: "Registro duplicado", message: `Já existe um fornecedor com o nome "${nome}".`, registro_existente: fornExist }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const fornecedorData: any = {
          empresa_id,
          nome,
          ativo: body.ativo !== undefined ? body.ativo : true,
        };
        const cpf_cnpj = sanitize(body.cpf_cnpj);
        const telefone = sanitize(body.telefone);
        const email_forn = sanitize(body.email);
        const cep = sanitize(body.cep);
        const rua = normalizeText(sanitize(body.rua), "endereco");
        const numero = sanitize(body.numero);
        const complemento = normalizeText(sanitize(body.complemento), "endereco");
        const bairro = normalizeText(sanitize(body.bairro), "nome");
        const cidade = normalizeText(sanitize(body.cidade), "nome");
        const estado = normalizeText(sanitize(body.estado), "estado");
        if (cpf_cnpj) fornecedorData.cpf_cnpj = cpf_cnpj;
        if (telefone) fornecedorData.telefone = telefone;
        if (email_forn) fornecedorData.email = email_forn;
        if (cep) fornecedorData.cep = cep;
        if (rua) fornecedorData.rua = rua;
        if (numero) fornecedorData.numero = numero;
        if (complemento) fornecedorData.complemento = complemento;
        if (bairro) fornecedorData.bairro = bairro;
        if (cidade) fornecedorData.cidade = cidade;
        if (estado) fornecedorData.estado = estado;

        const { data: newForn, error: fornError } = await supabase
          .from("fornecedores").insert(fornecedorData).select("*").single();
        if (fornError) throw fornError;
        result = newForn;
        break;
      }

      // ─── CRIAR CATEGORIA ───
      case "criar-categoria": {
        const nome = normalizeText(sanitize(body.nome), "nome");
        const tipo = sanitize(body.tipo) || "despesa";
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!["receita", "despesa", "investimento"].includes(tipo)) {
          return new Response(JSON.stringify({ error: "tipo must be receita, despesa or investimento" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verificar duplicata
        const { data: catExist } = await supabase.from("categorias").select("id, nome, tipo").eq("empresa_id", empresa_id).ilike("nome", nome.trim()).eq("tipo", tipo).maybeSingle();
        if (catExist) {
          return new Response(JSON.stringify({ error: "Registro duplicado", message: `Já existe uma categoria "${nome}" do tipo "${tipo}".`, registro_existente: catExist }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: newCat, error: catError } = await supabase
          .from("categorias").insert({ empresa_id, nome, tipo }).select("*").single();
        if (catError) throw catError;
        result = newCat;
        break;
      }

      // ─── CRIAR CONTA BANCÁRIA ───
      case "criar-conta-bancaria": {
        const nome = normalizeText(sanitize(body.nome), "nome");
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verificar duplicata
        const { data: cbExist } = await supabase.from("contas_bancarias").select("id, nome").eq("empresa_id", empresa_id).ilike("nome", nome.trim()).maybeSingle();
        if (cbExist) {
          return new Response(JSON.stringify({ error: "Registro duplicado", message: `Já existe uma conta bancária com o nome "${nome}".`, registro_existente: cbExist }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const contaData: any = {
          empresa_id,
          nome,
          principal: body.principal === true,
          saldo_inicial: Number(body.saldo_inicial) || 0,
          saldo_atual: Number(body.saldo_inicial) || 0,
        };
        const banco = sanitize(body.banco);
        const agencia = sanitize(body.agencia);
        const conta = sanitize(body.conta);
        if (banco) contaData.banco = normalizeText(banco, "nome");
        if (agencia) contaData.agencia = agencia;
        if (conta) contaData.conta = conta;

        if (contaData.principal) {
          await supabase.from("contas_bancarias").update({ principal: false }).eq("empresa_id", empresa_id).eq("principal", true);
        }
        const { data: newConta, error: contaError } = await supabase
          .from("contas_bancarias").insert(contaData).select("*").single();
        if (contaError) throw contaError;
        result = newConta;
        break;
      }

      // ─── CRIAR FORMA DE PAGAMENTO ───
      case "criar-forma-pagamento": {
        const descricao = normalizeText(sanitize(body.descricao), "descricao");
        if (!descricao) {
          return new Response(JSON.stringify({ error: "descricao is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verificar duplicata
        const { data: fpExist } = await supabase.from("formas_pagamento").select("id, descricao").eq("empresa_id", empresa_id).ilike("descricao", descricao.trim()).maybeSingle();
        if (fpExist) {
          return new Response(JSON.stringify({ error: "Registro duplicado", message: `Já existe uma forma de pagamento "${descricao}".`, registro_existente: fpExist }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: newForma, error: formaError } = await supabase
          .from("formas_pagamento").insert({ empresa_id, descricao }).select("*").single();
        if (formaError) throw formaError;
        result = newForma;
        break;
      }

      // ─── CRIAR PROJETO ───
      case "criar-projeto": {
        const nome = normalizeText(sanitize(body.nome), "nome");
        if (!nome) {
          return new Response(JSON.stringify({ error: "nome is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verificar duplicata
        const { data: projExist } = await supabase.from("projetos").select("id, nome").eq("empresa_id", empresa_id).ilike("nome", nome.trim()).maybeSingle();
        if (projExist) {
          return new Response(JSON.stringify({ error: "Registro duplicado", message: `Já existe um projeto com o nome "${nome}".`, registro_existente: projExist }), {
            status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const projetoData: any = {
          empresa_id,
          nome,
          status: sanitize(body.status) || "ativo",
          orcamento: Number(body.orcamento) || 0,
        };
        const descricaoPrj = sanitize(body.descricao);
        if (descricaoPrj) projetoData.descricao = descricaoPrj;

        const { data: newProj, error: projError } = await supabase
          .from("projetos").insert(projetoData).select("*").single();
        if (projError) throw projError;
        result = newProj;
        break;
      }

      // ─── LISTAR ANÚNCIOS (INTEGRAÇÕES DE ADS) ───
      case "listar-anuncios": {
        const { data: integracoes } = await supabase
          .from("integracoes")
          .select("*")
          .eq("empresa_id", empresa_id)
          .in("plataforma", ["meta_ads", "google_ads", "facebook_ads"]);

        // Check last sync status for each integration from logs
        const { data: lastLogs } = await supabase
          .from("logs_integracoes")
          .select("plataforma, status, payload, created_at")
          .eq("empresa_id", empresa_id)
          .eq("evento", "sync_ads_data")
          .order("created_at", { ascending: false })
          .limit(10);

        const errosPorPlataforma: Record<string, string> = {};
        for (const integ of integracoes || []) {
          const lastLog = (lastLogs || []).find((l: any) => l.plataforma === integ.plataforma);
          if (lastLog && (lastLog.status === "error" || lastLog.status === "erro")) {
            errosPorPlataforma[integ.plataforma] = (lastLog.payload as any)?.error || "Erro de conexão desconhecido";
          }
        }

        // Also get vendas_digitais as ads performance proxy
        const { inicio, fim } = getDateRange(periodo);
        const { data: vendas } = await supabase
          .from("vendas_digitais")
          .select("*")
          .eq("empresa_id", empresa_id)
          .gte("data_venda", inicio)
          .lte("data_venda", fim);

        if (filters?.plataforma) {
          const plat = filters.plataforma.toLowerCase();
          result = {
            integracoes: (integracoes || []).filter((i: any) => i.plataforma.toLowerCase().includes(plat)),
            vendas_por_plataforma: (vendas || []).filter((v: any) => v.plataforma.toLowerCase().includes(plat)),
          };
        } else {
          result = {
            integracoes: integracoes || [],
            vendas_por_plataforma: vendas || [],
          };
        }

        // Add connection status per integration
        result.integracoes = (result.integracoes || []).map((i: any) => ({
          plataforma: i.plataforma,
          ativo: i.ativo,
          ambiente: i.ambiente,
          erro: errosPorPlataforma[i.plataforma] || null,
          status_conexao: errosPorPlataforma[i.plataforma] ? "erro" : "ok",
        }));

        const totalInvestido = (result.vendas_por_plataforma || []).reduce((s: number, v: any) => s + Number(v.taxa || 0), 0);
        const totalReceita = (result.vendas_por_plataforma || []).reduce((s: number, v: any) => s + Number(v.valor_bruto || 0), 0);
        
        const errosAtivos = Object.entries(errosPorPlataforma);
        result.resumo = {
          total_integracoes: (result.integracoes || []).length,
          total_vendas: (result.vendas_por_plataforma || []).length,
          total_investido: totalInvestido,
          total_receita: totalReceita,
          roas: totalInvestido > 0 ? (totalReceita / totalInvestido).toFixed(2) : null,
          erros_conexao: errosAtivos.length > 0
            ? errosAtivos.map(([plat, erro]) => `${plat}: ${erro}`).join("; ")
            : null,
        };
        break;
      }

      // ─── LISTAR USUÁRIOS DA EMPRESA ───
      case "listar-usuarios": {
        let query = supabase
          .from("perfis")
          .select("id, nome, email, permissao, created_at, empresa_id, foto_url, telegram_id, evolution_webhook_url")
          .eq("empresa_id", empresa_id)
          .order("nome", { ascending: true });

        if (filters?.search) query = query.ilike("nome", `%${filters.search}%`);
        if (filters?.permissao) query = query.eq("permissao", filters.permissao);
        if (filters?.limit) query = query.limit(filters.limit);

        const { data: perfis } = await query;

        // Fetch roles for these users
        const userIds = (perfis || []).map((p: any) => p.id);
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("empresa_id", empresa_id)
          .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

        result = (perfis || []).map((p: any) => ({
          ...p,
          role: (roles || []).find((r: any) => r.user_id === p.id)?.role || "leitura",
        }));
        break;
      }

      // ─── HELPER: CHECK VINCULATION WITH PAID/RECEIVED LANCAMENTOS ───
      // Used by edit/delete actions to block changes on records linked to settled lancamentos

      // ─── EDITAR CLIENTE ───
      case "editar-cliente": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        // Check if client was added automatically
        const { data: cliOrigem } = await supabase.from("clientes").select("origem").eq("id", id).eq("empresa_id", empresa_id).single();
        if (cliOrigem && cliOrigem.origem !== "manual") {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este cliente foi adicionado automaticamente (via integração) e não pode ser editado. Solicite a alteração via suporte." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Check vinculation - allow safe fields even with paid lancamentos
        const { data: vincCliente } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("cliente_id", id).in("status", ["pago", "recebido"]).limit(1);
        const hasVincCliente = vincCliente && vincCliente.length > 0;
        // Safe fields: nome, contato e endereço não impactam lançamentos (referenciados por ID)
        const safeFieldsCliente = ["nome", "email", "telefone", "cpf_cnpj", "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado"];

        const updateData: any = {};
        const textNormFields: Record<string, "nome" | "descricao" | "endereco" | "estado"> = {
          nome: "nome", rua: "endereco", complemento: "endereco", bairro: "nome", cidade: "nome", estado: "estado",
        };
        const fields = ["nome", "email", "telefone", "cpf_cnpj", "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado", "ativo"];
        for (const f of fields) {
          const v = sanitize(body[f]);
          if (v !== undefined) {
            // If has vinculation, only allow safe fields
            if (hasVincCliente && !safeFieldsCliente.includes(f)) continue;
            if (f === "ativo") updateData[f] = body[f] === true || body[f] === "true";
            else if (textNormFields[f]) updateData[f] = normalizeText(v, textNormFields[f]);
            else updateData[f] = v;
          }
        }
        if (Object.keys(updateData).length === 0) {
          if (hasVincCliente) {
            return new Response(JSON.stringify({ error: "Bloqueado", message: "Os campos solicitados não podem ser alterados pois o cliente possui lançamentos pagos/recebidos. Apenas dados descritivos (nome, contato, endereço) podem ser editados." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: updCli, error: updCliErr } = await supabase.from("clientes").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updCliErr) throw updCliErr;
        result = { ...updCli, ...(hasVincCliente ? { aviso: "Cliente com lançamentos vinculados — apenas campos descritivos foram atualizados." } : {}) };
        break;
      }

      // ─── EDITAR FORNECEDOR ───
      case "editar-fornecedor": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: vincForn } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("fornecedor_id", id).in("status", ["pago", "recebido"]).limit(1);
        const hasVincForn = vincForn && vincForn.length > 0;
        const safeFieldsForn = ["nome", "email", "telefone", "cpf_cnpj", "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado"];

        const updateData: any = {};
        const textNormFields: Record<string, "nome" | "descricao" | "endereco" | "estado"> = {
          nome: "nome", rua: "endereco", complemento: "endereco", bairro: "nome", cidade: "nome", estado: "estado",
        };
        const fields = ["nome", "email", "telefone", "cpf_cnpj", "cep", "rua", "numero", "complemento", "bairro", "cidade", "estado", "ativo"];
        for (const f of fields) {
          const v = sanitize(body[f]);
          if (v !== undefined) {
            if (hasVincForn && !safeFieldsForn.includes(f)) continue;
            if (f === "ativo") updateData[f] = body[f] === true || body[f] === "true";
            else if (textNormFields[f]) updateData[f] = normalizeText(v, textNormFields[f]);
            else updateData[f] = v;
          }
        }
        if (Object.keys(updateData).length === 0) {
          if (hasVincForn) {
            return new Response(JSON.stringify({ error: "Bloqueado", message: "Os campos solicitados não podem ser alterados pois o fornecedor possui lançamentos pagos/recebidos. Apenas dados descritivos (nome, contato, endereço) podem ser editados." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: updForn, error: updFornErr } = await supabase.from("fornecedores").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updFornErr) throw updFornErr;
        result = { ...updForn, ...(hasVincForn ? { aviso: "Fornecedor com lançamentos vinculados — apenas campos descritivos foram atualizados." } : {}) };
        break;
      }

      // ─── EDITAR CATEGORIA ───
      case "editar-categoria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: vincCat } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("categoria_id", id).in("status", ["pago", "recebido"]).limit(1);
        const hasVincCat = vincCat && vincCat.length > 0;

        const updateData: any = {};
        // Nome é seguro (lançamentos referenciam por ID). Tipo é bloqueado se vinculado (impacta relatórios).
        if (sanitize(body.nome)) updateData.nome = normalizeText(sanitize(body.nome), "nome");
        if (sanitize(body.tipo)) {
          if (hasVincCat) {
            // Tipo bloqueado quando vinculado - não adiciona ao update silenciosamente
          } else {
            updateData.tipo = sanitize(body.tipo);
          }
        }
        if (Object.keys(updateData).length === 0) {
          if (hasVincCat) {
            return new Response(JSON.stringify({ error: "Bloqueado", message: "O campo 'tipo' não pode ser alterado pois a categoria possui lançamentos pagos/recebidos. Apenas o nome pode ser editado." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: updCat, error: updCatErr } = await supabase.from("categorias").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updCatErr) throw updCatErr;
        result = { ...updCat, ...(hasVincCat ? { aviso: "Categoria com lançamentos vinculados — apenas o nome foi atualizado." } : {}) };
        break;
      }

      // ─── EDITAR CONTA BANCÁRIA ───
      case "editar-conta-bancaria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: vincConta } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("conta_bancaria_id", id).in("status", ["pago", "recebido"]).limit(1);
        const hasVincConta = vincConta && vincConta.length > 0;
        // Campos seguros: nome, banco, agência, conta não impactam lançamentos. saldo_atual e principal podem impactar.
        const safeFieldsConta = ["nome", "banco", "agencia", "conta"];

        const updateData: any = {};
        const fields = ["nome", "banco", "agencia", "conta", "principal"];
        for (const f of fields) {
          const v = sanitize(body[f]);
          if (v !== undefined) {
            if (hasVincConta && !safeFieldsConta.includes(f)) continue;
            if (f === "principal") updateData[f] = body[f] === true || body[f] === "true";
            else if (f === "nome" || f === "banco") updateData[f] = normalizeText(v, "nome");
            else updateData[f] = v;
          }
        }
        if (!hasVincConta && body.saldo_atual !== undefined && sanitize(body.saldo_atual) !== undefined) {
          updateData.saldo_atual = Number(body.saldo_atual);
        }
        if (Object.keys(updateData).length === 0) {
          if (hasVincConta) {
            return new Response(JSON.stringify({ error: "Bloqueado", message: "Os campos solicitados não podem ser alterados pois a conta possui lançamentos pagos/recebidos. Apenas dados descritivos (nome, banco, agência, conta) podem ser editados." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (updateData.principal === true) {
          await supabase.from("contas_bancarias").update({ principal: false }).eq("empresa_id", empresa_id).eq("principal", true).neq("id", id);
        }

        const { data: updConta, error: updContaErr } = await supabase.from("contas_bancarias").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updContaErr) throw updContaErr;
        result = { ...updConta, ...(hasVincConta ? { aviso: "Conta com lançamentos vinculados — apenas campos descritivos foram atualizados." } : {}) };
        break;
      }

      // ─── EDITAR FORMA DE PAGAMENTO ───
      case "editar-forma-pagamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        // Descrição é segura — lançamentos referenciam por ID, não pelo nome
        const descricao = normalizeText(sanitize(body.descricao), "descricao");
        if (!descricao) return new Response(JSON.stringify({ error: "descricao is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updForma, error: updFormaErr } = await supabase.from("formas_pagamento").update({ descricao }).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updFormaErr) throw updFormaErr;
        result = updForma;
        break;
      }

      // ─── EDITAR PROJETO ───
      case "editar-projeto": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const updateData: any = {};
        if (sanitize(body.nome)) updateData.nome = normalizeText(sanitize(body.nome), "nome");
        if (sanitize(body.descricao)) updateData.descricao = normalizeText(sanitize(body.descricao), "descricao");
        if (sanitize(body.status)) updateData.status = sanitize(body.status);
        if (body.orcamento !== undefined && sanitize(body.orcamento) !== undefined) updateData.orcamento = Number(body.orcamento);
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updProj, error: updProjErr } = await supabase.from("projetos").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updProjErr) throw updProjErr;
        result = updProj;
        break;
      }

      // ─── EDITAR LANÇAMENTO ───
      case "editar-lancamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        const { data: lancExist } = await supabase.from("lancamentos").select("id, status, origem, recorrencia_grupo_id, recorrente").eq("id", id).eq("empresa_id", empresa_id).maybeSingle();
        if (!lancExist) return new Response(JSON.stringify({ error: "Lançamento não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        if (["pago", "recebido"].includes(lancExist.status)) {
          return new Response(JSON.stringify({ 
            error: "Bloqueado", 
            message: `Este lançamento já foi ${lancExist.status} e não pode ser alterado via n8n/chat. Para editar registros pagos ou recebidos, acesse diretamente o sistema web.`,
          }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const isRecorrente = !!(lancExist as any).recorrencia_grupo_id;
        const blockedInRecorrente = ["descricao", "tipo"];
        const fields = ["descricao", "tipo", "status", "data_vencimento", "data_pagamento", "categoria_id", "cliente_id", "fornecedor_id", "conta_bancaria_id", "forma_pagamento_id", "projeto_id"];

        const updateData: any = {};
        
        for (const f of fields) {
          const v = sanitize(body[f]);
          if (v !== undefined) {
            if (isRecorrente && blockedInRecorrente.includes(f)) continue;
            updateData[f] = f === "descricao" ? normalizeText(v, "descricao") : v;
          }
        }
        if (body.valor !== undefined && sanitize(body.valor) !== undefined) updateData.valor = Number(body.valor);
        
        // Handle recurrence fields
        const recorrenteFlag = sanitize(body.recorrente);
        if (recorrenteFlag === "true" || recorrenteFlag === true) {
          if (!isRecorrente) {
            updateData.recorrente = true;
            const recTipo = sanitize(body.recorrencia_tipo);
            if (recTipo && ["semanal", "quinzenal", "mensal", "trimestral", "anual"].includes(recTipo)) {
              updateData.recorrencia_tipo = recTipo;
            } else {
              updateData.recorrencia_tipo = "mensal";
            }
            const recInicio = sanitize(body.recorrencia_inicio);
            if (recInicio) updateData.data_vencimento = recInicio;
          }
        }
        
        const recFim = sanitize(body.recorrencia_fim);
        if (recFim !== undefined) {
          updateData.recorrencia_fim = recFim || null;
        }
        
        if (Object.keys(updateData).length === 0) return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: updLanc, error: updLancErr } = await supabase.from("lancamentos").update(updateData).eq("id", id).eq("empresa_id", empresa_id).select("*").single();
        if (updLancErr) throw updLancErr;
        result = updLanc;
        break;
      }

      // ─── EXCLUIR CLIENTE ───
      case "excluir-cliente": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        
        // Check if client was added automatically
        const { data: cliDelOrigem } = await supabase.from("clientes").select("origem").eq("id", id).eq("empresa_id", empresa_id).single();
        if (cliDelOrigem && cliDelOrigem.origem !== "manual") {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este cliente foi adicionado automaticamente (via integração) e não pode ser excluído. Solicite a exclusão via suporte." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: vincDelCli } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("cliente_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelCli && vincDelCli.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este cliente possui lançamentos pagos/recebidos vinculados e não pode ser excluído." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delCliErr } = await supabase.from("clientes").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delCliErr) throw delCliErr;
        result = { message: "Cliente excluído com sucesso", id };
        break;
      }

      // ─── EXCLUIR FORNECEDOR ───
      case "excluir-fornecedor": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelForn } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("fornecedor_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelForn && vincDelForn.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este fornecedor possui lançamentos pagos/recebidos vinculados e não pode ser excluído." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delFornErr } = await supabase.from("fornecedores").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delFornErr) throw delFornErr;
        result = { message: "Fornecedor excluído com sucesso", id };
        break;
      }

      // ─── EXCLUIR CATEGORIA ───
      case "excluir-categoria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelCat } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("categoria_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelCat && vincDelCat.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta categoria possui lançamentos pagos/recebidos vinculados e não pode ser excluída." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delCatErr } = await supabase.from("categorias").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delCatErr) throw delCatErr;
        result = { message: "Categoria excluída com sucesso", id };
        break;
      }

      // ─── EXCLUIR CONTA BANCÁRIA ───
      case "excluir-conta-bancaria": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelConta } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("conta_bancaria_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelConta && vincDelConta.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta conta bancária possui lançamentos pagos/recebidos vinculados e não pode ser excluída." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delContaErr } = await supabase.from("contas_bancarias").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delContaErr) throw delContaErr;
        result = { message: "Conta bancária excluída com sucesso", id };
        break;
      }

      // ─── EXCLUIR FORMA DE PAGAMENTO ───
      case "excluir-forma-pagamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: vincDelForma } = await supabase.from("lancamentos").select("id").eq("empresa_id", empresa_id).eq("forma_pagamento_id", id).in("status", ["pago", "recebido"]).limit(1);
        if (vincDelForma && vincDelForma.length > 0) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta forma de pagamento possui lançamentos pagos/recebidos vinculados e não pode ser excluída." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error: delFormaErr } = await supabase.from("formas_pagamento").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delFormaErr) throw delFormaErr;
        result = { message: "Forma de pagamento excluída com sucesso", id };
        break;
      }

      // ─── EXCLUIR PROJETO ───
      case "excluir-projeto": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error: delProjErr } = await supabase.from("projetos").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delProjErr) throw delProjErr;
        result = { message: "Projeto excluído com sucesso", id };
        break;
      }

      // ─── EXCLUIR LANÇAMENTO ───
      case "excluir-lancamento": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data: lancDel } = await supabase.from("lancamentos").select("id, status, recorrencia_grupo_id, recorrente").eq("id", id).eq("empresa_id", empresa_id).maybeSingle();
        if (!lancDel) return new Response(JSON.stringify({ error: "Lançamento não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (["pago", "recebido"].includes(lancDel.status)) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Este lançamento já foi pago/recebido e não pode ser excluído." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const excluirCadeia = sanitize(body.excluir_cadeia);
        const shouldDeleteChain = excluirCadeia === true || excluirCadeia === "true";

        if (shouldDeleteChain && lancDel.recorrencia_grupo_id) {
          // Excluir todas as ocorrências pendentes da cadeia recorrente
          const { data: cadeiaItems } = await supabase
            .from("lancamentos")
            .select("id, status")
            .eq("empresa_id", empresa_id)
            .eq("recorrencia_grupo_id", lancDel.recorrencia_grupo_id)
            .in("status", ["pendente"]);

          const idsToDelete = (cadeiaItems || []).map((l: any) => l.id);

          if (idsToDelete.length > 0) {
            const { error: delCadeiaErr } = await supabase
              .from("lancamentos")
              .delete()
              .eq("empresa_id", empresa_id)
              .in("id", idsToDelete);
            if (delCadeiaErr) throw delCadeiaErr;
          }

          result = {
            message: `Cadeia recorrente: ${idsToDelete.length} lançamento(s) pendente(s) excluído(s) com sucesso`,
            ids_excluidos: idsToDelete,
            recorrencia_grupo_id: lancDel.recorrencia_grupo_id,
          };
        } else {
          // Excluir apenas esta ocorrência
          const { error: delLancErr } = await supabase.from("lancamentos").delete().eq("id", id).eq("empresa_id", empresa_id);
          if (delLancErr) throw delLancErr;
          result = { message: "Lançamento excluído com sucesso", id };
        }
        break;
      }

      // ─── EXTRATO DE CONTA BANCÁRIA ───
      case "extrato-conta": {
        const conta_id = sanitize(body.conta_bancaria_id);
        const conta_nome = normalizeText(sanitize(body.conta_bancaria_nome), "nome");
        let target_conta_id = conta_id;

        // Resolver por nome se não tiver ID
        if (!target_conta_id && conta_nome) {
          const { data: cb } = await supabase
            .from("contas_bancarias")
            .select("id")
            .eq("empresa_id", empresa_id)
            .ilike("nome", conta_nome.trim())
            .limit(1)
            .maybeSingle();
          if (cb) target_conta_id = cb.id;
          else {
            // Buscar por banco
            const { data: cbBanco } = await supabase
              .from("contas_bancarias")
              .select("id")
              .eq("empresa_id", empresa_id)
              .ilike("banco", conta_nome.trim())
              .limit(1)
              .maybeSingle();
            if (cbBanco) target_conta_id = cbBanco.id;
          }
        }

        // Se nenhuma conta especificada, usar principal ou única
        if (!target_conta_id) {
          const { data: allContas } = await supabase
            .from("contas_bancarias")
            .select("id, nome, principal")
            .eq("empresa_id", empresa_id);
          const contas = allContas || [];
          const principal = contas.find((c: any) => c.principal);
          if (principal) target_conta_id = principal.id;
          else if (contas.length === 1) target_conta_id = contas[0].id;
          else {
            return new Response(JSON.stringify({ error: "Conta não identificada", message: "Informe conta_bancaria_id ou conta_bancaria_nome. Há múltiplas contas sem principal definida.", contas_disponiveis: contas.map((c: any) => ({ id: c.id, nome: c.nome })) }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        const { inicio, fim } = getDateRange(periodo);

        // Dados da conta
        const { data: contaInfo } = await supabase
          .from("contas_bancarias")
          .select("*")
          .eq("id", target_conta_id)
          .eq("empresa_id", empresa_id)
          .single();

        // Lançamentos da conta no período
        const { data: lancExtrato } = await supabase
          .from("lancamentos")
          .select("id, descricao, valor, tipo, status, data_vencimento, data_pagamento, categoria:categoria_id(nome), cliente:cliente_id(nome), fornecedor:fornecedor_id(nome)")
          .eq("empresa_id", empresa_id)
          .eq("conta_bancaria_id", target_conta_id)
          .gte("data_vencimento", inicio)
          .lte("data_vencimento", fim)
          .order("data_vencimento", { ascending: false });

        const movimentacoes = lancExtrato || [];
        const totalEntradas = movimentacoes.filter((l: any) => l.tipo === "receita").reduce((s: number, l: any) => s + Number(l.valor), 0);
        const totalSaidas = movimentacoes.filter((l: any) => l.tipo === "despesa").reduce((s: number, l: any) => s + Number(l.valor), 0);

        result = {
          conta: contaInfo,
          periodo: { inicio, fim },
          resumo: {
            total_entradas: totalEntradas,
            total_saidas: totalSaidas,
            saldo_periodo: totalEntradas - totalSaidas,
            total_movimentacoes: movimentacoes.length,
          },
          movimentacoes,
        };
        break;
      }

      // ─── TRANSFERÊNCIA ENTRE CONTAS ───
      case "transferir-entre-contas": {
        const conta_origem_id = sanitize(body.conta_origem_id);
        const conta_destino_id = sanitize(body.conta_destino_id);
        const conta_origem_nome = normalizeText(sanitize(body.conta_origem_nome), "nome");
        const conta_destino_nome = normalizeText(sanitize(body.conta_destino_nome), "nome");
        const valor_transf = body.valor;
        const descricao_transf = normalizeText(sanitize(body.descricao), "descricao") || "Transferência entre contas";

        if (!valor_transf || Number(valor_transf) <= 0) {
          return new Response(JSON.stringify({ error: "valor é obrigatório e deve ser positivo" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const valorTransf = Number(valor_transf);

        // Resolver contas por nome
        const resolveContaId = async (id: string | undefined, nome: string | undefined): Promise<string | null> => {
          if (id) return id;
          if (!nome) return null;
          const { data: cb } = await supabase.from("contas_bancarias").select("id").eq("empresa_id", empresa_id).ilike("nome", nome.trim()).limit(1).maybeSingle();
          if (cb) return cb.id;
          const { data: cbBanco } = await supabase.from("contas_bancarias").select("id").eq("empresa_id", empresa_id).ilike("banco", nome.trim()).limit(1).maybeSingle();
          return cbBanco?.id || null;
        };

        const origemId = await resolveContaId(conta_origem_id, conta_origem_nome);
        const destinoId = await resolveContaId(conta_destino_id, conta_destino_nome);

        if (!origemId || !destinoId) {
          return new Response(JSON.stringify({ error: "Contas não identificadas", message: "Informe conta_origem e conta_destino (por ID ou nome)." }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (origemId === destinoId) {
          return new Response(JSON.stringify({ error: "Conta origem e destino não podem ser iguais" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Buscar saldos atuais
        const { data: contaOrigem } = await supabase.from("contas_bancarias").select("id, nome, saldo_atual").eq("id", origemId).single();
        const { data: contaDestino } = await supabase.from("contas_bancarias").select("id, nome, saldo_atual").eq("id", destinoId).single();

        if (!contaOrigem || !contaDestino) {
          return new Response(JSON.stringify({ error: "Conta não encontrada" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Atualizar saldos
        const novoSaldoOrigem = Number(contaOrigem.saldo_atual) - valorTransf;
        const novoSaldoDestino = Number(contaDestino.saldo_atual) + valorTransf;

        await supabase.from("contas_bancarias").update({ saldo_atual: novoSaldoOrigem }).eq("id", origemId);
        await supabase.from("contas_bancarias").update({ saldo_atual: novoSaldoDestino }).eq("id", destinoId);

        // Criar 2 lançamentos: saída da origem e entrada no destino
        const dataHoje = getBrazilDate();
        const dataStr = `${dataHoje.getFullYear()}-${String(dataHoje.getMonth() + 1).padStart(2, "0")}-${String(dataHoje.getDate()).padStart(2, "0")}`;

        const { data: lancSaida } = await supabase.from("lancamentos").insert({
          empresa_id, descricao: `${descricao_transf} → ${contaDestino.nome}`, valor: valorTransf,
          tipo: "despesa", status: "pago", data_vencimento: dataStr, data_pagamento: dataStr,
          conta_bancaria_id: origemId, origem: "transferencia",
        }).select("id").single();

        const { data: lancEntrada } = await supabase.from("lancamentos").insert({
          empresa_id, descricao: `${descricao_transf} ← ${contaOrigem.nome}`, valor: valorTransf,
          tipo: "receita", status: "recebido", data_vencimento: dataStr, data_pagamento: dataStr,
          conta_bancaria_id: destinoId, origem: "transferencia",
        }).select("id").single();

        result = {
          transferencia: {
            origem: { id: origemId, nome: contaOrigem.nome, saldo_anterior: Number(contaOrigem.saldo_atual), saldo_novo: novoSaldoOrigem },
            destino: { id: destinoId, nome: contaDestino.nome, saldo_anterior: Number(contaDestino.saldo_atual), saldo_novo: novoSaldoDestino },
            valor: valorTransf,
            descricao: descricao_transf,
            lancamento_saida_id: lancSaida?.id,
            lancamento_entrada_id: lancEntrada?.id,
          },
        };
        break;
      }

      // ─── CRIAR VENDA DIGITAL ───
      case "criar-venda": {
        const plataforma = sanitize(body.plataforma);
        const valor_bruto_raw = body.valor_bruto;
        
        if (!plataforma) {
          return new Response(JSON.stringify({ error: "plataforma é obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (valor_bruto_raw === undefined || valor_bruto_raw === null || valor_bruto_raw === "") {
          return new Response(JSON.stringify({ error: "valor_bruto é obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const valor_bruto = Number(valor_bruto_raw);
        if (isNaN(valor_bruto) || valor_bruto <= 0) {
          return new Response(JSON.stringify({ error: "valor_bruto deve ser um número positivo" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const taxa_venda = sanitize(body.taxa) !== undefined ? Number(body.taxa) : 0;
        const valor_liquido_raw = sanitize(body.valor_liquido);
        const valor_liquido = valor_liquido_raw ? Number(valor_liquido_raw) : valor_bruto - (isNaN(taxa_venda) ? 0 : taxa_venda);

        const vendaInsert: any = {
          empresa_id,
          plataforma: plataforma.toLowerCase(),
          valor_bruto,
          taxa: isNaN(taxa_venda) ? 0 : taxa_venda,
          valor_liquido,
          status: sanitize(body.status) || "aprovada",
          origem: "manual",
        };

        const produto = normalizeText(sanitize(body.produto), "nome");
        const cliente_venda = normalizeText(sanitize(body.cliente), "nome");
        const cliente_email_v = sanitize(body.cliente_email);
        const cliente_telefone_v = sanitize(body.cliente_telefone);
        const cliente_documento_v = sanitize(body.cliente_documento);
        const cliente_endereco_v = sanitize(body.cliente_endereco);
        const data_venda = sanitize(body.data_venda);
        const observacoes_v = sanitize(body.observacoes);

        if (produto) vendaInsert.produto = produto;
        if (cliente_venda) vendaInsert.cliente = cliente_venda;
        if (cliente_email_v) vendaInsert.cliente_email = cliente_email_v;
        if (cliente_telefone_v) vendaInsert.cliente_telefone = cliente_telefone_v;
        if (cliente_documento_v) vendaInsert.cliente_documento = cliente_documento_v;
        if (cliente_endereco_v) vendaInsert.cliente_endereco = cliente_endereco_v;
        if (data_venda) vendaInsert.data_venda = data_venda;
        if (observacoes_v) vendaInsert.observacoes = observacoes_v;

        // Vincular a cliente existente por nome/documento se possível
        if (cliente_venda) {
          let clienteQuery = supabase.from("clientes").select("id").eq("empresa_id", empresa_id);
          if (cliente_documento_v) {
            clienteQuery = clienteQuery.eq("cpf_cnpj", cliente_documento_v);
          } else {
            clienteQuery = clienteQuery.ilike("nome", cliente_venda.trim());
          }
          const { data: clienteExist } = await clienteQuery.limit(1).maybeSingle();
          if (clienteExist) vendaInsert.cliente_id = clienteExist.id;
        }

        const { data: newVenda, error: vendaErr } = await supabase
          .from("vendas_digitais")
          .insert(vendaInsert)
          .select("*")
          .single();

        if (vendaErr) throw vendaErr;

        // Emissão de NF se solicitado
        let nfResult: any = null;
        const emitirNf = body.emitir_nota_fiscal === true || body.emitir_nota_fiscal === "true";
        if (emitirNf) {
          // Validar pré-requisitos fiscais da empresa
          const { data: empresaFiscal } = await supabase
            .from("empresas")
            .select("fiscal_configurado, certificado_digital_url")
            .eq("id", empresa_id)
            .single();

          const fiscalMissing: string[] = [];
          if (!empresaFiscal?.fiscal_configurado) fiscalMissing.push("Configuração fiscal da empresa não concluída");
          if (!empresaFiscal?.certificado_digital_url) fiscalMissing.push("Certificado digital (A1 .pfx) não enviado");

          if (fiscalMissing.length > 0) {
            nfResult = {
              emissao: "bloqueada",
              motivo: `Pré-requisitos fiscais não atendidos: ${fiscalMissing.join("; ")}. Acesse o sistema em Configurações da Empresa → Configuração Fiscal para atualizar os dados.`,
            };
          } else {
          // Validar campos obrigatórios para NF
          const nfCamposFaltando: string[] = [];
          if (!cliente_venda) nfCamposFaltando.push("cliente");
          if (!cliente_documento_v) nfCamposFaltando.push("cliente_documento");
          if (!produto) nfCamposFaltando.push("produto");
          if (!valor_bruto) nfCamposFaltando.push("valor_bruto");

          if (nfCamposFaltando.length > 0) {
            nfResult = { emissao: "bloqueada", motivo: `Campos obrigatórios para NF ausentes: ${nfCamposFaltando.join(", ")}` };
          } else {
            // Verificar permissão de emissão de NF
            const { data: nfPerm } = await supabase
              .from("permissoes")
              .select("pode_incluir")
              .eq("perfis_id", user_id)
              .eq("tela", "emissao_nf")
              .maybeSingle();

            const { data: userRoleNf } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user_id)
              .eq("empresa_id", empresa_id)
              .maybeSingle();
            const isAdminNf = userRoleNf?.role === "admin" || userRoleNf?.role === "super_admin";

            if (!isAdminNf && !nfPerm?.pode_incluir) {
              nfResult = { emissao: "bloqueada", motivo: "Sem permissão para emitir nota fiscal" };
            } else {
              // Disparar emissão via spedy-emit
              try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
                const emitResp = await fetch(`${supabaseUrl}/functions/v1/spedy-emit`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ venda_id: newVenda.id }),
                });
                const emitData = await emitResp.json();
                nfResult = { emissao: emitResp.ok ? "solicitada" : "erro", detalhes: emitData };
              } catch (nfErr: any) {
                nfResult = { emissao: "erro", motivo: nfErr.message };
              }
            }
          }
          } // close fiscal else
        }

        result = {
          venda: newVenda,
          ...(nfResult ? { nota_fiscal: nfResult } : {}),
        };
        break;
      }

      // ─── EDITAR VENDA DIGITAL ───
      case "editar-venda": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        // Verificar se a venda existe e é manual
        const { data: vendaExist } = await supabase
          .from("vendas_digitais")
          .select("id, origem, invoice_status, lancamento_id")
          .eq("id", id)
          .eq("empresa_id", empresa_id)
          .maybeSingle();

        if (!vendaExist) return new Response(JSON.stringify({ error: "Venda não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (vendaExist.origem !== "manual") {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Vendas de origem automática (webhook/integração) não podem ser editadas." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Check if linked lancamento is pago/recebido
        let lancamentoPago = false;
        if (vendaExist.lancamento_id) {
          const { data: lancVinc } = await supabase.from("lancamentos").select("status").eq("id", vendaExist.lancamento_id).maybeSingle();
          if (lancVinc && ["pago", "recebido"].includes(lancVinc.status)) lancamentoPago = true;
        }

        // Safe fields: descriptive, no financial impact
        const vendaSafeFields = ["produto", "cliente", "cliente_email", "cliente_telefone", "cliente_documento", "cliente_endereco", "observacoes"];
        // Financial fields: blocked when lancamento is pago/recebido
        const vendaFinancialFields = ["plataforma", "status", "data_venda"];

        const updateVenda: any = {};
        const vendaBlockedFields: string[] = [];

        for (const f of [...vendaSafeFields, ...vendaFinancialFields]) {
          const v = sanitize(body[f]);
          if (v !== undefined) {
            if (lancamentoPago && vendaFinancialFields.includes(f)) { vendaBlockedFields.push(f); continue; }
            updateVenda[f] = (f === "produto" || f === "cliente") ? normalizeText(v, "nome") : v;
          }
        }

        // Financial values: blocked when lancamento pago/recebido
        if (body.valor_bruto !== undefined && sanitize(body.valor_bruto) !== undefined) {
          if (lancamentoPago) { vendaBlockedFields.push("valor_bruto"); } else { updateVenda.valor_bruto = Number(body.valor_bruto); }
        }
        if (body.taxa !== undefined && sanitize(body.taxa) !== undefined) {
          if (lancamentoPago) { vendaBlockedFields.push("taxa"); } else { updateVenda.taxa = Number(body.taxa); }
        }
        if (body.valor_liquido !== undefined && sanitize(body.valor_liquido) !== undefined) {
          if (lancamentoPago) { vendaBlockedFields.push("valor_liquido"); } else { updateVenda.valor_liquido = Number(body.valor_liquido); }
        }

        // Auto-calcular valor_liquido se valor_bruto ou taxa mudaram
        if ((updateVenda.valor_bruto !== undefined || updateVenda.taxa !== undefined) && updateVenda.valor_liquido === undefined) {
          const { data: vendaAtual } = await supabase.from("vendas_digitais").select("valor_bruto, taxa").eq("id", id).single();
          if (vendaAtual) {
            const vb = updateVenda.valor_bruto ?? Number(vendaAtual.valor_bruto);
            const tx = updateVenda.taxa ?? Number(vendaAtual.taxa);
            updateVenda.valor_liquido = vb - tx;
          }
        }

        if (Object.keys(updateVenda).length === 0) {
          if (vendaBlockedFields.length > 0) {
            return new Response(JSON.stringify({ 
              error: "Bloqueado", 
              message: `Os campos [${vendaBlockedFields.join(", ")}] não podem ser alterados pois o lançamento vinculado já foi pago/recebido. Apenas campos descritivos (produto, cliente, observações) podem ser editados.`,
              campos_bloqueados: vendaBlockedFields,
            }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify({ error: "Nenhum campo para atualizar" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: updVenda, error: updVendaErr } = await supabase
          .from("vendas_digitais")
          .update(updateVenda)
          .eq("id", id)
          .eq("empresa_id", empresa_id)
          .select("*")
          .single();

        if (updVendaErr) throw updVendaErr;

        // Emissão de NF se solicitado
        let nfEditResult: any = null;
        const emitirNfEdit = body.emitir_nota_fiscal === true || body.emitir_nota_fiscal === "true";
        if (emitirNfEdit) {
          // Validar pré-requisitos fiscais da empresa
          const { data: empresaFiscalEdit } = await supabase
            .from("empresas")
            .select("fiscal_configurado, certificado_digital_url")
            .eq("id", empresa_id)
            .single();

          const fiscalMissingEdit: string[] = [];
          if (!empresaFiscalEdit?.fiscal_configurado) fiscalMissingEdit.push("Configuração fiscal da empresa não concluída");
          if (!empresaFiscalEdit?.certificado_digital_url) fiscalMissingEdit.push("Certificado digital (A1 .pfx) não enviado");

          if (fiscalMissingEdit.length > 0) {
            nfEditResult = {
              emissao: "bloqueada",
              motivo: `Pré-requisitos fiscais não atendidos: ${fiscalMissingEdit.join("; ")}. Acesse o sistema em Configurações da Empresa → Configuração Fiscal para atualizar os dados.`,
            };
          } else {
          const nfCampos: string[] = [];
          if (!updVenda.cliente) nfCampos.push("cliente");
          if (!updVenda.cliente_documento) nfCampos.push("cliente_documento");
          if (!updVenda.produto) nfCampos.push("produto");
          if (!updVenda.valor_bruto || Number(updVenda.valor_bruto) <= 0) nfCampos.push("valor_bruto");

          if (nfCampos.length > 0) {
            nfEditResult = { emissao: "bloqueada", motivo: `Campos obrigatórios para NF ausentes: ${nfCampos.join(", ")}` };
          } else {
            try {
              const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
              const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
              const emitResp = await fetch(`${supabaseUrl}/functions/v1/spedy-emit`, {
                method: "POST",
                headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ venda_id: updVenda.id }),
              });
              const emitData = await emitResp.json();
              nfEditResult = { emissao: emitResp.ok ? "solicitada" : "erro", detalhes: emitData };
            } catch (nfErr: any) {
              nfEditResult = { emissao: "erro", motivo: nfErr.message };
            }
          }
          } // close fiscal else
        }

        result = {
          venda: updVenda,
          ...(nfEditResult ? { nota_fiscal: nfEditResult } : {}),
          ...(vendaBlockedFields.length > 0 ? { _aviso: `Campos bloqueados por integridade (lançamento pago/recebido): ${vendaBlockedFields.join(", ")}. Apenas campos descritivos foram atualizados.`, campos_bloqueados: vendaBlockedFields } : {}),
        };
        break;
      }

      // ─── EXCLUIR VENDA DIGITAL ───
      case "excluir-venda": {
        const id = sanitize(body.id);
        if (!id) return new Response(JSON.stringify({ error: "id é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const { data: vendaDel } = await supabase
          .from("vendas_digitais")
          .select("id, origem, lancamento_id, invoice_status")
          .eq("id", id)
          .eq("empresa_id", empresa_id)
          .maybeSingle();

        if (!vendaDel) return new Response(JSON.stringify({ error: "Venda não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (vendaDel.origem !== "manual") {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Vendas de origem automática não podem ser excluídas." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (vendaDel.invoice_status && ["ISSUED", "AUTHORIZED"].includes(vendaDel.invoice_status)) {
          return new Response(JSON.stringify({ error: "Bloqueado", message: "Esta venda possui nota fiscal emitida/autorizada. Cancele a NF antes de excluir." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Excluir recebimentos vinculados
        await supabase.from("recebimentos_digitais").delete().eq("venda_id", id);

        // Excluir lançamento vinculado se existir
        if (vendaDel.lancamento_id) {
          await supabase.from("lancamentos").delete().eq("id", vendaDel.lancamento_id).eq("empresa_id", empresa_id);
        }

        const { error: delVendaErr } = await supabase.from("vendas_digitais").delete().eq("id", id).eq("empresa_id", empresa_id);
        if (delVendaErr) throw delVendaErr;

        result = { message: "Venda excluída com sucesso", id, lancamento_excluido: vendaDel.lancamento_id || null };
        break;
      }

      default:
        return new Response(JSON.stringify({
          error: "Invalid action",
          available_actions: [
            "resumo-financeiro", "lancamentos", "despesas-pendentes", "receitas-pendentes",
            "resumo-categorias", "vendas-digitais", "recebimentos-digitais", "contas-bancarias",
            "clientes", "fornecedores", "projetos", "categorias", "formas-pagamento", "fluxo-caixa",
            "criar-lancamento", "criar-cliente", "criar-fornecedor", "criar-categoria", "criar-conta-bancaria",
            "criar-forma-pagamento", "criar-projeto", "criar-venda",
            "atualizar-telegram-id", "atualizar-telegram-cliente",
            "listar-anuncios", "listar-usuarios",
            "editar-cliente", "editar-fornecedor", "editar-categoria", "editar-conta-bancaria",
            "editar-forma-pagamento", "editar-projeto", "editar-lancamento", "editar-venda",
            "excluir-cliente", "excluir-fornecedor", "excluir-categoria", "excluir-conta-bancaria",
            "excluir-forma-pagamento", "excluir-projeto", "excluir-lancamento", "excluir-venda",
            "extrato-conta", "transferir-entre-contas"
          ],
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const duration = Date.now() - new Date(requestTimestamp).getTime();
    const responseLog = {
      timestamp: new Date().toISOString(),
      action,
      empresa_id,
      duration_ms: duration,
      result_type: Array.isArray(result) ? "array" : typeof result,
      result_count: Array.isArray(result) ? result.length : (result && typeof result === "object" ? Object.keys(result).length : null),
      status: 200,
    };
    console.log("📤 [n8n-query] RESPONSE:", JSON.stringify(responseLog, null, 2));

    // Salvar log no banco (somente se logs habilitados)
    try {
      const { data: empLogConfig } = await supabase.from("empresas").select("logs_enabled").eq("id", empresa_id).single();
      if (empLogConfig?.logs_enabled !== false) {
        await supabase.from("logs_integracoes").insert({
          empresa_id,
          plataforma: "n8n-query",
          evento: action,
          status: "sucesso",
          payload: {
            request: { action, periodo, filters, user_id },
            response: { duration_ms: duration, result_count: responseLog.result_count },
            endpoint: `${supabaseUrl}/functions/v1/n8n-query`,
            format: { method: "POST", content_type: "application/json", body_schema: { action: "string", empresa_id: "uuid", periodo: "string?", filters: "object?" } },
          },
        });
      }
    } catch (logErr) {
      console.warn("⚠️ [n8n-query] Falha ao salvar log:", logErr);
    }

    return new Response(JSON.stringify({ success: true, action, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [n8n-query] ERROR:", error);

    // Tentar salvar log de erro (somente se logs habilitados)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sbLog = createClient(supabaseUrl, serviceRoleKey);
      const eid = empresa_id || "00000000-0000-0000-0000-000000000000";
      const { data: empErrLogConfig } = await sbLog.from("empresas").select("logs_enabled").eq("id", eid).single();
      if (empErrLogConfig?.logs_enabled !== false) {
        await sbLog.from("logs_integracoes").insert({
          empresa_id: eid,
          plataforma: "n8n-query",
          evento: action || "unknown",
          status: "erro",
          payload: { error: error.message, stack: error.stack?.substring(0, 500), request: { action, empresa_id, user_id, periodo, filters } },
        });
      }
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
