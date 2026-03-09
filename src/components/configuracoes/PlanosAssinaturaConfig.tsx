import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus, Pencil, Trash2, Loader2, Star, ExternalLink } from "lucide-react";

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
  max_empresas: number;
}

const periodoOptions = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

const PlanosAssinaturaConfig = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: 0,
    periodo: "mensal",
    destaque: false,
    badge: "",
    ativo: true,
    link_acesso: "",
    ordem: 0,
    max_empresas: "1",
    max_notas_fiscais: "0",
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
      setPlanos(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingPlano(null);
    setForm({ nome: "", descricao: "", preco: 0, periodo: "mensal", destaque: false, badge: "", ativo: true, link_acesso: "", ordem: planos.length + 1, max_empresas: "1", max_notas_fiscais: "0" });
    setDialogOpen(true);
  };

  const openEdit = (plano: Plano) => {
    setEditingPlano(plano);
    setForm({
      nome: plano.nome,
      descricao: plano.descricao || "",
      preco: plano.preco,
      periodo: plano.periodo,
      destaque: plano.destaque,
      badge: plano.badge || "",
      ativo: plano.ativo,
      link_acesso: plano.link_acesso || "",
      ordem: plano.ordem,
      max_empresas: String(plano.max_empresas ?? 1),
    });
    setDialogOpen(true);
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
        preco: form.preco,
        periodo: form.periodo,
        destaque: form.destaque,
        badge: form.badge || null,
        ativo: form.ativo,
        link_acesso: form.link_acesso || null,
        ordem: form.ordem,
        max_empresas: parseInt(form.max_empresas) || 1,
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Planos de Assinatura</CardTitle>
                <CardDescription>Configure os planos disponíveis para os usuários</CardDescription>
              </div>
            </div>
            <Button onClick={openNew} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {planos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum plano cadastrado.</p>
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
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={plano.ativo}
                        onCheckedChange={() => toggleAtivo(plano)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="text-2xl font-bold">R$ {plano.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-muted-foreground ml-1">/ {plano.periodo}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Período: <Badge variant="outline" className="text-[10px]">{plano.periodo}</Badge>
                  </div>
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
        </CardContent>
      </Card>

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
                <CurrencyInput
                  id="preco-plano"
                  name="preco"
                  value={form.preco}
                  onValueChange={(val) => setForm(prev => ({ ...prev, preco: val ? parseInt(val) / 100 : 0 }))}
                  placeholder="0,00"
                />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.ordem} onChange={(e) => setForm(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Máx. Empresas</Label>
                <Input type="number" min="1" value={form.max_empresas} onChange={(e) => setForm(prev => ({ ...prev, max_empresas: e.target.value }))} placeholder="1" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
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
    </>
  );
};

export default PlanosAssinaturaConfig;
