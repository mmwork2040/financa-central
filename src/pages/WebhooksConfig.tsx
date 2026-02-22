
import React, { useState, useEffect } from "react";
import { Webhook, Plus, Trash2, Loader2, Power, PowerOff, AlertCircle, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const WebhooksConfig = () => {
  const { empresaId, isSuperAdmin } = useAuth();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [payloadJson, setPayloadJson] = useState("");
  const [campoResposta, setCampoResposta] = useState("");
  const [comportamento, setComportamento] = useState("");
  const [tabela, setTabela] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const tabelasDisponiveis = [
    { value: "lancamentos", label: "Lançamentos" },
    { value: "clientes", label: "Clientes" },
    { value: "fornecedores", label: "Fornecedores" },
    { value: "categorias", label: "Categorias" },
    { value: "contas_bancarias", label: "Contas Bancárias" },
    { value: "formas_pagamento", label: "Formas de Pagamento" },
  ];

  useEffect(() => {
    if (isSuperAdmin) fetchWebhooks();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

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

  const validateJson = (value: string): boolean => {
    if (!value.trim()) {
      setJsonError(null);
      return true;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
      return true;
    } catch (e: any) {
      setJsonError(e.message || "JSON inválido");
      return false;
    }
  };

  const handlePayloadChange = (value: string) => {
    setPayloadJson(value);
    validateJson(value);
  };

  const resetForm = () => {
    setNome("");
    setUrl("");
    setPayloadJson("");
    setCampoResposta("");
    setComportamento("");
    setTabela("");
    setJsonError(null);
  };

  const handleCreate = async () => {
    if (!nome.trim() || !url.trim() || !empresaId) return;
    if (payloadJson.trim() && !validateJson(payloadJson)) {
      toast.error("O JSON do payload é inválido. Corrija antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('webhooks_empresa')
        .insert({
          empresa_id: empresaId,
          nome: nome.trim(),
          url: url.trim(),
          evento: nome.trim(),
          tabela: tabela || null,
          payload_json: payloadJson.trim() || null,
          campo_resposta: campoResposta.trim() || null,
          comportamento: comportamento.trim() || null,
          ativo: true,
        });
      if (error) throw error;
      toast.success("Webhook criado com sucesso!");
      setDialogOpen(false);
      resetForm();
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
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <Webhook className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Webhooks</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Configure ações de suporte e automações via webhook</p>
      </div>

      <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="sm">
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
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{wh.nome || wh.evento}</span>
                      {wh.ativo ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]">Ativo</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500 text-[10px]">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{wh.url}</p>
                    {wh.tabela && (
                      <div className="flex items-center gap-1 mt-1">
                        <Database className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{tabelasDisponiveis.find(t => t.value === wh.tabela)?.label || wh.tabela}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(wh.id, wh.ativo)}>
                      {wh.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(wh.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {(wh.campo_resposta || wh.comportamento) && (
                  <div className="border-t pt-2 space-y-1">
                    {wh.campo_resposta && (
                      <p className="text-xs"><span className="font-medium text-muted-foreground">Campo resposta:</span> <code className="bg-muted px-1 rounded text-[11px]">{wh.campo_resposta}</code></p>
                    )}
                    {wh.comportamento && (
                      <p className="text-xs"><span className="font-medium text-muted-foreground">Comportamento:</span> {wh.comportamento}</p>
                    )}
                  </div>
                )}
                {wh.payload_json && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver payload</summary>
                    <pre className="bg-muted p-2 rounded-lg overflow-x-auto mt-1 text-[11px]">{(() => {
                      try { return JSON.stringify(JSON.parse(wh.payload_json), null, 2); } catch { return wh.payload_json; }
                    })()}</pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Webhook</DialogTitle>
            <DialogDescription>Configure a ação de suporte e a URL que receberá as notificações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da ação *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Solicitação de exclusão" />
            </div>
            <div>
              <Label>Tabela da ação</Label>
              <Select value={tabela} onValueChange={setTabela}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a tabela (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {tabelasDisponiveis.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">Selecione em qual tabela a ação será executada.</p>
            </div>
            <div>
              <Label>URL do Webhook *</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
            </div>
            <div>
              <Label>Payload JSON</Label>
              <Textarea
                value={payloadJson}
                onChange={e => handlePayloadChange(e.target.value)}
                placeholder={'{\n  "empresa_id": "{{empresa_id}}",\n  "usuario": "{{usuario}}",\n  "acao": "{{acao}}"\n}'}
                className="font-mono text-xs min-h-[120px]"
              />
              {jsonError && (
                <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>
            <div>
              <Label>Campo da resposta (output)</Label>
              <Input value={campoResposta} onChange={e => setCampoResposta(e.target.value)} placeholder="Ex: data.status ou resultado" />
              <p className="text-[11px] text-muted-foreground mt-1">Informe o campo do JSON de resposta que o sistema deve tratar.</p>
            </div>
            <div>
              <Label>Comportamento ao receber retorno</Label>
              <Textarea
                value={comportamento}
                onChange={e => setComportamento(e.target.value)}
                placeholder="Ex: Se status = 'aprovado', excluir o registro. Se status = 'recusado', notificar o usuário."
                className="min-h-[80px] text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Descreva o que o sistema deve fazer conforme o retorno do webhook.</p>
            </div>
            <Button onClick={handleCreate} disabled={saving || !nome.trim() || !url.trim() || !!jsonError} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...</> : "Criar Webhook"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhooksConfig;
