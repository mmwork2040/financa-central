import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus, Pencil, Trash2, Loader2, Star, ExternalLink, CheckCircle2, X } from "lucide-react";

interface Plano {
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
  itens: string[];
}

const periodoOptions = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

const Assinaturas = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [novoItem, setNovoItem] = useState("");
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    periodo: "mensal",
    destaque: false,
    badge: "",
    ativo: true,
    link_acesso: "",
    ordem: 0,
    itens: [] as string[],
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
      setPlanos((data || []).map((p: any) => ({
        ...p,
        itens: Array.isArray(p.itens) ? p.itens : [],
      })));
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingPlano(null);
    setForm({ nome: "", descricao: "", preco: "", periodo: "mensal", destaque: false, badge: "", ativo: true, link_acesso: "", ordem: planos.length + 1, itens: [] });
    setNovoItem("");
    setDialogOpen(true);
  };

  const openEdit = (plano: Plano) => {
    setEditingPlano(plano);
    setForm({
      nome: plano.nome,
      descricao: plano.descricao || "",
      preco: String(plano.preco),
      periodo: plano.periodo,
      destaque: plano.destaque,
      badge: plano.badge || "",
      ativo: plano.ativo,
      link_acesso: plano.link_acesso || "",
      ordem: plano.ordem,
      itens: plano.itens || [],
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

  const handleSave = async () => {
    if (!form.nome.trim() || !form.preco) {
      toast.error("Preencha nome e preço.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        descricao: form.descricao || null,
        preco: parseFloat(form.preco),
        periodo: form.periodo,
        destaque: form.destaque,
        badge: form.badge || null,
        ativo: form.ativo,
        link_acesso: form.link_acesso || null,
        ordem: form.ordem,
        itens: form.itens,
      };

      if (editingPlano) {
        const { error } = await (supabase as any)
          .from("planos_assinatura")
          .update(payload)
          .eq("id", editingPlano.id);
        if (error) throw error;
        toast.success("Plano atualizado com sucesso.");
      } else {
        const { error } = await (supabase as any)
          .from("planos_assinatura")
          .insert(payload);
        if (error) throw error;
        toast.success("Plano criado com sucesso.");
      }
      setDialogOpen(false);
      fetchPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;
    try {
      const { error } = await (supabase as any)
        .from("planos_assinatura")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Plano excluído.");
      fetchPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    }
  };

  const toggleAtivo = async (plano: Plano) => {
    try {
      const { error } = await (supabase as any)
        .from("planos_assinatura")
        .update({ ativo: !plano.ativo })
        .eq("id", plano.id);
      if (error) throw error;
      fetchPlanos();
      toast.success(plano.ativo ? "Plano desativado." : "Plano ativado.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

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
        <p className="text-xs sm:text-sm text-muted-foreground">Configure os planos disponíveis para os usuários</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Plano
        </Button>
      </div>

      {planos.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground text-center">Nenhum plano cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`relative rounded-xl border p-4 transition-all ${
                plano.destaque ? "border-primary shadow-md" : "border-border"
              } ${!plano.ativo ? "opacity-50" : ""}`}
            >
              {plano.badge && (
                <Badge className="absolute -top-2.5 left-3 bg-primary text-primary-foreground text-[10px] gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {plano.badge}
                </Badge>
              )}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-sm">{plano.nome}</h4>
                  <p className="text-xs text-muted-foreground">{plano.descricao}</p>
                </div>
                <Switch
                  checked={plano.ativo}
                  onCheckedChange={() => toggleAtivo(plano)}
                  className="scale-75"
                />
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold">R$ {plano.preco}</span>
                <span className="text-xs text-muted-foreground ml-1">/ {plano.periodo}</span>
              </div>
              {plano.itens && plano.itens.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {plano.itens.map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plano.link_acesso && (
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1 truncate">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{plano.link_acesso}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(plano)}>
                  <Pencil className="h-3 w-3" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1" onClick={() => handleDelete(plano.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlano ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: Plano Mensal" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descrição curta do plano" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <Input type="number" value={form.preco} onChange={(e) => setForm(prev => ({ ...prev, preco: e.target.value }))} placeholder="197" />
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <select
                  className="flex h-10 w-full rounded-full border border-input bg-muted/40 px-4 py-2 text-sm"
                  value={form.periodo}
                  onChange={(e) => setForm(prev => ({ ...prev, periodo: e.target.value }))}
                >
                  {periodoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link de Acesso / Pagamento</Label>
              <Input value={form.link_acesso} onChange={(e) => setForm(prev => ({ ...prev, link_acesso: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Badge (rótulo)</Label>
              <Input value={form.badge} onChange={(e) => setForm(prev => ({ ...prev, badge: e.target.value }))} placeholder="Ex: Melhor Escolha" />
            </div>

            {/* Itens inclusos */}
            <div className="space-y-2">
              <Label>Itens inclusos no plano</Label>
              <div className="flex gap-2">
                <Input
                  value={novoItem}
                  onChange={(e) => setNovoItem(e.target.value)}
                  placeholder="Ex: Acesso ilimitado"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.ordem} onChange={(e) => setForm(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.destaque} onCheckedChange={(v) => setForm(prev => ({ ...prev, destaque: v }))} />
                <Label>Destaque</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm(prev => ({ ...prev, ativo: v }))} />
              <Label>Ativo (visível para usuários)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assinaturas;
