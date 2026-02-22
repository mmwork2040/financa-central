
import React, { useState, useEffect } from "react";
import { Webhook, Plus, Trash2, Loader2, Power, PowerOff, AlertCircle, Pencil, Zap, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const acoesDisponiveis = [
  { value: "Excluir Registro", label: "Excluir Registro" },
  { value: "Editar Registro", label: "Editar Registro" },
  { value: "Chat", label: "Chat" },
];

const gerarPayloadSugerido = (acao: string): string => {
  if (acao === "Chat") {
    return JSON.stringify({
      empresa_id: "{{empresa_id}}",
      empresa_nome: "{{empresa_nome}}",
      acao: "Chat",
      timestamp: "{{timestamp}}",
      usuario: { id: "{{user_id}}", nome: "{{user_nome}}", email: "{{user_email}}", telefone: "{{user_telefone}}" },
      mensagem: "{{mensagem}}",
      conversa_id: "{{conversa_id}}",
    }, null, 2);
  }

  const baseFields: Record<string, any> = {
    empresa_id: "{{empresa_id}}",
    empresa_nome: "{{empresa_nome}}",
    acao,
    tabela: "{{tabela}}",
    timestamp: "{{timestamp}}",
    usuario: { id: "{{user_id}}", nome: "{{user_nome}}", email: "{{user_email}}", telefone: "{{user_telefone}}" },
    registro_id: "{{registro_id}}",
    descricao: "{{descricao}}",
  };

  if (acao === "Editar Registro") {
    baseFields.dados = "{{dados}}";
  }

  return JSON.stringify(baseFields, null, 2);
};

const WebhooksConfig = () => {
  const { empresaId, isSuperAdmin, user, userProfile } = useAuth();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // Test dialog state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testWebhook, setTestWebhook] = useState<any>(null);
  const [testRecords, setTestRecords] = useState<any[]>([]);
  const [testRecordsLoading, setTestRecordsLoading] = useState(false);
  const [selectedTestRecord, setSelectedTestRecord] = useState<string>("");

  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [payloadJson, setPayloadJson] = useState("");
  const [tabela, setTabela] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

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
    if (!value.trim()) { setJsonError(null); return true; }
    try { JSON.parse(value); setJsonError(null); return true; }
    catch (e: any) { setJsonError(e.message || "JSON inválido"); return false; }
  };

  const handlePayloadChange = (value: string) => {
    setPayloadJson(value);
    validateJson(value);
  };

  const handleAcaoChange = (value: string) => {
    setNome(value);
    const suggested = gerarPayloadSugerido(value);
    setPayloadJson(suggested);
    setJsonError(null);
  };

  const resetForm = () => {
    setNome(""); setUrl(""); setPayloadJson(""); setTabela(""); setJsonError(null); setEditingId(null);
  };

  const handleOpenEdit = (wh: any) => {
    setEditingId(wh.id);
    setNome(wh.nome || wh.evento || "");
    setUrl(wh.url || "");
    setPayloadJson(wh.payload_json || "");
    setTabela(wh.tabela || "");
    setJsonError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim() || !url.trim() || !empresaId) return;
    if (payloadJson.trim() && !validateJson(payloadJson)) {
      toast.error("O JSON do payload é inválido. Corrija antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        url: url.trim(),
        evento: nome.trim(),
        tabela: null,
        payload_json: payloadJson.trim() || null,
        campo_resposta: "resultado",
        comportamento: null,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from('webhooks_empresa')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success("Webhook atualizado com sucesso!");
      } else {
        // Check if webhook already exists for this action
        const { data: existing } = await (supabase as any)
          .from('webhooks_empresa')
          .select('id')
          .eq('empresa_id', empresaId)
          .eq('nome', nome.trim())
          .limit(1);
        if (existing && existing.length > 0) {
          toast.error(`Já existe um webhook configurado para a ação "${nome}". Edite o existente.`);
          setSaving(false);
          return;
        }
        const { error } = await (supabase as any)
          .from('webhooks_empresa')
          .insert({ ...payload, empresa_id: empresaId, ativo: true });
        if (error) throw error;
        toast.success("Webhook criado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar webhook");
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
    setDeleteTarget(null);
  };

  const getRecordLabel = (record: any, tabelaName: string): string => {
    switch (tabelaName) {
      case "lancamentos": return `${record.descricao} - R$ ${record.valor}`;
      case "clientes": return `${record.nome}${record.email ? ` (${record.email})` : ""}`;
      case "fornecedores": return `${record.nome}${record.email ? ` (${record.email})` : ""}`;
      case "categorias": return `${record.nome} (${record.tipo})`;
      case "contas_bancarias": return `${record.nome}${record.banco ? ` - ${record.banco}` : ""}`;
      case "formas_pagamento": return record.descricao;
      default: return record.nome || record.descricao || record.id;
    }
  };

  const buildTestPayload = (wh: any, record: any) => {
    const t = wh.tabela;
    const base: Record<string, any> = {
      empresa_id: empresaId,
      evento: wh.nome || wh.evento,
      tabela: t,
      registro: record.id,
      acao: "teste",
      descricao: record.descricao || record.nome || "",
    };

    if (t === "lancamentos") {
      base.valor = record.valor;
      base.data = record.data_vencimento;
      base.descricao = record.descricao;
    }

    base.usuario = {
      id: user?.id || "test",
      nome: userProfile?.nome || "Super Admin (Teste)",
      email: userProfile?.email || "teste@sistema.com",
      telefone: userProfile?.telefone || "",
    };

    return base;
  };

  const openTestDialog = async (wh: any) => {
    if (!wh.tabela) {
      // No table configured (e.g. Suporte Técnico), fire directly with generic test data
      handleTestWebhookDirect(wh);
      return;
    }
    setTestWebhook(wh);
    setSelectedTestRecord("");
    setTestDialogOpen(true);
    setTestRecordsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from(wh.tabela)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setTestRecords(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar registros: " + err.message);
      setTestRecords([]);
    } finally {
      setTestRecordsLoading(false);
    }
  };

  const handleTestWebhookDirect = async (wh: any) => {
    setTesting(wh.id);
    try {
      const { data, error } = await supabase.functions.invoke("fire-webhook", {
        body: {
          empresa_id: empresaId,
          evento: wh.nome || wh.evento,
          tabela: wh.tabela || null,
          descricao: "[TESTE] Disparo de teste do webhook",
          registro: "test-id-000",
          usuario: {
            id: user?.id || "test",
            nome: userProfile?.nome || "Super Admin (Teste)",
            email: userProfile?.email || "teste@sistema.com",
            telefone: userProfile?.telefone || "",
          },
          acao: "teste",
        },
      });
      if (error) throw error;
      const fired = data?.webhooks_fired || 0;
      if (fired > 0) {
        const r = data.results?.[0];
        const resultado = r?.campo_resposta_value;
        toast.success(`Webhook disparado! ${resultado !== undefined && resultado !== null ? resultado : `Status: ${r?.status || "OK"}`}`);
      } else {
        toast.warning("Nenhum webhook correspondente encontrado para disparar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao testar webhook");
    } finally {
      setTesting(null);
    }
  };

  const handleTestWithRecord = async () => {
    if (!testWebhook || !selectedTestRecord) return;
    const record = testRecords.find(r => r.id === selectedTestRecord);
    if (!record) return;

    setTesting(testWebhook.id);
    setTestDialogOpen(false);
    try {
      const body = buildTestPayload(testWebhook, record);
      body.descricao = `[TESTE] ${body.descricao}`;

      const { data, error } = await supabase.functions.invoke("fire-webhook", { body });
      if (error) throw error;
      const fired = data?.webhooks_fired || 0;
      if (fired > 0) {
        const r = data.results?.[0];
        const resultado = r?.campo_resposta_value;
        toast.success(`Teste disparado com dados reais! ${resultado !== undefined && resultado !== null ? resultado : `Status: ${r?.status || "OK"}`}`);
      } else {
        toast.warning("Nenhum webhook correspondente encontrado para disparar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao testar webhook");
    } finally {
      setTesting(null);
    }
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
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openTestDialog(wh)} disabled={testing === wh.id}>
                            {testing === wh.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Testar webhook</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(wh)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(wh.id, wh.ativo)}>
                      {wh.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ id: wh.id, nome: wh.nome || wh.evento })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {wh.payload_json && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver payload</summary>
                    <div className="relative mt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground z-10"
                        onClick={() => {
                          try {
                            const formatted = JSON.stringify(JSON.parse(wh.payload_json), null, 2);
                            navigator.clipboard.writeText(formatted);
                            toast.success("JSON copiado!");
                          } catch {
                            navigator.clipboard.writeText(wh.payload_json);
                            toast.success("JSON copiado!");
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <pre className="bg-muted p-2 rounded-lg overflow-x-auto text-[11px] pr-8">{(() => {
                        try { return JSON.stringify(JSON.parse(wh.payload_json), null, 2); } catch { return wh.payload_json; }
                      })()}</pre>
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Webhook" : "Novo Webhook"}</DialogTitle>
            <DialogDescription>Configure a ação de suporte e a URL que receberá as notificações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ação *</Label>
              <Select value={nome} onValueChange={handleAcaoChange} disabled={!!editingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ação" />
                </SelectTrigger>
                <SelectContent>
                  {acoesDisponiveis
                    .filter(a => editingId ? true : !webhooks.some(w => w.nome === a.value))
                    .map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL do Webhook *</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Payload JSON</Label>
                {payloadJson.trim() && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(payloadJson);
                      toast.success("JSON copiado!");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Textarea
                value={payloadJson}
                onChange={e => handlePayloadChange(e.target.value)}
                placeholder="Selecione a ação para gerar automaticamente"
                className="font-mono text-xs min-h-[120px]"
              />
              {jsonError && (
                <div className="flex items-center gap-1 mt-1 text-destructive text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving || !nome.trim() || !url.trim() || !!jsonError} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : editingId ? "Salvar Alterações" : "Criar Webhook"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o webhook "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget.id)} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Dialog - select real record */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Webhook</DialogTitle>
            <DialogDescription>
              Selecione um registro real da tabela "{testWebhook?.tabela}" para enviar como teste. O payload incluirá a marcação [TESTE].
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {testRecordsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : testRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro encontrado nesta tabela.</p>
            ) : (
              <div>
                <Label>Registro</Label>
                <Select value={selectedTestRecord} onValueChange={setSelectedTestRecord}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um registro" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {testRecords.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {getRecordLabel(r, testWebhook?.tabela || "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleTestWithRecord} disabled={!selectedTestRecord || testing === testWebhook?.id}>
                {testing === testWebhook?.id ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Disparando...</> : <><Zap className="h-4 w-4 mr-2" /> Disparar Teste</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhooksConfig;
