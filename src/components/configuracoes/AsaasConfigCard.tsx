import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Copy, Check, Webhook, Shield, RefreshCw } from "lucide-react";

const AsaasConfigCard = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    id: "",
    api_key: "",
    ambiente: "producao",
    webhook_token: "",
    ativo: true,
  });
  const [exists, setExists] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook?token=${config.webhook_token}`;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("asaas_config")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        setConfig({
          id: data.id,
          api_key: data.api_key || "",
          ambiente: data.ambiente || "producao",
          webhook_token: data.webhook_token || "",
          ativo: data.ativo ?? true,
        });
        setExists(true);
      }
    } catch {
      // No config yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.api_key.trim()) {
      toast.error("Informe a API Key do Asaas.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        api_key: config.api_key.trim(),
        ambiente: config.ambiente,
        ativo: config.ativo,
      };

      if (exists) {
        const { error } = await (supabase as any)
          .from("asaas_config")
          .update(payload)
          .eq("id", config.id);
        if (error) throw error;
        toast.success("Configuração do Asaas atualizada.");
      } else {
        const { data, error } = await (supabase as any)
          .from("asaas_config")
          .insert({ ...payload, webhook_token: crypto.randomUUID() })
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setConfig(prev => ({ ...prev, id: data.id, webhook_token: data.webhook_token }));
          setExists(true);
        }
        toast.success("Configuração do Asaas salva.");
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
        .from("asaas_config")
        .update({ webhook_token: newToken })
        .eq("id", config.id);
      if (error) throw error;
      setConfig(prev => ({ ...prev, webhook_token: newToken }));
      toast.success("Token do webhook regenerado. Atualize a URL no Asaas.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao regenerar token.");
    }
  };
  
  const handleTest = async () => {
    if (!config.api_key.trim()) {
      toast.error("Informe a API Key para testar.");
      return;
    }
    
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-asaas", {
        body: { 
          api_key: config.api_key.trim(),
          ambiente: config.ambiente 
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || "Conexão com o Asaas validada com sucesso!");
      } else {
        toast.error(data?.message || "Erro ao validar conexão com o Asaas.");
      }
    } catch (error: any) {
      console.error("Erro ao testar conexão:", error);
      toast.error(error.message || "Erro ao testar conexão com o Asaas.");
    } finally {
      setTesting(false);
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
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="flex items-center gap-2">
              Integração Asaas
              {exists && (
                <Badge variant={config.ativo ? "default" : "secondary"} className="text-[10px]">
                  {config.ativo ? "Ativa" : "Inativa"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure a integração com o Asaas para controle automático de assinaturas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>API Key do Asaas *</Label>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              value={config.api_key}
              onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="$aact_..."
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
            Encontre sua API Key no painel do Asaas → Integrações → API
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
              Configure esta URL no painel do Asaas → Integrações → Webhooks
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
          <p className="text-xs font-semibold">Eventos suportados:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>• <strong>PAYMENT_CONFIRMED / RECEIVED</strong> → Assinatura ativada</li>
            <li>• <strong>PAYMENT_OVERDUE</strong> → Assinatura vencida</li>
            <li>• <strong>PAYMENT_DELETED / REFUNDED</strong> → Assinatura cancelada</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            O sistema identifica o usuário pelo <strong>Customer ID</strong> do Asaas ou pelo <strong>e-mail</strong> no campo "Referência Externa" da cobrança.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleTest} 
            disabled={testing || !config.api_key.trim()}
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              "Testar Conexão"
            )}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : exists ? "Atualizar" : "Salvar Configuração"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AsaasConfigCard;
