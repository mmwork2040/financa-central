import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus, Pencil, Trash2, Loader2, Star, ExternalLink, CheckCircle2, X, MessageSquare, BarChart3, FileText, Layers, Package } from "lucide-react";
import AsaasConfigCard from "@/components/configuracoes/AsaasConfigCard";

interface PlanoControles {
  max_lancamentos: number;
  max_notas_fiscais: number;
  chat_ia: boolean;
  dashboard_completo: boolean;
  relatorios_personalizados: boolean;
}

interface PlanoRow {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  periodo: string;
  destaque: boolean;
  badge: string | null;
  ativo: boolean;
  link_acesso: string | null;
  ordem: number;
  max_empresas: number;
  grupo: string | null;
  itens: string[];
  controles: PlanoControles;
}

interface GrupoPlano {
  grupo: string;
  descricao: string | null;
  destaque: boolean;
  badge: string | null;
  ordem: number;
  modalidades: PlanoRow[];
}

const defaultControles: PlanoControles = {
  max_lancamentos: 0,
  max_notas_fiscais: 0,
  chat_ia: false,
  dashboard_completo: false,
  relatorios_personalizados: false,
};

function parseItensFromDb(raw: any): { itens: string[]; controles: PlanoControles; periodo_label: string } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      itens: Array.isArray(raw.items) ? raw.items : [],
      controles: { ...defaultControles, ...(raw.controles || {}) },
      periodo_label: raw.periodo_label || "",
    };
  }
  if (Array.isArray(raw)) {
    return { itens: raw.filter((x: any) => typeof x === 'string'), controles: { ...defaultControles }, periodo_label: "" };
  }
  return { itens: [], controles: { ...defaultControles }, periodo_label: "" };
}

function serializeItensToDb(itens: string[], controles: PlanoControles, periodoLabel?: string): any {
  return { items: itens, controles, ...(periodoLabel ? { periodo_label: periodoLabel } : {}) };
}

const periodoOptions = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

