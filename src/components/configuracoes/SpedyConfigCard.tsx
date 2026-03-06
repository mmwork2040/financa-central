import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Copy, Check, Webhook, FileText, RefreshCw } from "lucide-react";

const SpedyConfigCard = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState({
    id: "",
    api_url: "https://sandbox-api.spedy.com.br/v1",
    api_key: "",
    ambiente: "sandbox",
    webhook_token: "",
    ativo: false,
  });
  const [exists, setExists] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spedy-webhook?token=${config.webhook_token}`;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("spedy_config")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        setConfig({
          id: data.id,
          api_url: data.api_url || "https://sandbox-api.spedy.com.br/v1",
          api_key: data.api_key || "",
          ambiente: data.ambiente || "sandbox",
          webhook_token: data.webhook_token || "",
          ativo: data.ativo ?? false,
        });
        setExists(true);
      }
    } catch {
      // No config yet
    } finally {
      setLoading(false);
    }
  };

  const handleAmbienteChange = (value: string) => {
    const url = value === "producao"
      ? "https://api.spedy.com.br/v1"
      : "https://sandbox-api.spedy.com.br/v1";
    setConfig(prev => ({ ...prev, ambiente: value, api_url: url }));
  };

  const handleSave = async () => {
    if (!config.api_key.trim()) {
      toast.error("Informe a API Key da Spedy.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        api_url: config.api_url.trim(),
        api_key: config.api_key.trim(),
        ambiente: config.ambiente,
        ativo: config.ativo,
      };

      if (exists) {
        const { error } = await (supabase as any)
          .from("spedy_config")
          .update(payload)
          .eq("id", config.id);
        if (error) throw error;
        toast.success("Configuração da Spedy atualizada.");
      } else {
        const { data, error } = await (supabase as any)
          .from("spedy_config")
          .insert({ ...payload, webhook_token: crypto.randomUUID() })
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setConfig(prev => ({ ...prev, id: data.id, webhook_token: data.webhook_token }));
          setExists(true);
        }
        toast.success("Configuração da Spedy salva.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  const regenerateToken = async () => {
    if (!exists) return;
    const newToken = crypto.randomUUID();
    try {
      const { error } = await (supabase as any)
        .from("spedy_config")
        .update({ webhook_token: newToken })
        .eq("id", config.id);
      if (error) throw error;
      setConfig(prev => ({ ...prev, webhook_token: newToken }));
      toast.success("Token do webhook regenerado. Atualize a URL na Spedy.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao regenerar token.");
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("URL do webhook copiada!");
    setTimeout(() => setCopied(false), 2000);
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="flex items-center gap-2">
              Integração Spedy (NF-e / NFS-e)
              {exists && (
                <Badge variant={config.ativo ? "default" : "secondary"} className="text-[10px]">
                  {config.ativo ? "Ativa" : "Inativa"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure a emissão automática de notas fiscais via Spedy
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Ambiente</Label>
          <Select value={config.ambiente} onValueChange={handleAmbienteChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
              <SelectItem value="producao">Produção</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>URL da API</Label>
          <Input
            value={config.api_url}
            onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
            placeholder="https://sandbox-api.spedy.com.br/v1"
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Preenchida automaticamente ao trocar o ambiente
          </p>
        </div>

        <div className="space-y-2">
          <Label>API Key da Spedy *</Label>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              value={config.api_key}
              onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="spedy_..."
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Encontre sua API Key no painel da Spedy → Configurações → Chaves de API
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Integração Ativa</Label>
          <Switch
            checked={config.ativo}
            onCheckedChange={(v) => setConfig(prev => ({ ...prev, ativo: v }))}
          />
        </div>

        {exists && config.webhook_token && (
          <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">URL do Webhook</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure esta URL no painel da Spedy para receber atualizações de status das notas
            </p>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button variant="outline" size="sm" onClick={copyWebhookUrl} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={regenerateToken} className="gap-1.5 text-xs">
              <RefreshCw className="h-3 w-3" /> Regenerar token
            </Button>
          </div>
        )}

        <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
          <p className="text-xs font-semibold">Como funciona:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>• Ao emitir uma nota, o sistema envia os dados da venda para a Spedy</li>
            <li>• A Spedy processa e envia a nota para a SEFAZ/Prefeitura</li>
            <li>• O webhook retorna o status: <strong>Autorizada</strong>, <strong>Rejeitada</strong> ou <strong>Cancelada</strong></li>
            <li>• Os links do PDF (DANFE) e XML ficam disponíveis na venda</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : exists ? "Atualizar" : "Salvar Configuração"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpedyConfigCard;
