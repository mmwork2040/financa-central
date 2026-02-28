import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, Search, Plus, Trash2, Code2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ActionTemplate {
  action: string;
  label: string;
  description: string;
  category: string;
  json: Record<string, any>;
}

const DEFAULT_TEMPLATES: ActionTemplate[] = [
  {
    action: "resumo-financeiro",
    label: "Resumo Financeiro",
    description: "Visão geral: receitas, despesas, saldo, vendas digitais e contas bancárias",
    category: "Resumos",
    json: {
      action: "resumo-financeiro",
      empresa_id: "<UUID da empresa>",
      periodo: "<semana|mes|trimestre|semestre|ano>",
    },
  },
  {
    action: "lancamentos",
    label: "Lançamentos",
    description: "Lista de lançamentos com filtros por tipo, status e categoria",
    category: "Financeiro",
    json: {
      action: "lancamentos",
      empresa_id: "<UUID da empresa>",
      periodo: "<período>",
      filters: { tipo: "<receita|despesa>", status: "<pendente|pago>", categoria_id: "<UUID>", limit: 50 },
    },
  },
  {
    action: "despesas-pendentes",
    label: "Despesas Pendentes",
    description: "Lista de despesas com status pendente ordenadas por vencimento",
    category: "Financeiro",
    json: {
      action: "despesas-pendentes",
      empresa_id: "<UUID da empresa>",
      filters: { limit: 20 },
    },
  },
  {
    action: "receitas-pendentes",
    label: "Receitas Pendentes",
    description: "Lista de receitas com status pendente ordenadas por vencimento",
    category: "Financeiro",
    json: {
      action: "receitas-pendentes",
      empresa_id: "<UUID da empresa>",
      filters: { limit: 20 },
    },
  },
  {
    action: "resumo-categorias",
    label: "Resumo por Categorias",
    description: "Totais de receitas e despesas agrupados por categoria",
    category: "Resumos",
    json: {
      action: "resumo-categorias",
      empresa_id: "<UUID da empresa>",
      periodo: "<período>",
    },
  },
  {
    action: "vendas-digitais",
    label: "Vendas Digitais",
    description: "Vendas de plataformas externas com filtros por plataforma e status",
    category: "Vendas",
    json: {
      action: "vendas-digitais",
      empresa_id: "<UUID da empresa>",
      periodo: "<período>",
      filters: { plataforma: "<plataforma>", status: "aprovada", limit: 50 },
    },
  },
  {
    action: "recebimentos-digitais",
    label: "Recebimentos Digitais",
    description: "Recebimentos vinculados a vendas digitais",
    category: "Vendas",
    json: {
      action: "recebimentos-digitais",
      empresa_id: "<UUID da empresa>",
      filters: { status: "<pendente|recebido>", limit: 20 },
    },
  },
  {
    action: "contas-bancarias",
    label: "Contas Bancárias",
    description: "Lista de todas as contas bancárias e seus saldos",
    category: "Cadastros",
    json: {
      action: "contas-bancarias",
      empresa_id: "<UUID da empresa>",
    },
  },
  {
    action: "clientes",
    label: "Clientes",
    description: "Lista de clientes com filtros de busca e status",
    category: "Cadastros",
    json: {
      action: "clientes",
      empresa_id: "<UUID da empresa>",
      filters: { ativo: true, search: "<nome parcial>", limit: 50 },
    },
  },
  {
    action: "fornecedores",
    label: "Fornecedores",
    description: "Lista de fornecedores com filtros de busca e status",
    category: "Cadastros",
    json: {
      action: "fornecedores",
      empresa_id: "<UUID da empresa>",
      filters: { ativo: true, search: "<nome parcial>", limit: 50 },
    },
  },
  {
    action: "projetos",
    label: "Projetos",
    description: "Lista de projetos com filtro por status",
    category: "Cadastros",
    json: {
      action: "projetos",
      empresa_id: "<UUID da empresa>",
      filters: { status: "<ativo|concluido|cancelado>", limit: 20 },
    },
  },
  {
    action: "categorias",
    label: "Categorias",
    description: "Lista de todas as categorias cadastradas",
    category: "Cadastros",
    json: {
      action: "categorias",
      empresa_id: "<UUID da empresa>",
    },
  },
  {
    action: "formas-pagamento",
    label: "Formas de Pagamento",
    description: "Lista de formas de pagamento cadastradas",
    category: "Cadastros",
    json: {
      action: "formas-pagamento",
      empresa_id: "<UUID da empresa>",
    },
  },
  {
    action: "fluxo-caixa",
    label: "Fluxo de Caixa",
    description: "Comparativo mensal de receitas vs despesas",
    category: "Resumos",
    json: {
      action: "fluxo-caixa",
      empresa_id: "<UUID da empresa>",
      periodo: "<semestre|ano>",
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
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [customTemplates, setCustomTemplates] = useState<ActionTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("n8n-custom-templates");
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

  const handleCopy = (template: ActionTemplate) => {
    navigator.clipboard.writeText(JSON.stringify(template.json, null, 2));
    setCopiedAction(template.action);
    toast.success(`JSON "${template.label}" copiado!`);
    setTimeout(() => setCopiedAction(null), 2000);
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
      label: newTemplate.label,
      description: newTemplate.description || "Template personalizado",
      category: "Personalizado",
      json: parsedJson,
    };
    const updated = [...customTemplates, custom];
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates", JSON.stringify(updated));
    setNewTemplate({ action: "", label: "", description: "", json: "{}" });
    setShowAddForm(false);
    toast.success("Template personalizado adicionado!");
  };

  const handleRemoveCustom = (action: string) => {
    const updated = customTemplates.filter(t => t.action !== action);
    setCustomTemplates(updated);
    localStorage.setItem("n8n-custom-templates", JSON.stringify(updated));
    toast.success("Template removido.");
  };

  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-query`;

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
                  POST {endpoint}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(endpoint);
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
              placeholder='{"action":"minha-action","empresa_id":"<UUID>"}'
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
              <span className="text-xs text-muted-foreground">{categoryTemplates.length} action(s)</span>
            </div>
            <div className="grid gap-2">
              {categoryTemplates.map(template => {
                const isExpanded = expandedActions.has(template.action);
                const isCustom = customTemplates.some(c => c.action === template.action);
                return (
                  <Card key={template.action} className="overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(template.action)}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{template.label}</span>
                          <code className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{template.action}</code>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(template)}>
                          {copiedAction === template.action ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        {isCustom && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveCustom(template.action)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-4 py-3">
                        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(template.json, null, 2)}
                        </pre>
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
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum template encontrado para "{search}"
        </div>
      )}
    </div>
  );
};

export default N8nJsonTemplates;