const Assinaturas = () => {
  const [planos, setPlanos] = useState<PlanoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [grupoDialogOpen, setGrupoDialogOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanoRow | null>(null);
  const [novoItem, setNovoItem] = useState("");
  const [grupoForm, setGrupoForm] = useState({ nome: "", descricao: "", destaque: false, badge: "", ordem: 0 });
  const [editingGrupo, setEditingGrupo] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: 0,
    periodo: "mensal",
    periodo_label: "",
    destaque: false,
    badge: "",
    ativo: true,
    link_acesso: "",
    ordem: 0,
    max_empresas: 1,
    grupo: "",
    itens: [] as string[],
    controles: { ...defaultControles },
  });

  useEffect(() => {
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("planos_assinatura")
        .select("*")
        .order("ordem");
      if (error) throw error;
      setPlanos((data || []).map((p: any) => {
        const parsed = parseItensFromDb(p.itens);
        return { ...p, itens: parsed.itens, controles: parsed.controles, itens_raw: p.itens };
      }));
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  // Group plans by grupo
  const grupos: GrupoPlano[] = React.useMemo(() => {
    const map = new Map<string, GrupoPlano>();
    planos.forEach(p => {
      const g = p.grupo || p.nome;
      if (!map.has(g)) {
        map.set(g, {
          grupo: g,
          descricao: p.descricao,
          destaque: p.destaque,
          badge: p.badge,
          ordem: p.ordem,
          modalidades: [],
        });
      }
      map.get(g)!.modalidades.push(p);
    });
    return Array.from(map.values()).sort((a, b) => a.ordem - b.ordem);
  }, [planos]);

  const openNewGrupo = () => {
    setEditingGrupo(null);
    setGrupoForm({ nome: "", descricao: "", destaque: false, badge: "", ordem: grupos.length + 1 });
    setGrupoDialogOpen(true);
  };

  const openEditGrupo = (grupo: GrupoPlano) => {
    setEditingGrupo(grupo.grupo);
    setGrupoForm({
      nome: grupo.grupo,
      descricao: grupo.descricao || "",
      destaque: grupo.destaque,
      badge: grupo.badge || "",
      ordem: grupo.ordem,
    });
    setGrupoDialogOpen(true);
  };

  const handleSaveGrupo = async () => {
    if (!grupoForm.nome.trim()) {
      toast.error("Informe o nome do plano.");
      return;
    }
    setSaving(true);
    try {
      // Se destaque está ativo, remover destaque de todos os outros planos do mesmo período
      if (grupoForm.destaque) {
        const modalidades = planos.filter(p => (p.grupo || p.nome) !== (editingGrupo || grupoForm.nome));
        const idsParaRemover = modalidades.filter(p => p.destaque).map(p => p.id);
        if (idsParaRemover.length > 0) {
          await (supabase as any)
            .from("planos_assinatura")
            .update({ destaque: false })
            .in("id", idsParaRemover);
        }
      }

      if (editingGrupo) {
        // Update all modalities in this group
        const modalidades = planos.filter(p => (p.grupo || p.nome) === editingGrupo);
        for (const m of modalidades) {
          const { error } = await (supabase as any)
            .from("planos_assinatura")
            .update({
              grupo: grupoForm.nome,
              descricao: grupoForm.descricao || null,
              destaque: grupoForm.destaque,
              badge: grupoForm.badge || null,
              ordem: grupoForm.ordem,
            })
            .eq("id", m.id);
          if (error) throw error;
        }
        toast.success("Plano atualizado.");
      } else {
        // Create group with default mensal modality
        const { error } = await (supabase as any)
          .from("planos_assinatura")
          .insert({
            grupo: grupoForm.nome,
            nome: grupoForm.nome,
            descricao: grupoForm.descricao || null,
            preco: 0,
            periodo: "mensal",
            destaque: grupoForm.destaque,
            badge: grupoForm.badge || null,
            ativo: true,
            ordem: grupoForm.ordem,
            itens: serializeItensToDb([], { ...defaultControles }),
          });
        if (error) throw error;
        toast.success("Plano criado. Adicione as modalidades.");
      }
      setGrupoDialogOpen(false);
      fetchPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrupo = async (grupoName: string) => {
    if (!confirm(`Excluir o plano "${grupoName}" e todas as suas modalidades?`)) return;
    try {
      const modalidades = planos.filter(p => (p.grupo || p.nome) === grupoName);
      for (const m of modalidades) {
        const { error } = await (supabase as any)
          .from("planos_assinatura")
          .delete()
          .eq("id", m.id);
        if (error) throw error;
      }
      toast.success("Plano excluído.");
      fetchPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    }
  };

  const openNewModalidade = (grupoName: string, grupoData: GrupoPlano) => {
    setEditingPlano(null);
    const existingPeriodos = grupoData.modalidades.map(m => m.periodo);
    const nextPeriodo = periodoOptions.find(o => !existingPeriodos.includes(o.value))?.value || "mensal";
    setForm({
      nome: periodoOptions.find(o => o.value === nextPeriodo)?.label || nextPeriodo,
      descricao: grupoData.descricao || "",
      preco: 0,
      periodo: nextPeriodo,
      periodo_label: "",
      destaque: grupoData.destaque,
      badge: grupoData.badge || "",
      ativo: true,
      link_acesso: "",
      ordem: grupoData.ordem,
      max_empresas: grupoData.modalidades[0]?.max_empresas ?? 1,
      grupo: grupoName,
      itens: grupoData.modalidades[0]?.itens || [],
      controles: grupoData.modalidades[0]?.controles || { ...defaultControles },
    });
    setNovoItem("");
    setDialogOpen(true);
  };

  const openEditModalidade = (plano: PlanoRow) => {
    setEditingPlano(plano);
    setForm({
      nome: plano.nome,
      descricao: plano.descricao || "",
      preco: plano.preco,
      periodo: plano.periodo,
      periodo_label: ((plano as any).itens_raw?.periodo_label) || "",
      destaque: plano.destaque,
      badge: plano.badge || "",
      ativo: plano.ativo,
      link_acesso: plano.link_acesso || "",
      ordem: plano.ordem,
      max_empresas: plano.max_empresas ?? 1,
      grupo: plano.grupo || plano.nome,
      itens: plano.itens || [],
      controles: plano.controles || { ...defaultControles },
    });
    setNovoItem("");
    setDialogOpen(true);
  };

  const addItem = () => {
    const trimmed = novoItem.trim();
    if (!trimmed) return;
    setForm(prev => ({ ...prev, itens: [...prev.itens, trimmed] }));
    setNovoItem("");
  };

  const removeItem = (index: number) => {
    setForm(prev => ({ ...prev, itens: prev.itens.filter((_, i) => i !== index) }));
  };

  const handleSaveModalidade = async () => {
    if (!form.preco && form.preco !== 0) {
      toast.error("Preencha o preço.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.grupo || form.nome,
        descricao: form.descricao || null,
        preco: form.preco,
        periodo: form.periodo,
        destaque: form.destaque,
        badge: form.badge || null,
        ativo: form.ativo,
        link_acesso: form.link_acesso || null,
        ordem: form.ordem,
        max_empresas: form.max_empresas ?? 1,
        grupo: form.grupo || form.nome,
        itens: serializeItensToDb(form.itens, form.controles, form.periodo_label),
      };

      // Destaque is managed at grupo level, not modalidade level

      if (editingPlano) {
        const { error } = await (supabase as any)
          .from("planos_assinatura")
          .update(payload)
          .eq("id", editingPlano.id);
        if (error) throw error;
        toast.success("Modalidade atualizada.");
      } else {
        const { error } = await (supabase as any)
          .from("planos_assinatura")
          .insert(payload);
        if (error) throw error;
        toast.success("Modalidade criada.");
      }
      setDialogOpen(false);
      fetchPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModalidade = async (id: string) => {
    if (!confirm("Excluir esta modalidade?")) return;
    try {
      const { error } = await (supabase as any)
        .from("planos_assinatura")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Modalidade excluída.");
      fetchPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    }
  };

  const toggleAtivo = async (plano: PlanoRow) => {
    try {
      const { error } = await (supabase as any)
        .from("planos_assinatura")
        .update({ ativo: !plano.ativo })
        .eq("id", plano.id);
      if (error) throw error;
      fetchPlanos();
      toast.success(plano.ativo ? "Modalidade desativada." : "Modalidade ativada.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  const periodoLabel = (p: string) => periodoOptions.find(o => o.value === p)?.label || p;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Planos de Assinatura</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Gerencie os planos e suas modalidades (Mensal, Trimestral, Anual)
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNewGrupo} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Plano
        </Button>
      </div>

      {grupos.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground text-center">Nenhum plano cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <Card key={grupo.grupo} className={`relative overflow-hidden ${grupo.destaque ? "border-primary shadow-md" : ""}`}>
              {grupo.badge && (
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {grupo.badge}
                </Badge>
              )}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{grupo.grupo}</h3>
                      {grupo.descricao && <p className="text-xs text-muted-foreground">{grupo.descricao}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {grupo.modalidades.length} modalidade{grupo.modalidades.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditGrupo(grupo)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteGrupo(grupo.grupo)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Modalidades */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grupo.modalidades.map((mod) => {
                    const controleItems = getControleItems(mod.controles, mod.max_empresas);
                    const allItems = [...controleItems, ...mod.itens];
                    return (
                      <div
                        key={mod.id}
                        className={`relative rounded-xl border p-4 transition-all ${mod.destaque ? "border-primary shadow-md" : ""} ${!mod.ativo ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {mod.nome && mod.nome !== mod.grupo ? mod.nome : periodoLabel(mod.periodo)}
                          </Badge>
                          <Switch
                            checked={mod.ativo}
                            onCheckedChange={() => toggleAtivo(mod)}
                            className="scale-75"
                          />
                        </div>
                        <div className="mb-2">
                          <span className="text-xl font-bold">
                            R$ {mod.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">/ {(mod as any).itens_raw?.periodo_label || mod.periodo}</span>
                        </div>
                        {mod.link_acesso && (
                          <a href={mod.link_acesso} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mb-2 flex items-center gap-1 truncate">
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">Link de pagamento</span>
                          </a>
                        )}
                        {allItems.length > 0 && (
                          <ul className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                            {allItems.slice(0, 4).map((item, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                            {allItems.length > 4 && (
                              <li className="text-[10px] text-muted-foreground pl-4">+{allItems.length - 4} mais</li>
                            )}
                          </ul>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => openEditModalidade(mod)}>
                            <Pencil className="h-3 w-3" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteModalidade(mod.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add modality button */}
                  {grupo.modalidades.length < 3 && (
                    <button
                      onClick={() => openNewModalidade(grupo.grupo, grupo)}
                      className="rounded-xl border-2 border-dashed border-border/60 p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors min-h-[120px]"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-xs font-medium">Adicionar Modalidade</span>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Novo/Editar Grupo (Plano) */}
      <Dialog open={grupoDialogOpen} onOpenChange={setGrupoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingGrupo ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Plano *</Label>
              <Input value={grupoForm.nome} onChange={(e) => setGrupoForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Básico, Intermediário, Pro" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={grupoForm.descricao} onChange={(e) => setGrupoForm(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descrição curta" />
            </div>
            <div className="space-y-2">
              <Label>Badge (rótulo)</Label>
              <Input value={grupoForm.badge} onChange={(e) => setGrupoForm(prev => ({ ...prev, badge: e.target.value }))} placeholder="Ex: Mais Popular" />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" value={grupoForm.ordem} onChange={(e) => setGrupoForm(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={grupoForm.destaque} onCheckedChange={(v) => setGrupoForm(prev => ({ ...prev, destaque: v }))} />
              <Label>Destaque</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrupoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveGrupo} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Novo/Editar Modalidade */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlano ? "Editar Modalidade" : "Nova Modalidade"} — {form.grupo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Modalidade</Label>
              <Input value={form.nome} onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Mensal, Anual, Plano Anual..." />
              <p className="text-[10px] text-muted-foreground">Exibido como rótulo no card. Se vazio, usa o período.</p>
            </div>
            <div className="space-y-2">
              <Label>Período *</Label>
              <select
                className="flex h-10 w-full rounded-full border border-input bg-muted/40 px-4 py-2 text-sm"
                value={form.periodo}
                onChange={(e) => setForm(prev => ({ ...prev, periodo: e.target.value }))}
              >
                {periodoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <CurrencyInput
                  id="preco-mod"
                  name="preco"
                  value={form.preco}
                  onValueChange={(val) => setForm(prev => ({ ...prev, preco: val ? parseInt(val) / 100 : 0 }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Rótulo do Período</Label>
                <Input value={form.periodo_label} onChange={(e) => setForm(prev => ({ ...prev, periodo_label: e.target.value }))} placeholder={`Ex: ${form.periodo}`} />
                <p className="text-[10px] text-muted-foreground">Texto ao lado do preço. Se vazio, usa o período.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link de Acesso / Pagamento</Label>
              <Input value={form.link_acesso} onChange={(e) => setForm(prev => ({ ...prev, link_acesso: e.target.value }))} placeholder="https://..." />
            </div>

            {/* Controles */}
            <div className="space-y-3 rounded-lg border p-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Controle de Funcionalidades
              </Label>

              <div className="space-y-2">
                <Label className="text-xs">Lançamentos (0 = ilimitados)</Label>
                <Input type="number" min="0" value={form.controles.max_lancamentos}
                  onChange={(e) => setForm(prev => ({ ...prev, controles: { ...prev.controles, max_lancamentos: parseInt(e.target.value) || 0 } }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Empresas (0 = ilimitadas)</Label>
                <Input type="number" min="0" value={form.max_empresas}
                  onChange={(e) => setForm(prev => ({ ...prev, max_empresas: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Notas Fiscais / mês (0 = ilimitadas)</Label>
                <Input type="number" min="0" value={form.controles.max_notas_fiscais}
                  onChange={(e) => setForm(prev => ({ ...prev, controles: { ...prev.controles, max_notas_fiscais: parseInt(e.target.value) || 0 } }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-primary" /> Chat IA</Label>
                <Switch checked={form.controles.chat_ia} onCheckedChange={(v) => setForm(prev => ({ ...prev, controles: { ...prev.controles, chat_ia: v } }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-primary" /> Dashboard Completo</Label>
                <Switch checked={form.controles.dashboard_completo} onCheckedChange={(v) => setForm(prev => ({ ...prev, controles: { ...prev.controles, dashboard_completo: v } }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Relatórios Personalizados</Label>
                <Switch checked={form.controles.relatorios_personalizados} onCheckedChange={(v) => setForm(prev => ({ ...prev, controles: { ...prev.controles, relatorios_personalizados: v } }))} />
              </div>
            </div>

            {/* Itens adicionais */}
            <div className="space-y-2">
              <Label>Itens adicionais</Label>
              <div className="flex gap-2">
                <Input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Ex: Suporte prioritário"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
              {form.itens.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {form.itens.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{item}</span>
                      </div>
                      <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm(prev => ({ ...prev, ativo: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveModalidade} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asaas Config */}
      <AsaasConfigCard />
    </div>
  );
};

function getControleItems(controles: any, maxEmpresas?: number): string[] {
  const items: string[] = [];
  if (!controles) return items;
  if (controles.max_lancamentos === 0) items.push("Lançamentos ilimitados");
  else if (controles.max_lancamentos > 0) items.push(`Até ${controles.max_lancamentos} lançamentos`);
  if (maxEmpresas === 0) items.push("Empresas ilimitadas");
  else if (maxEmpresas != null && maxEmpresas > 0) items.push(`Até ${maxEmpresas} empresa${maxEmpresas > 1 ? 's' : ''}`);
  if (controles.max_notas_fiscais === 0) items.push("NFs ilimitadas");
  else if (controles.max_notas_fiscais > 0) items.push(`Até ${controles.max_notas_fiscais} NFs/mês`);
  if (controles.chat_ia) items.push("Chat IA");
  if (controles.dashboard_completo) items.push("Dashboard Completo");
  if (controles.relatorios_personalizados) items.push("Relatórios Personalizados");
  return items;
}

export default Assinaturas;
