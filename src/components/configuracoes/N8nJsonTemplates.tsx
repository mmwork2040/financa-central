import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, Search, Plus, Trash2, Code2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActionTemplate {
  action: string;
  toolName: string;
  label: string;
  description: string;
  category: string;
  schema: Record<string, any>;
  body: Record<string, any>;
}

const endpoint = `\${SUPABASE_URL}/functions/v1/n8n-query`;

const DEFAULT_TEMPLATES: ActionTemplate[] = [
  {
    action: "resumo-financeiro",
    toolName: "resumo_financeiro",
    label: "Resumo Financeiro",
    description: "Visão geral: receitas, despesas, saldo, vendas digitais e contas bancárias",
    category: "Resumos",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        periodo: { type: "string", description: "semana, mes, trimestre, semestre ou ano" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "resumo-financeiro",
      empresa_id: "{{ $json.empresa_id }}",
      periodo: "{{ $json.periodo }}",
    },
  },
  {
    action: "lancamentos",
    toolName: "lancamentos",
    label: "Lançamentos",
    description: "Lista de lançamentos com filtros por tipo, status e categoria",
    category: "Financeiro",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        periodo: { type: "string", description: "semana, mes, trimestre, semestre ou ano" },
        tipo: { type: "string", description: "Filtro: receita ou despesa" },
        status: { type: "string", description: "Filtro: pendente ou pago" },
        categoria_id: { type: "string", description: "UUID da categoria" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "lancamentos",
      empresa_id: "{{ $json.empresa_id }}",
      periodo: "{{ $json.periodo }}",
      tipo: "{{ $json.tipo }}",
      status: "{{ $json.status }}",
      categoria_id: "{{ $json.categoria_id }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "despesas-pendentes",
    toolName: "despesas_pendentes",
    label: "Despesas Pendentes",
    description: "Lista de despesas com status pendente ordenadas por vencimento",
    category: "Financeiro",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "despesas-pendentes",
      empresa_id: "{{ $json.empresa_id }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "receitas-pendentes",
    toolName: "receitas_pendentes",
    label: "Receitas Pendentes",
    description: "Lista de receitas com status pendente ordenadas por vencimento",
    category: "Financeiro",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "receitas-pendentes",
      empresa_id: "{{ $json.empresa_id }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "resumo-categorias",
    toolName: "resumo_categorias",
    label: "Resumo por Categorias",
    description: "Totais de receitas e despesas agrupados por categoria",
    category: "Resumos",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        periodo: { type: "string", description: "semana, mes, trimestre, semestre ou ano" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "resumo-categorias",
      empresa_id: "{{ $json.empresa_id }}",
      periodo: "{{ $json.periodo }}",
    },
  },
  {
    action: "vendas-digitais",
    toolName: "vendas_digitais",
    label: "Vendas Digitais",
    description: "Vendas de plataformas externas com filtros por plataforma e status",
    category: "Vendas",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        periodo: { type: "string", description: "semana, mes, trimestre, semestre ou ano" },
        plataforma: { type: "string", description: "Nome da plataforma (ex: Hotmart, Kiwify)" },
        status: { type: "string", description: "Status da venda (ex: aprovada, pendente)" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "vendas-digitais",
      empresa_id: "{{ $json.empresa_id }}",
      periodo: "{{ $json.periodo }}",
      plataforma: "{{ $json.plataforma }}",
      status: "{{ $json.status }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "recebimentos-digitais",
    toolName: "recebimentos_digitais",
    label: "Recebimentos Digitais",
    description: "Recebimentos vinculados a vendas digitais",
    category: "Vendas",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        status: { type: "string", description: "Status: pendente ou recebido" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "recebimentos-digitais",
      empresa_id: "{{ $json.empresa_id }}",
      status: "{{ $json.status }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "contas-bancarias",
    toolName: "contas_bancarias",
    label: "Contas Bancárias",
    description: "Lista de todas as contas bancárias e seus saldos",
    category: "Cadastros",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "contas-bancarias",
      empresa_id: "{{ $json.empresa_id }}",
    },
  },
  {
    action: "clientes",
    toolName: "clientes",
    label: "Clientes",
    description: "Lista de clientes com filtros de busca e status",
    category: "Cadastros",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        ativo: { type: "boolean", description: "Filtrar por status ativo" },
        search: { type: "string", description: "Busca por nome" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "clientes",
      empresa_id: "{{ $json.empresa_id }}",
      ativo: "{{ $json.ativo }}",
      search: "{{ $json.search }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "fornecedores",
    toolName: "fornecedores",
    label: "Fornecedores",
    description: "Lista de fornecedores com filtros de busca e status",
    category: "Cadastros",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        ativo: { type: "boolean", description: "Filtrar por status ativo" },
        search: { type: "string", description: "Busca por nome" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "fornecedores",
      empresa_id: "{{ $json.empresa_id }}",
      ativo: "{{ $json.ativo }}",
      search: "{{ $json.search }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "projetos",
    toolName: "projetos",
    label: "Projetos",
    description: "Lista de projetos com filtro por status",
    category: "Cadastros",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        status: { type: "string", description: "Status: ativo, concluido ou cancelado" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "projetos",
      empresa_id: "{{ $json.empresa_id }}",
      status: "{{ $json.status }}",
      limit: "{{ $json.limit }}",
    },
  },
  {
    action: "categorias",
    toolName: "categorias",
    label: "Categorias",
    description: "Lista de todas as categorias cadastradas",
    category: "Cadastros",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "categorias",
      empresa_id: "{{ $json.empresa_id }}",
    },
  },
  {
    action: "formas-pagamento",
    toolName: "formas_pagamento",
    label: "Formas de Pagamento",
    description: "Lista de formas de pagamento cadastradas",
    category: "Cadastros",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "formas-pagamento",
      empresa_id: "{{ $json.empresa_id }}",
    },
  },
  {
    action: "fluxo-caixa",
    toolName: "fluxo_caixa",
    label: "Fluxo de Caixa",
    description: "Comparativo mensal de receitas vs despesas",
    category: "Resumos",
    schema: {
      type: "object",
      properties: {
        empresa_id: { type: "string", description: "UUID da empresa" },
        periodo: { type: "string", description: "semana, mes, trimestre, semestre ou ano" },
      },
      required: ["empresa_id"],
    },
    body: {
      action: "fluxo-caixa",
      empresa_id: "{{ $json.empresa_id }}",
      periodo: "{{ $json.periodo }}",
    },
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Resumos": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "Financeiro": "bg-green-500/10 text-green-700 dark:text-green-400",
  "Vendas": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  "Cadastros": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "Personalizado": "bg-pink-500/10 text-pink-700 dark:text-pink-400",
};

const N8nJsonTemplates = () => {
  const [search, setSearch] = useState("");
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [customTemplates, setCustomTemplates] = useState<ActionTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("n8n-custom-templates-v2");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ action: "", label: "", description: "", json: "{}" });

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];
  const categories = [...new Set(allTemplates.map(t => t.category))];

  const filtered = allTemplates.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.action.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (text: string, action: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAction(action);
    setCopiedType(type);
    toast.success(`${type === "schema" ? "Schema" : "Body"} "${action}" copiado!`);
    setTimeout(() => { setCopiedAction(null); setCopiedType(null); }, 2000);
  };

  const toggleExpand = (action: string) => {
    setExpandedActions(prev => {
      const next = new Set(prev);
      next.has(action) ? next.delete(action) : next.add(action);
      return next;
    });
  };

  const handleAddCustom = () => {
    if (!newTemplate.action || !newTemplate.label) {
      toast.error("Preencha pelo menos a action e o label.");
      return;
    }
    let parsedJson: Record<string, any>;
    try {
      parsedJson = JSON.parse(newTemplate.json);
    } catch {
      toast.error("JSON inválido.");
      return;
    }
    const custom: ActionTemplate = {
      action: newTemplate.action,
      toolName: newTemplate.action.replace(/-/g, "_"),
      label: newTemplate.label,
      description: newTemplate.description || "Template personalizado",
      category: "Personalizado",
      schema: { type: "object", properties: { empresa_id: { type: "string" } }, required: ["empresa_id"] },
      body: parsedJson,
    };
    const updated = [...customTemplates, custom];
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates-v2", JSON.stringify(updated));
    setNewTemplate({ action: "", label: "", description: "", json: "{}" });
    setShowAddForm(false);
    toast.success("Template personalizado adicionado!");
  };

  const handleRemoveCustom = (action: string) => {
    const updated = customTemplates.filter(t => t.action !== action);
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates-v2", JSON.stringify(updated));
    toast.success("Template removido.");
  };

  const realEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-query`;

  return (
    <div className="space-y-6">
      {/* Header info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <Code2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Endpoint n8n-query</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background/80 px-2 py-1 rounded border font-mono break-all">
                  POST {realEndpoint}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(realEndpoint);
                    toast.success("URL copiada!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Períodos: <code className="text-[11px]">semana</code> · <code className="text-[11px]">mes</code> · <code className="text-[11px]">trimestre</code> · <code className="text-[11px]">semestre</code> · <code className="text-[11px]">ano</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções MCP Server Trigger */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4 text-amber-600" />
            Configuração MCP Server Trigger
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Para cada tool no MCP Server Trigger, copie o <strong>Schema</strong> para o campo de input schema do tool node
            e o <strong>Body</strong> para o HTTP Request node correspondente.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5 whitespace-nowrap">
          <Plus className="h-4 w-4" /> Novo Template
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Template Personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="action (ex: meus-dados)" value={newTemplate.action} onChange={e => setNewTemplate(p => ({ ...p, action: e.target.value }))} />
              <Input placeholder="Label (ex: Meus Dados)" value={newTemplate.label} onChange={e => setNewTemplate(p => ({ ...p, label: e.target.value }))} />
            </div>
            <Input placeholder="Descrição" value={newTemplate.description} onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))} />
            <textarea
              className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder='{"action":"minha-action","empresa_id":"{{ $json.empresa_id }}"}'
              value={newTemplate.json}
              onChange={e => setNewTemplate(p => ({ ...p, json: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddCustom}>Adicionar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates by category */}
      {categories.map(category => {
        const categoryTemplates = filtered.filter(t => t.category === category);
        if (categoryTemplates.length === 0) return null;
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={CATEGORY_COLORS[category] || ""}>
                {category}
              </Badge>
              <span className="text-xs text-muted-foreground">{categoryTemplates.length} tool(s)</span>
            </div>
            <div className="grid gap-2">
              {categoryTemplates.map(template => {
                const isExpanded = expandedActions.has(template.action);
                const isCustom = customTemplates.some(c => c.action === template.action);
                const schemaStr = JSON.stringify(template.schema, null, 2);
                const bodyStr = JSON.stringify(template.body, null, 2);
                return (
                  <Card key={template.action} className="overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(template.action)}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{template.label}</span>
                          <code className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{template.toolName}</code>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {isCustom && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveCustom(template.action)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-4 py-3">
                        <Tabs defaultValue="schema" className="w-full">
                          <TabsList className="h-8 mb-2">
                            <TabsTrigger value="schema" className="text-xs px-3 h-7">Schema (Tool Node)</TabsTrigger>
                            <TabsTrigger value="body" className="text-xs px-3 h-7">Body (HTTP Request)</TabsTrigger>
                          </TabsList>
                          <TabsContent value="schema" className="mt-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-muted-foreground">Cole no campo Input Schema do tool node no MCP Server Trigger</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleCopy(schemaStr, template.action, "schema")}
                              >
                                {copiedAction === template.action && copiedType === "schema" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                Copiar
                              </Button>
                            </div>
                            <pre className="text-xs font-mono bg-background/80 rounded border p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-[250px] overflow-y-auto">
                              {schemaStr}
                            </pre>
                          </TabsContent>
                          <TabsContent value="body" className="mt-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-muted-foreground">Cole no Body (JSON) do HTTP Request node que aponta para n8n-query</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleCopy(bodyStr, template.action, "body")}
                              >
                                {copiedAction === template.action && copiedType === "body" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                Copiar
                              </Button>
                            </div>
                            <pre className="text-xs font-mono bg-background/80 rounded border p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-[250px] overflow-y-auto">
                              {bodyStr}
                            </pre>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nenhum template encontrado para "{search}"
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default N8nJsonTemplates;
