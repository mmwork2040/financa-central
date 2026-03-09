import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Eye, EyeOff, Webhook, Copy, CheckCheck } from "lucide-react";

const StripeConfigCard = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState({
    api_key: "",
    webhook_secret: "",
    ativo: false,
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("URL do webhook copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="flex items-center gap-2">
              Integração Stripe
              <Badge variant={config.ativo ? "default" : "secondary"} className="text-[10px]">
                {config.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Configure a integração com o Stripe para cobranças e assinaturas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Secret Key do Stripe *</Label>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              value={config.api_key}
              onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="sk_live_..."
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
            Encontre sua Secret Key no painel do Stripe → Developers → API Keys
          </p>
        </div>

        <div className="space-y-2">
          <Label>Webhook Signing Secret</Label>
          <Input
            type="password"
            value={config.webhook_secret}
            onChange={(e) => setConfig(prev => ({ ...prev, webhook_secret: e.target.value }))}
            placeholder="whsec_..."
          />
          <p className="text-xs text-muted-foreground">
            Configure no Stripe → Developers → Webhooks
          </p>
        </div>

        <div className="space-y-2">
          <Label>URL do Webhook (copie para o Stripe)</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={webhookUrl}
              className="text-xs font-mono bg-muted/40"
            />
            <Button variant="outline" size="icon" onClick={handleCopyWebhook} className="shrink-0">
              {copied ? <CheckCheck className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole esta URL no painel do Stripe → Developers → Webhooks → Add endpoint
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Integração Ativa</Label>
          <Switch
            checked={config.ativo}
            onCheckedChange={(v) => setConfig(prev => ({ ...prev, ativo: v }))}
          />
        </div>

        <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Webhook className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold">Eventos suportados:</p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>• <strong>checkout.session.completed</strong> → Assinatura ativada</li>
            <li>• <strong>invoice.paid</strong> → Pagamento confirmado</li>
            <li>• <strong>invoice.payment_failed</strong> → Pagamento falhou</li>
            <li>• <strong>customer.subscription.deleted</strong> → Assinatura cancelada</li>
            <li>• <strong>customer.subscription.updated</strong> → Assinatura atualizada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConfigCard;
