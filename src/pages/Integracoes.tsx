
import React, { useState, useEffect } from "react";
import { Plug, Loader2, ExternalLink, BookOpen, ChevronRight, ChevronLeft, Check, CreditCard, Globe, ShoppingCart, BarChart3, Megaphone, DollarSign, Zap, Target, Activity, CheckCircle2, XCircle, AlertTriangle, Pencil, Copy, Webhook, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PLATAFORMAS = [
  {
    id: "hotmart", name: "Hotmart", description: "Plataforma de produtos digitais",
    icon: ShoppingCart, color: "bg-orange-100 text-orange-600",
    site: "https://app.hotmart.com/tools/webhook", doc: "https://developers.hotmart.com/docs/pt-BR/",
    events: ["purchase_approved", "purchase_refunded", "purchase_canceled", "purchase_delayed", "purchase_expired", "subscription_cancellation"],
    steps: [
      "Acesse o painel Hotmart e vá em Ferramentas → Webhooks",
      "Clique em 'Adicionar Webhook' e cole a URL abaixo",
      "Selecione os eventos que deseja receber (ex: compra aprovada, reembolso)",
      "Salve e pronto! O sistema passará a escutar os eventos automaticamente",
    ],
    needsSecret: false,
    webhookOnly: true,
    keyValidation: { hint: "" },
  },
  {
    id: "eduzz", name: "Eduzz", description: "Venda de infoprodutos",
    icon: Zap, color: "bg-blue-100 text-blue-600",
    site: "https://orbita.eduzz.com/producer/config-api", doc: "https://developer.eduzz.com/",
    events: ["sale_approved", "sale_refunded", "sale_canceled", "sale_waiting_payment"],
    steps: [
      "Acesse o Órbita Eduzz e vá em Configurações → API",
      "Gere uma nova chave de API",
      "Copie o Token gerado (API Key)",
      "Cole o token no campo abaixo",
    ],
    needsSecret: false,
    keyValidation: { hint: "Token alfanumérico" },
  },
  {
    id: "monetizze", name: "Monetizze", description: "Afiliados e produtos digitais",
    icon: DollarSign, color: "bg-green-100 text-green-600",
    site: "https://app.monetizze.com.br/developer/api", doc: "https://docs.monetizze.com.br/",
    events: ["sale_completed", "sale_refunded", "sale_canceled", "sale_awaiting"],
    steps: [
      "Acesse o painel Monetizze → Desenvolvedor → API",
      "Gere uma nova chave de API",
      "Copie a chave gerada",
      "Cole no campo API Key abaixo",
    ],
    needsSecret: false,
    keyValidation: { hint: "Chave alfanumérica" },
  },
  {
    id: "stripe", name: "Stripe", description: "Pagamentos internacionais",
    icon: CreditCard, color: "bg-purple-100 text-purple-600",
    site: "https://dashboard.stripe.com/apikeys", doc: "https://docs.stripe.com/api",
    events: ["payment_intent.succeeded", "payment_intent.payment_failed", "charge.refunded", "invoice.paid", "invoice.payment_failed"],
    steps: [
      "Acesse o Dashboard Stripe → Developers → API Keys",
      "Copie a Secret Key (começa com sk_live_ ou sk_test_)",
      "Cole como API Key no campo abaixo",
      "O Publishable Key pode ser usado como Secret (opcional)",
    ],
    needsSecret: true,
    keyValidation: { prefix: "sk_", hint: "Deve começar com sk_live_ ou sk_test_" },
  },
  {
    id: "paypal", name: "PayPal", description: "Pagamentos globais",
    icon: Globe, color: "bg-sky-100 text-sky-600",
    site: "https://developer.paypal.com/dashboard/applications", doc: "https://developer.paypal.com/docs/api/overview/",
    events: ["PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.DENIED"],
    steps: [
      "Acesse o PayPal Developer → Dashboard → Apps & Credentials",
      "Crie um novo App ou selecione um existente",
      "Copie o Client ID (API Key) e o Secret",
      "Cole os valores nos campos abaixo",
    ],
    needsSecret: true,
    keyValidation: { hint: "Client ID alfanumérico" },
  },
  {
    id: "asaas", name: "Asaas", description: "Cobranças e pagamentos",
    icon: DollarSign, color: "bg-emerald-100 text-emerald-600",
    site: "https://www.asaas.com/config/api", doc: "https://docs.asaas.com/",
    events: ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_REFUNDED", "PAYMENT_OVERDUE"],
    steps: [
      "Acesse o painel Asaas → Configurações → Integrações → API",
      "Gere uma nova chave de API",
      "Copie a chave (começa com $aact_...)",
      "Cole no campo API Key abaixo",
    ],
    needsSecret: false,
    keyValidation: { prefix: "$aact_", hint: "Deve começar com $aact_" },
  },
  {
    id: "meta_ads", name: "Meta Ads", description: "Facebook & Instagram Ads",
    icon: Megaphone, color: "bg-blue-100 text-blue-700",
    site: "https://business.facebook.com/settings", doc: "https://developers.facebook.com/docs/marketing-apis/",
    events: ["ad_spend_update", "campaign_status_change"],
    steps: [
      "Acesse o Meta Business Suite → Configurações → Integrações",
      "Vá em developers.facebook.com e crie um App",
      "Gere um Access Token com permissão ads_read",
      "Cole o Access Token como API Key abaixo",
    ],
    needsSecret: false,
    keyValidation: { hint: "Access Token alfanumérico" },
  },
  {
    id: "google_ads", name: "Google Ads", description: "Anúncios no Google",
    icon: Target, color: "bg-red-100 text-red-600",
    site: "https://console.cloud.google.com/apis/credentials", doc: "https://developers.google.com/google-ads/api/docs/start",
    events: ["ad_spend_update", "campaign_status_change"],
    steps: [
      "Acesse o Google Cloud Console → APIs & Services → Credentials",
      "Crie uma nova API Key ou OAuth Client",
      "Ative a Google Ads API no projeto",
      "Cole a API Key no campo abaixo",
    ],
    needsSecret: true,
    keyValidation: { prefix: "AIza", hint: "Deve começar com AIza" },
  },
];

const Integracoes = () => {
  const { empresaId } = useAuth();
  const [integracoes, setIntegracoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [ambiente, setAmbiente] = useState("producao");
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ plataforma: string; status: string; message: string } | null>(null);
  const [webhookExpanded, setWebhookExpanded] = useState<string | null>(null);

  const getWebhookUrl = (platformId: string) => {
    if (!empresaId) return "";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/webhook-receiver/${platformId}?empresa_id=${empresaId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copiada para a área de transferência!");
  };

  useEffect(() => {
    fetchIntegracoes();
  }, []);

  const currentPlat = PLATAFORMAS.find(p => p.id === connectDialog);

  const validateApiKey = (key: string, plat: typeof PLATAFORMAS[0]): string => {
    if (!key.trim()) return "API Key é obrigatória";
    if (key.trim().length < 5) return "API Key parece ser muito curta";
    if (plat.keyValidation?.prefix && !key.trim().startsWith(plat.keyValidation.prefix)) {
      return plat.keyValidation.hint || `Formato inválido`;
    }
    return "";
  };

  const openWizard = (platId: string, isEdit = false) => {
    setConnectDialog(platId);
    setEditMode(isEdit);
    setWizardStep(isEdit ? 1 : 0);
    setApiKey("");
    setApiSecret("");
    const integ = integracoes.find((i: any) => i.plataforma === platId);
    setAmbiente(integ?.ambiente || "producao");
    setKeyError("");
  };

  const closeWizard = () => {
    setConnectDialog(null);
    setEditMode(false);
    setWizardStep(0);
    setApiKey("");
    setApiSecret("");
    setKeyError("");
  };

  const fetchIntegracoes = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('integracoes')
        .select('plataforma, ativo, ambiente, created_at');
      if (error) throw error;
      setIntegracoes(data || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (plataformaId: string) => {
    const integ = integracoes.find((i: any) => i.plataforma === plataformaId);
    return integ?.ativo ? 'connected' : integ ? 'disconnected' : 'none';
  };

  const handleConnect = async () => {
    if (!connectDialog || !empresaId || !currentPlat) return;
    const isWebhookOnly = !!(currentPlat as any).webhookOnly;
    if (!isWebhookOnly && !apiKey.trim()) return;
    if (!isWebhookOnly) {
      const validationError = validateApiKey(apiKey, currentPlat);
      if (validationError) {
        setKeyError(validationError);
        return;
      }
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('integracoes')
        .upsert({
          empresa_id: empresaId,
          plataforma: connectDialog,
          api_key_encrypted: isWebhookOnly ? 'webhook_only' : apiKey.trim(),
          api_secret_encrypted: apiSecret.trim() || null,
          ambiente,
          ativo: true,
        }, { onConflict: 'empresa_id,plataforma' });

      if (error) throw error;
      toast.success("Integração conectada com sucesso!");
      closeWizard();
      fetchIntegracoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (plataforma: string) => {
    try {
      const { error } = await (supabase as any)
        .from('integracoes')
        .update({ ativo: false })
        .eq('plataforma', plataforma);
      if (error) throw error;
      toast.success("Integração desconectada.");
      setTestResult(null);
      fetchIntegracoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar");
    }
  };

  const handleTestConnection = async (plataforma: string) => {
    if (!empresaId) return;
    setTesting(plataforma);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      
      const res = await supabase.functions.invoke("test-integration", {
        body: { plataforma, empresa_id: empresaId },
      });
      
      if (res.error) throw res.error;
      const result = res.data;
      setTestResult({ plataforma, status: result.status, message: result.message });
      
      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "warning") {
        toast.warning(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      const msg = error.message || "Erro ao testar conexão";
      setTestResult({ plataforma, status: "error", message: msg });
      toast.error(msg);
    } finally {
      setTesting(null);
    }
  };

  const MOCK_WEBHOOKS: Record<string, any> = {
    hotmart: {
      event: "PURCHASE_APPROVED",
      data: {
        purchase: { status: "approved", price: { value: 9900 }, order_date: new Date().toISOString() },
        buyer: { name: "Cliente Teste", email: "teste@exemplo.com" },
        product: { name: "Produto de Teste" },
      },
    },
    eduzz: {
      event_type: "sale",
      trans_status: "3",
      trans_value: 99.0,
      trans_fee: 9.9,
      cus_name: "Cliente Teste",
      product_name: "Produto de Teste",
      trans_createdate: new Date().toISOString(),
    },
    monetizze: {
      evento: { tipo_evento: "2", venda: { valor: 99.0, comissao: 9.9, data: new Date().toISOString() } },
      comprador: { nome: "Cliente Teste" },
      produto: { nome: "Produto de Teste" },
    },
  };

  const handleTestWebhook = async (plataforma: string) => {
    if (!empresaId) return;
    setTestingWebhook(plataforma);
    setTestResult(null);
    try {
      const webhookUrl = getWebhookUrl(plataforma);
      const mockData = MOCK_WEBHOOKS[plataforma];
      if (!mockData) {
        toast.info("Teste de webhook não disponível para esta plataforma.");
        return;
      }
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData),
      });
      const result = await res.json();
      if (result.success) {
        setTestResult({ plataforma, status: "success", message: `Webhook simulado! Venda registrada (ID: ${result.venda_id?.slice(0, 8)}...)` });
        toast.success("Webhook de teste processado com sucesso! Venda registrada.");
      } else {
        setTestResult({ plataforma, status: "error", message: result.error || "Erro ao processar webhook" });
        toast.error(result.error || "Erro ao processar webhook de teste");
      }
    } catch (error: any) {
      setTestResult({ plataforma, status: "error", message: error.message });
      toast.error("Erro ao enviar webhook de teste: " + error.message);
    } finally {
      setTestingWebhook(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <Plug className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Integrações</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Conecte suas plataformas de vendas digitais</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATAFORMAS.map(plat => {
            const status = getStatus(plat.id);
            const Icon = plat.icon;
            return (
              <Card key={plat.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-lg p-2.5 ${plat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm">{plat.name}</h3>
                        {status === 'connected' && <Badge variant="outline" className="border-green-300 text-green-700 text-[10px] px-1.5">Conectado</Badge>}
                        {status === 'disconnected' && <Badge variant="outline" className="border-red-300 text-red-600 text-[10px] px-1.5">Desconectado</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{plat.description}</p>
                      <div className="flex items-center gap-3">
                        <a href={plat.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Painel
                        </a>
                        {plat.doc && (
                          <a href={plat.doc} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary hover:underline">
                            <BookOpen className="h-3 w-3" /> Docs
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {status === 'connected' ? (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleTestConnection(plat.id)}
                              disabled={testing === plat.id}
                            >
                              {testing === plat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Testar Conexão</p></TooltipContent>
                        </Tooltip>
                        {MOCK_WEBHOOKS[plat.id] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleTestWebhook(plat.id)}
                                disabled={testingWebhook === plat.id}
                              >
                                {testingWebhook === plat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Simular Venda</p></TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openWizard(plat.id, true)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDisconnect(plat.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Desconectar</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => openWizard(plat.id)}>Conectar</Button>
                    )}
                  </div>
                  {/* Webhook URL section for connected integrations */}
                  {status === 'connected' && (
                    <div className="mt-2">
                      <button
                        onClick={() => setWebhookExpanded(webhookExpanded === plat.id ? null : plat.id)}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
                      >
                        <Webhook className="h-3 w-3" />
                        <span className="font-medium">Webhook URL</span>
                        <ChevronRight className={`h-3 w-3 ml-auto transition-transform ${webhookExpanded === plat.id ? 'rotate-90' : ''}`} />
                      </button>
                      {webhookExpanded === plat.id && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-1">
                            <Input
                              readOnly
                              value={getWebhookUrl(plat.id)}
                              className="text-[10px] h-7 font-mono bg-muted"
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => copyToClipboard(getWebhookUrl(plat.id))}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Copiar URL</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                              <Info className="h-3 w-3" /> Eventos suportados:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {plat.events?.map(ev => (
                                <Badge key={ev} variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
                                  {ev}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Cole esta URL no painel da {plat.name} como Webhook/Postback URL.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {testResult && testResult.plataforma === plat.id && (
                    <div className={`mt-2 flex items-center gap-2 text-xs rounded-md p-2 ${
                      testResult.status === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' :
                      testResult.status === 'warning' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                      'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                    }`}>
                      {testResult.status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> :
                       testResult.status === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> :
                       <XCircle className="h-3.5 w-3.5 shrink-0" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={!!connectDialog} onOpenChange={(o) => !o && closeWizard()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {currentPlat && (() => {
                const Icon = currentPlat.icon;
                return (
                  <div className={`shrink-0 rounded-lg p-2 ${currentPlat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                );
              })()}
              <div>
                <DialogTitle className="text-left">{editMode ? 'Editar' : 'Conectar'} {currentPlat?.name}</DialogTitle>
                <DialogDescription className="text-left">
                  {editMode ? "Atualize suas credenciais" : wizardStep === 0 ? "Siga o passo a passo para obter suas credenciais" : "Insira suas credenciais para finalizar"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 py-2">
            <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${wizardStep === 0 ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
              {wizardStep > 0 ? <Check className="h-3.5 w-3.5" /> : "1"}
            </div>
            <div className="h-0.5 flex-1 bg-border rounded" />
            <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${wizardStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
          </div>

          {wizardStep === 0 && currentPlat && (
            <div className="space-y-4">
              {/* Webhook URL - show first so user can configure it in the platform */}
              {empresaId && currentPlat.events && currentPlat.events.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Webhook className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">Sua Webhook URL (cole na {currentPlat.name}):</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      readOnly
                      value={getWebhookUrl(currentPlat.id)}
                      className="text-[10px] h-7 font-mono bg-background"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => copyToClipboard(getWebhookUrl(currentPlat.id))}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Copiar URL</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Configure esta URL como Webhook/Postback na {currentPlat.name} antes de gerar as credenciais.
                  </p>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Eventos suportados:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentPlat.events.map(ev => (
                        <Badge key={ev} variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">{ev}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {currentPlat.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <a href={currentPlat.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir painel da plataforma
                </a>
                {currentPlat.doc && (
                  <a href={currentPlat.doc} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:underline">
                    <BookOpen className="h-3.5 w-3.5" /> Ver documentação
                  </a>
                )}
              </div>
              {(currentPlat as any).webhookOnly ? (
                <Button onClick={handleConnect} disabled={saving} className="w-full">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : <><Check className="h-4 w-4 mr-1" /> Ativar integração</>}
                </Button>
              ) : (
                <Button onClick={() => setWizardStep(1)} className="w-full">
                  Já tenho as credenciais <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {wizardStep === 1 && currentPlat && (
            <div className="space-y-4">
              <div>
                <Label>API Key *</Label>
                <Input
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setKeyError(""); }}
                  placeholder={currentPlat.keyValidation?.hint || "Cole sua API Key aqui"}
                  autoFocus
                  className={keyError ? "border-destructive" : ""}
                />
                {keyError && <p className="text-xs text-destructive mt-1">{keyError}</p>}
                {!keyError && currentPlat.keyValidation?.hint && (
                  <p className="text-xs text-muted-foreground mt-1">{currentPlat.keyValidation.hint}</p>
                )}
              </div>
              {currentPlat.needsSecret && (
                <div>
                  <Label>API Secret</Label>
                  <Input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="Cole o secret aqui" />
                </div>
              )}
              <div>
                <Label>Ambiente</Label>
                <Select value={ambiente} onValueChange={setAmbiente}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producao">Produção</SelectItem>
                    <SelectItem value="sandbox">Sandbox / Teste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {!editMode && (
                  <Button variant="outline" onClick={() => setWizardStep(0)} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                )}
                <Button onClick={handleConnect} disabled={saving || !apiKey.trim()} className="flex-1">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : <><Check className="h-4 w-4 mr-1" /> {editMode ? 'Salvar' : 'Conectar'}</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Integracoes;
