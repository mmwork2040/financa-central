
import React, { useState, useEffect } from "react";
import { Webhook, Plus, Trash2, Loader2, Power, PowerOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EVENTOS = [
  { value: "nova_venda", label: "Nova venda" },
  { value: "venda_reembolsada", label: "Venda reembolsada" },
  { value: "conta_vencendo", label: "Conta vencendo" },
  { value: "conta_paga", label: "Conta paga" },
  { value: "saldo_negativo", label: "Saldo negativo" },
];

const WebhooksConfig = () => {
  const { empresaId } = useAuth();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [evento, setEvento] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('webhooks_empresa')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!url.trim() || !evento || !empresaId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('webhooks_empresa')
        .insert({ empresa_id: empresaId, url: url.trim(), evento, ativo: true });
      if (error) throw error;
      toast.success("Webhook criado com sucesso!");
      setDialogOpen(false);
      setUrl("");
      setEvento("");
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    const { error } = await (supabase as any).from('webhooks_empresa').update({ ativo: !ativo }).eq('id', id);
    if (error) toast.error("Erro ao atualizar");
    else fetchWebhooks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('webhooks_empresa').delete().eq('id', id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Webhook removido."); fetchWebhooks(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Webhooks</h1>
        </div>
        <p className="text-sm text-muted-foreground">Conecte automações externas como n8n, Zapier ou Make</p>
      </div>

      <Button onClick={() => setDialogOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-1" /> Novo Webhook
      </Button>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum webhook configurado</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Crie um webhook para receber notificações automáticas em suas ferramentas favoritas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <Card key={wh.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {EVENTOS.find(e => e.value === wh.evento)?.label || wh.evento}
                    </Badge>
                    {wh.ativo ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 text-[10px]">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{wh.url}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(wh.id, wh.ativo)}>
                    {wh.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(wh.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold mb-2">Payload padrão</h4>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`{
  "empresa_id": "uuid",
  "evento": "nova_venda",
  "data": "2025-01-15",
  "valor": "150.00",
  "descricao": "Venda do produto X"
}`}
          </pre>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Webhook</DialogTitle>
            <DialogDescription>Configure a URL que receberá as notificações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL do Webhook *</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
            </div>
            <div>
              <Label>Evento *</Label>
              <Select value={evento} onValueChange={setEvento}>
                <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                <SelectContent>
                  {EVENTOS.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={saving || !url.trim() || !evento} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...</> : "Criar Webhook"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhooksConfig;
