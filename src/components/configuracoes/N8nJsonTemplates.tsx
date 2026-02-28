import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, Search, Plus, Trash2, Code2, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ToolParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ActionTemplate {
  action: string;
  toolName: string;
  label: string;
  description: string;
  toolDescription: string;
  category: string;
  params: ToolParam[];
  body: Record<string, any>;
}

const DEFAULT_TEMPLATES: ActionTemplate[] = [
  {
    action: "resumo-financeiro",
    toolName: "resumo_financeiro",
    label: "Resumo Financeiro",
    description: "Visão geral: receitas, despesas, saldo, vendas digitais e contas bancárias",
    toolDescription: `Consulta o resumo financeiro geral da empresa.

Use quando o usuário solicitar:
- Resumo financeiro
- Quanto gastei / recebi
- Saldo atual
- Visão geral das finanças

Parâmetros:
- empresa_id
- periodo

Se não informar período, usar "mes".

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Resumos",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
    ],
    body: { action: "resumo-financeiro", empresa_id: "{{ $json.empresa_id }}", periodo: "{{ $json.periodo }}" },
  },
  {
    action: "lancamentos",
    toolName: "lancamentos",
    label: "Lançamentos",
    description: "Lista de lançamentos com filtros por tipo, status e categoria",
    toolDescription: `Consulta lançamentos financeiros (receitas e despesas).

Use quando o usuário solicitar:
- Lançamentos do mês
- Receitas ou despesas
- Contas a pagar / receber
- Movimentações financeiras

Parâmetros:
- empresa_id
- periodo
- tipo
- status
- categoria_id
- limit

Se não informar período, usar "mes".

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "tipo", type: "string", required: false, description: "Filtro: receita ou despesa" },
      { name: "status", type: "string", required: false, description: "Filtro: pendente ou pago" },
      { name: "categoria_id", type: "string", required: false, description: "UUID da categoria" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "lancamentos", empresa_id: "{{ $json.empresa_id }}", periodo: "{{ $json.periodo }}", tipo: "{{ $json.tipo }}", status: "{{ $json.status }}", categoria_id: "{{ $json.categoria_id }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "despesas-pendentes",
    toolName: "despesas_pendentes",
    label: "Despesas Pendentes",
    description: "Lista de despesas com status pendente ordenadas por vencimento",
    toolDescription: `Consulta despesas pendentes de pagamento.

Use quando o usuário solicitar:
- Despesas pendentes
- Contas a pagar
- O que preciso pagar

Parâmetros:
- empresa_id
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "despesas-pendentes", empresa_id: "{{ $json.empresa_id }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "receitas-pendentes",
    toolName: "receitas_pendentes",
    label: "Receitas Pendentes",
    description: "Lista de receitas com status pendente ordenadas por vencimento",
    toolDescription: `Consulta receitas pendentes de recebimento.

Use quando o usuário solicitar:
- Receitas pendentes
- Contas a receber
- O que tenho para receber

Parâmetros:
- empresa_id
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Financeiro",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "receitas-pendentes", empresa_id: "{{ $json.empresa_id }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "resumo-categorias",
    toolName: "resumo_categorias",
    label: "Resumo por Categorias",
    description: "Totais de receitas e despesas agrupados por categoria",
    toolDescription: `Consulta totais agrupados por categoria.

Use quando o usuário solicitar:
- Gastos por categoria
- Onde estou gastando mais
- Resumo por categoria

Parâmetros:
- empresa_id
- periodo

Se não informar período, usar "mes".

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Resumos",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
    ],
    body: { action: "resumo-categorias", empresa_id: "{{ $json.empresa_id }}", periodo: "{{ $json.periodo }}" },
  },
  {
    action: "vendas-digitais",
    toolName: "vendas_digitais",
    label: "Vendas Digitais",
    description: "Vendas de plataformas externas com filtros por plataforma e status",
    toolDescription: `Consulta vendas realizadas em plataformas digitais.

Use quando o usuário solicitar:
- Vendas online
- Vendas Hotmart, Monetizze, Eduzz ou similiar
- Vendas digitais aprovadas
- Relatório de vendas digitais

Parâmetros:
- empresa_id
- periodo
- plataforma
- status
- limit

Se não informar período, usar "mes".

Não usar para recebimentos pendentes.

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
      { name: "plataforma", type: "string", required: false, description: "Nome da plataforma (ex: Hotmart, Kiwify)" },
      { name: "status", type: "string", required: false, description: "Status da venda (ex: aprovada, pendente)" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "vendas-digitais", empresa_id: "{{ $json.empresa_id }}", periodo: "{{ $json.periodo }}", plataforma: "{{ $json.plataforma }}", status: "{{ $json.status }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "recebimentos-digitais",
    toolName: "recebimentos_digitais",
    label: "Recebimentos Digitais",
    description: "Recebimentos vinculados a vendas digitais",
    toolDescription: `Consulta recebimentos de vendas digitais.

Use quando o usuário solicitar:
- Recebimentos pendentes
- Quando vou receber
- Parcelas de vendas digitais

Parâmetros:
- empresa_id
- status
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Vendas",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "status", type: "string", required: false, description: "Status: pendente ou recebido" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "recebimentos-digitais", empresa_id: "{{ $json.empresa_id }}", status: "{{ $json.status }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "contas-bancarias",
    toolName: "contas_bancarias",
    label: "Contas Bancárias",
    description: "Lista de todas as contas bancárias e seus saldos",
    toolDescription: `Consulta contas bancárias e saldos.

Use quando o usuário solicitar:
- Saldo das contas
- Contas bancárias
- Quanto tenho no banco

Parâmetros:
- empresa_id

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
    ],
    body: { action: "contas-bancarias", empresa_id: "{{ $json.empresa_id }}" },
  },
  {
    action: "clientes",
    toolName: "clientes",
    label: "Clientes",
    description: "Lista de clientes com filtros de busca e status",
    toolDescription: `Consulta lista de clientes cadastrados.

Use quando o usuário solicitar:
- Lista de clientes
- Buscar cliente
- Clientes ativos

Parâmetros:
- empresa_id
- ativo
- search
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "ativo", type: "boolean", required: false, description: "Filtrar por status ativo" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "clientes", empresa_id: "{{ $json.empresa_id }}", ativo: "{{ $json.ativo }}", search: "{{ $json.search }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "fornecedores",
    toolName: "fornecedores",
    label: "Fornecedores",
    description: "Lista de fornecedores com filtros de busca e status",
    toolDescription: `Consulta lista de fornecedores cadastrados.

Use quando o usuário solicitar:
- Lista de fornecedores
- Buscar fornecedor
- Fornecedores ativos

Parâmetros:
- empresa_id
- ativo
- search
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "ativo", type: "boolean", required: false, description: "Filtrar por status ativo" },
      { name: "search", type: "string", required: false, description: "Busca por nome" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "fornecedores", empresa_id: "{{ $json.empresa_id }}", ativo: "{{ $json.ativo }}", search: "{{ $json.search }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "projetos",
    toolName: "projetos",
    label: "Projetos",
    description: "Lista de projetos com filtro por status",
    toolDescription: `Consulta projetos cadastrados.

Use quando o usuário solicitar:
- Lista de projetos
- Projetos ativos
- Status dos projetos

Parâmetros:
- empresa_id
- status
- limit

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "status", type: "string", required: false, description: "Status: ativo, concluido ou cancelado" },
      { name: "limit", type: "number", required: false, description: "Limite de resultados" },
    ],
    body: { action: "projetos", empresa_id: "{{ $json.empresa_id }}", status: "{{ $json.status }}", limit: "{{ $json.limit }}" },
  },
  {
    action: "categorias",
    toolName: "categorias",
    label: "Categorias",
    description: "Lista de todas as categorias cadastradas",
    toolDescription: `Consulta categorias cadastradas.

Use quando o usuário solicitar:
- Lista de categorias
- Categorias disponíveis

Parâmetros:
- empresa_id

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
    ],
    body: { action: "categorias", empresa_id: "{{ $json.empresa_id }}" },
  },
  {
    action: "formas-pagamento",
    toolName: "formas_pagamento",
    label: "Formas de Pagamento",
    description: "Lista de formas de pagamento cadastradas",
    toolDescription: `Consulta formas de pagamento cadastradas.

Use quando o usuário solicitar:
- Formas de pagamento
- Meios de pagamento disponíveis

Parâmetros:
- empresa_id

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Cadastros",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
    ],
    body: { action: "formas-pagamento", empresa_id: "{{ $json.empresa_id }}" },
  },
  {
    action: "fluxo-caixa",
    toolName: "fluxo_caixa",
    label: "Fluxo de Caixa",
    description: "Comparativo mensal de receitas vs despesas",
    toolDescription: `Consulta o fluxo de caixa comparativo mensal.

Use quando o usuário solicitar:
- Fluxo de caixa
- Comparativo mensal
- Evolução financeira

Parâmetros:
- empresa_id
- periodo

Se não informar período, usar "semestre".

Sempre usar a empresa_id ativa. Nunca misturar empresas. Nunca inventar dados.`,
    category: "Resumos",
    params: [
      { name: "empresa_id", type: "string", required: true, description: "UUID da empresa" },
      { name: "periodo", type: "string", required: false, description: "semana, mes, trimestre, semestre ou ano" },
    ],
    body: { action: "fluxo-caixa", empresa_id: "{{ $json.empresa_id }}", periodo: "{{ $json.periodo }}" },
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [customTemplates, setCustomTemplates] = useState<ActionTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("n8n-custom-templates-v3");
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
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
      toolDescription: newTemplate.description || "Template personalizado",
      category: "Personalizado",
      params: [{ name: "empresa_id", type: "string", required: true, description: "UUID da empresa" }],
      body: parsedJson,
    };
    const updated = [...customTemplates, custom];
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates-v3", JSON.stringify(updated));
    setNewTemplate({ action: "", label: "", description: "", json: "{}" });
    setShowAddForm(false);
    toast.success("Template personalizado adicionado!");
  };

  const handleRemoveCustom = (action: string) => {
    const updated = customTemplates.filter(t => t.action !== action);
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates-v3", JSON.stringify(updated));
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
                  onClick={() => handleCopy(realEndpoint, "endpoint")}
                >
                  {copiedId === "endpoint" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Períodos: <code className="text-[11px]">semana</code> · <code className="text-[11px]">mes</code> · <code className="text-[11px]">trimestre</code> · <code className="text-[11px]">semestre</code> · <code className="text-[11px]">ano</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aviso importante sobre "Defined automatically by the model" */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">⚠️ Não use "Defined automatically by the model" no HTTP Request</p>
              <div className="text-xs text-muted-foreground space-y-1.5">
                <p>O campo <strong>JSON</strong> do nó HTTP Request <strong>NÃO</strong> deve ficar como "Defined automatically by the model", porque o modelo não sabe incluir o campo <code className="text-[11px] bg-background px-1 rounded">action</code> que é obrigatório.</p>
                <p><strong>Configuração correta do HTTP Request:</strong></p>
                <ol className="list-decimal list-inside space-y-0.5 ml-1">
                  <li>Send Body: <strong>ON</strong></li>
                  <li>Body Content Type: <strong>JSON</strong></li>
                  <li>Specify Body: <strong>Using JSON</strong></li>
                  <li>JSON: <strong>Cole o body da aba "Body (HTTP Request)"</strong> de cada tool abaixo</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4 text-amber-600" />
            Como configurar cada Tool no MCP Server Trigger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Passo 1 — Tool Node (Aba Parameters):</p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li><strong>Description:</strong> Copie da aba <em>"Descrição (Tool)"</em></li>
              <li><strong>Method:</strong> POST</li>
              <li><strong>URL:</strong> Cole o endpoint acima</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Passo 2 — Tool Node (Aba Parameters → seção "Parameters"):</p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Clique em <strong>"Add Parameter"</strong> para cada parâmetro listado na aba <em>"Parâmetros"</em></li>
              <li>Preencha: Name, Type, Required, Description conforme a tabela</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Passo 3 — HTTP Request (Corpo do Request):</p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Send Headers: ON → api-key com o valor da anon key</li>
              <li>Send Body: ON → Body Content Type: JSON</li>
              <li>Specify Body: <strong>"Using JSON"</strong> (NÃO "Defined automatically by the model")</li>
              <li>Cole o JSON da aba <em>"Body (HTTP Request)"</em></li>
            </ul>
          </div>
        </CardContent>
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
                        <Tabs defaultValue="description" className="w-full">
                          <TabsList className="h-8 mb-3">
                            <TabsTrigger value="description" className="text-xs px-3 h-7">Descrição (Tool)</TabsTrigger>
                            <TabsTrigger value="params" className="text-xs px-3 h-7">Parâmetros</TabsTrigger>
                            <TabsTrigger value="body" className="text-xs px-3 h-7">Body (HTTP Request)</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="description" className="mt-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-muted-foreground">Cole no campo <strong>Description</strong> do tool node no MCP Server Trigger</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleCopy(template.toolDescription, `desc-${template.action}`)}
                              >
                                {copiedId === `desc-${template.action}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                Copiar
                              </Button>
                            </div>
                            <pre className="text-xs font-mono bg-background/80 rounded border p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto">
                              {template.toolDescription}
                            </pre>
                          </TabsContent>

                          <TabsContent value="params" className="mt-0">
                            <p className="text-[11px] text-muted-foreground mb-2">
                              No tool node, clique em <strong>"Add Parameter"</strong> e preencha cada um:
                            </p>
                            <div className="rounded border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="text-xs h-8 font-semibold">Nome</TableHead>
                                    <TableHead className="text-xs h-8 font-semibold">Tipo</TableHead>
                                    <TableHead className="text-xs h-8 font-semibold">Obrigatório</TableHead>
                                    <TableHead className="text-xs h-8 font-semibold">Descrição</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {template.params.map(param => (
                                    <TableRow key={param.name}>
                                      <TableCell className="text-xs font-mono py-1.5">{param.name}</TableCell>
                                      <TableCell className="text-xs py-1.5">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{param.type}</Badge>
                                      </TableCell>
                                      <TableCell className="text-xs py-1.5">
                                        {param.required ? (
                                          <Badge className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Sim</Badge>
                                        ) : (
                                          <span className="text-muted-foreground">Não</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-xs py-1.5 text-muted-foreground">{param.description}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>

                          <TabsContent value="body" className="mt-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-muted-foreground">
                                Specify Body → <strong>"Using JSON"</strong> → cole este JSON:
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleCopy(bodyStr, `body-${template.action}`)}
                              >
                                {copiedId === `body-${template.action}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                Copiar
                              </Button>
                            </div>
                            <pre className="text-xs font-mono bg-background/80 rounded border p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-[250px] overflow-y-auto">
                              {bodyStr}
                            </pre>
                            <p className="text-[10px] text-red-500 dark:text-red-400 mt-2 font-medium">
                              ⚠️ NÃO use "Defined automatically by the model" — o campo action não será incluído e causará erro.
                            </p>
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
