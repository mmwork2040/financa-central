
import React, { useState, useEffect, useRef } from "react";
import { Plug, Loader2, ExternalLink, BookOpen, ChevronRight, ChevronLeft, Check, CreditCard, Globe, ShoppingCart, Megaphone, DollarSign, Zap, Target, Activity, CheckCircle2, XCircle, AlertTriangle, Pencil, Copy, Webhook, Info, MessageCircle, Send, Brain, Star, StarOff, ShieldAlert, FileText, Landmark } from "lucide-react";
import SpedyConfigCard from "@/components/configuracoes/SpedyConfigCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PlataformaCategoria = "vendas" | "pagamentos" | "anuncios" | "comunicacao" | "ia" | "bancos" | "bancos";

interface Plataforma {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  site: string;
  doc?: string;
  events?: string[];
  steps: string[];
  needsSecret: boolean;
  webhookOnly?: boolean;
  skipAutoTest?: boolean;
  usesWebhook?: boolean;
  keyValidation?: { prefix?: string; hint: string };
  categoria: PlataformaCategoria;
}

const LLM_MODELS: Record<string, { value: string; label: string }[]> = {
  lovable_ai: [
    { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Rápido)" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (Econômico)" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro" },
    { value: "openai/gpt-5", label: "GPT-5" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
    { value: "openai/gpt-5-nano", label: "GPT-5 Nano (Econômico)" },
    { value: "openai/gpt-5.2", label: "GPT-5.2 (Mais recente)" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "o1", label: "o1 (Raciocínio)" },
    { value: "o1-mini", label: "o1 Mini" },
  ],
  google_gemini: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  ],
  anthropic: [
    { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-opus", label: "Claude 3 Opus" },
    { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
    { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  ],
  deepseek: [
    { value: "deepseek-chat", label: "DeepSeek V3" },
    { value: "deepseek-reasoner", label: "DeepSeek R1 (Raciocínio)" },
  ],
};

const CATEGORIAS_INFO: Record<PlataformaCategoria, { label: string; icon: any }> = {
  vendas: { label: "Vendas", icon: ShoppingCart },
  pagamentos: { label: "Pagamentos", icon: CreditCard },
  anuncios: { label: "Anúncios", icon: Megaphone },
  comunicacao: { label: "Comunicação", icon: MessageCircle },
  ia: { label: "Inteligência Artificial", icon: Brain },
};

const PLATAFORMAS: Plataforma[] = [
  // --- Vendas Digitais ---
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
    needsSecret: false, webhookOnly: true, usesWebhook: true, keyValidation: { hint: "" },
    categoria: "vendas",
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
    needsSecret: false, usesWebhook: true, keyValidation: { hint: "Token alfanumérico" },
    categoria: "vendas",
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
    needsSecret: false, usesWebhook: true, keyValidation: { hint: "Chave alfanumérica" },
    categoria: "vendas",
  },
  {
    id: "kiwify", name: "Kiwify", description: "Plataforma de infoprodutos e cursos",
    icon: ShoppingCart, color: "bg-pink-100 text-pink-600",
    site: "https://dashboard.kiwify.com.br/settings/webhooks", doc: "https://docs.kiwify.com.br/",
    events: ["order_paid", "order_refunded", "order_chargedback", "order_waiting_payment"],
    steps: [
      "Acesse o Dashboard Kiwify → Configurações → Webhooks",
      "Clique em 'Adicionar Webhook' e cole a URL abaixo",
      "Selecione os eventos desejados (ex: Pedido Pago, Reembolso)",
      "Salve e pronto! As vendas serão registradas automaticamente",
    ],
    needsSecret: false, webhookOnly: true, usesWebhook: true, keyValidation: { hint: "" },
    categoria: "vendas",
  },
  {
    id: "hubla", name: "Hubla", description: "Plataforma de produtos digitais e assinaturas",
    icon: ShoppingCart, color: "bg-teal-100 text-teal-600",
    site: "https://app.hubla.com.br/settings/webhooks", doc: "https://developers.hubla.com.br/",
    events: ["purchase_approved", "purchase_refunded", "purchase_canceled", "subscription_cancellation"],
    steps: [
      "Acesse o Dashboard Hubla → Configurações → Webhooks",
      "Clique em 'Adicionar Webhook' e cole a URL abaixo",
      "Selecione os eventos desejados (ex: Compra Aprovada, Reembolso)",
      "Salve e pronto! As vendas serão registradas automaticamente",
    ],
    needsSecret: false, webhookOnly: true, usesWebhook: true, keyValidation: { hint: "" },
    categoria: "vendas",
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
    needsSecret: true, usesWebhook: true, keyValidation: { prefix: "sk_", hint: "Deve começar com sk_live_ ou sk_test_" },
    categoria: "pagamentos",
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
    needsSecret: true, usesWebhook: true, keyValidation: { hint: "Client ID alfanumérico" },
    categoria: "pagamentos",
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
    needsSecret: false, usesWebhook: true, keyValidation: { prefix: "$aact_", hint: "Deve começar com $aact_" },
    categoria: "pagamentos",
  },
  // --- Anúncios ---
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
    needsSecret: false, usesWebhook: false, keyValidation: { hint: "Access Token alfanumérico" },
    categoria: "anuncios",
  },
  {
    id: "google_ads", name: "Google Ads", description: "Anúncios no Google",
    icon: Target, color: "bg-red-100 text-red-600",
    site: "https://ads.google.com/aw/apicenter", doc: "https://developers.google.com/google-ads/api/docs/start",
    events: ["ad_spend_update", "campaign_status_change"],
    steps: [
      "Acesse console.cloud.google.com → APIs → Ative a Google Ads API",
      "Crie credenciais OAuth2 (Client ID e Client Secret)",
      "No MCC (ads.google.com), copie o Developer Token (Ferramentas → Centro de API)",
      "No OAuth Playground (developers.google.com/oauthplayground): selecione 'Google Ads API' na lista OU cole o scope https://www.googleapis.com/auth/adwords → Authorize → Exchange code → copie o Refresh Token",
      "Copie o Customer ID (número da conta, formato XXX-XXX-XXXX, sem hífens)",
    ],
    needsSecret: true, usesWebhook: false, skipAutoTest: true, keyValidation: { hint: "Developer Token do MCC (ex: AbCdEfG...)" },
    categoria: "anuncios",
  },
  // --- Comunicação ---
  {
    id: "whatsapp", name: "WhatsApp API", description: "API Oficial do WhatsApp Business",
    icon: MessageCircle, color: "bg-green-100 text-green-700",
    site: "https://business.facebook.com/settings/whatsapp-business", doc: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
    events: ["message_received", "message_delivered", "message_read"],
    steps: [
      "Acesse o Meta Business Suite → WhatsApp → Configurações da API",
      "Crie um App no developers.facebook.com com produto WhatsApp",
      "Gere um Access Token permanente para a API",
      "Cole o Access Token no campo API Key abaixo",
    ],
    needsSecret: false, usesWebhook: false, keyValidation: { hint: "Access Token do WhatsApp Cloud API" },
    categoria: "comunicacao",
  },
  {
    id: "telegram", name: "Telegram Bot", description: "Bot API do Telegram",
    icon: Send, color: "bg-sky-100 text-sky-600",
    site: "https://t.me/BotFather", doc: "https://core.telegram.org/bots/api",
    events: ["message", "callback_query", "command"],
    steps: [
      "Abra o Telegram e converse com o @BotFather",
      "Envie /newbot e siga as instruções para criar seu bot",
      "Copie o Token do bot gerado pelo BotFather",
      "Cole o token no campo API Key abaixo",
    ],
    needsSecret: false, usesWebhook: false, keyValidation: { hint: "Token no formato 123456:ABC-DEF..." },
    categoria: "comunicacao",
  },
  // --- Inteligência Artificial ---
  {
    id: "lovable_ai", name: "Lovable AI", description: "IA integrada (sem configuração de chave)",
    icon: Brain, color: "bg-violet-100 text-violet-700",
    site: "https://docs.lovable.dev/features/ai", doc: "https://docs.lovable.dev/features/ai",
    steps: [
      "A Lovable AI já está pré-configurada no sistema",
      "Basta ativar a integração clicando no botão abaixo",
      "Nenhuma chave de API é necessária",
      "Modelos disponíveis: Gemini, GPT-5 e outros",
    ],
    needsSecret: false, webhookOnly: true, usesWebhook: false,
    keyValidation: { hint: "" },
    categoria: "ia",
  },
  {
    id: "openai", name: "OpenAI", description: "GPT-4o, GPT-4, GPT-3.5 e outros modelos",
    icon: Brain, color: "bg-gray-100 text-gray-800",
    site: "https://platform.openai.com/api-keys", doc: "https://platform.openai.com/docs",
    steps: [
      "Acesse platform.openai.com e faça login",
      "Vá em API Keys e crie uma nova chave",
      "Copie a chave gerada (começa com sk-)",
      "Cole a chave no campo API Key abaixo",
    ],
    needsSecret: false, usesWebhook: false,
    keyValidation: { prefix: "sk-", hint: "Deve começar com sk-" },
    categoria: "ia",
  },
  {
    id: "google_gemini", name: "Google Gemini", description: "Gemini Pro, Flash e outros modelos Google",
    icon: Brain, color: "bg-blue-100 text-blue-600",
    site: "https://aistudio.google.com/apikey", doc: "https://ai.google.dev/docs",
    steps: [
      "Acesse aistudio.google.com",
      "Clique em 'Get API Key' e crie uma chave",
      "Copie a chave gerada",
      "Cole no campo API Key abaixo",
    ],
    needsSecret: false, usesWebhook: false,
    keyValidation: { prefix: "AIza", hint: "Deve começar com AIza" },
    categoria: "ia",
  },
  {
    id: "anthropic", name: "Anthropic Claude", description: "Claude 3.5, Claude 3 Opus/Sonnet/Haiku",
    icon: Brain, color: "bg-amber-100 text-amber-700",
    site: "https://console.anthropic.com/settings/keys", doc: "https://docs.anthropic.com/",
    steps: [
      "Acesse console.anthropic.com",
      "Vá em Settings → API Keys",
      "Crie uma nova chave e copie",
      "Cole a chave no campo API Key abaixo",
    ],
    needsSecret: false, usesWebhook: false,
    keyValidation: { prefix: "sk-ant-", hint: "Deve começar com sk-ant-" },
    categoria: "ia",
  },
  {
    id: "deepseek", name: "DeepSeek", description: "DeepSeek V3 e modelos de raciocínio",
    icon: Brain, color: "bg-cyan-100 text-cyan-700",
    site: "https://platform.deepseek.com/api_keys", doc: "https://platform.deepseek.com/api-docs",
    steps: [
      "Acesse platform.deepseek.com",
      "Vá em API Keys e crie uma nova chave",
      "Copie a chave gerada",
      "Cole no campo API Key abaixo",
    ],
    needsSecret: false, usesWebhook: false,
    keyValidation: { prefix: "sk-", hint: "Deve começar com sk-" },
    categoria: "ia",
  },
];

const Integracoes = () => {
  const { empresaId, isSuperAdmin, empresas } = useAuth();
  const [integracoes, setIntegracoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [ambiente, setAmbiente] = useState("producao");
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string }>>({});
  const [autoTestingPlatforms, setAutoTestingPlatforms] = useState<Set<string>>(new Set());
  const [autoTestDone, setAutoTestDone] = useState(false);
  const [webhookExpanded, setWebhookExpanded] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'disconnect' | 'edit'; plataforma: string } | null>(null);
  const [llmPadrao, setLlmPadrao] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [diasRecebimento, setDiasRecebimento] = useState<number>(30);
  const [savingDias, setSavingDias] = useState<string | null>(null);
  const [disponibilidade, setDisponibilidade] = useState<Record<string, boolean>>({});
  const [togglingDisp, setTogglingDisp] = useState<string | null>(null);
  const autoTestErrorsShownRef = useRef(false);

  const getSelectedModel = (plataformaId: string): string => {
    const integ = integracoes.find((i: any) => i.plataforma === plataformaId);
    return integ?.webhook_secret || LLM_MODELS[plataformaId]?.[0]?.value || '';
  };

  const handleSaveModel = async (plataformaId: string, model: string) => {
    if (!empresaId) return;
    setSavingModel(plataformaId);
    try {
      const { error } = await (supabase as any)
        .from('integracoes')
        .update({ webhook_secret: model })
        .eq('empresa_id', empresaId)
        .eq('plataforma', plataformaId);
      if (error) throw error;
      setIntegracoes(prev => prev.map(i => i.plataforma === plataformaId ? { ...i, webhook_secret: model } : i));
      const modelLabel = LLM_MODELS[plataformaId]?.find(m => m.value === model)?.label || model;
      toast.success(`Modelo ${modelLabel} salvo como padrão!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar modelo");
    } finally {
      setSavingModel(null);
    }
  };

  const handleSaveDiasRecebimento = async (plataformaId: string, dias: number) => {
    if (!empresaId) return;
    setSavingDias(plataformaId);
    try {
      const { error } = await (supabase as any)
        .from('integracoes')
        .update({ dias_recebimento: dias })
        .eq('empresa_id', empresaId)
        .eq('plataforma', plataformaId);
      if (error) throw error;
      setIntegracoes(prev => prev.map(i => i.plataforma === plataformaId ? { ...i, dias_recebimento: dias } : i));
      toast.success(`Prazo de recebimento atualizado para ${dias} dias!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar prazo");
    } finally {
      setSavingDias(null);
    }
  };

  const getWebhookUrl = (platformId: string) => {
    if (!empresaId) return "";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/webhook-receiver/${platformId}?empresa_id=${empresaId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copiada para a área de transferência!");
  };

  // Auto-connect Lovable AI if no other IA is active
  const autoConnectLovableAI = async () => {
    if (!empresaId || !isSuperAdmin) return;
    const iaPlataformas = PLATAFORMAS.filter(p => p.categoria === 'ia' && p.id !== 'lovable_ai').map(p => p.id);
    const hasOtherIA = integracoes.some((i: any) => iaPlataformas.includes(i.plataforma) && i.ativo);
    const lovableConnected = integracoes.some((i: any) => i.plataforma === 'lovable_ai' && i.ativo);
    
    if (!hasOtherIA && !lovableConnected) {
      await (supabase as any)
        .from('integracoes')
        .upsert({
          empresa_id: empresaId,
          plataforma: 'lovable_ai',
          api_key_encrypted: 'webhook_only',
          ambiente: 'producao',
          ativo: true,
        }, { onConflict: 'empresa_id,plataforma' });
      fetchIntegracoes();
    }
  };

  useEffect(() => {
    fetchIntegracoes();
    fetchLlmPadrao();
    fetchDisponibilidade();
  }, []);

  // Auto-connect Lovable AI after integracoes are loaded
  useEffect(() => {
    if (!loading && integracoes.length >= 0) {
      autoConnectLovableAI();
    }
  }, [loading, integracoes.length]);

  // Auto-test all active non-webhook-only integrations on page load
  useEffect(() => {
    if (loading || autoTestDone || integracoes.length === 0) return;
    const activeIntegracoes = integracoes.filter((i: any) => i.ativo);
    const testable = activeIntegracoes.filter((i: any) => {
      const plat = PLATAFORMAS.find(p => p.id === i.plataforma);
      return plat && !plat.webhookOnly && !plat.skipAutoTest;
    });
    if (testable.length === 0) return;
    setAutoTestDone(true);
    const platformIds = new Set(testable.map((i: any) => i.plataforma));
    setAutoTestingPlatforms(platformIds);
    
    let completedCount = 0;
    const totalCount = testable.length;
    
    testable.forEach((i: any) => {
      handleTestConnection(i.plataforma, true).finally(() => {
        setAutoTestingPlatforms(prev => {
          const next = new Set(prev);
          next.delete(i.plataforma);
          return next;
        });
        completedCount++;
        // When all tests complete, show summary alert for errors
        if (completedCount === totalCount) {
          setTimeout(() => {
            if (autoTestErrorsShownRef.current) return;
            autoTestErrorsShownRef.current = true;
            setTestResults(current => {
              // Errors are shown via badge status on each card, no toast needed
              return current;
            });
          }, 500);
        }
      });
    });
  }, [loading, integracoes, autoTestDone]);

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
    setKeyError("");

    const integ = integracoes.find((i: any) => i.plataforma === platId);
    setAmbiente(integ?.ambiente || "producao");

    if (isEdit && integ) {
      // Load existing data into form fields
      setApiKey(integ.api_key_encrypted || "");
      setApiSecret(integ.api_secret_encrypted || "");

      if (platId === "google_ads") {
        try {
          const oauth2 = JSON.parse(integ.webhook_secret || "{}");
          setGoogleClientId(oauth2.client_id || "");
          setGoogleClientSecret(oauth2.client_secret || "");
          setGoogleRefreshToken(oauth2.refresh_token || "");
        } catch {
          setGoogleClientId("");
          setGoogleClientSecret("");
          setGoogleRefreshToken("");
        }
      } else {
        setGoogleClientId("");
        setGoogleClientSecret("");
        setGoogleRefreshToken("");
      }

      setSelectedModel(integ.webhook_secret || LLM_MODELS[platId]?.[0]?.value || '');
    } else {
      setApiKey("");
      setApiSecret("");
      setGoogleClientId("");
      setGoogleClientSecret("");
      setGoogleRefreshToken("");
      setSelectedModel(LLM_MODELS[platId]?.[0]?.value || '');
    }
  };

  const closeWizard = () => {
    setConnectDialog(null);
    setEditMode(false);
    setWizardStep(0);
    setApiKey("");
    setApiSecret("");
    setGoogleClientId("");
    setGoogleClientSecret("");
    setGoogleRefreshToken("");
    setKeyError("");
  };

  const fetchIntegracoes = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('integracoes')
        .select('plataforma, ativo, ambiente, created_at, webhook_secret, api_key_encrypted, api_secret_encrypted, dias_recebimento');
      if (error) throw error;
      setIntegracoes(data || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLlmPadrao = async () => {
    if (!empresaId) return;
    try {
      const { data } = await (supabase as any)
        .from('empresas')
        .select('llm_padrao')
        .eq('id', empresaId)
        .single();
      setLlmPadrao(data?.llm_padrao || null);
    } catch (error) {
      console.error("Erro ao buscar LLM padrão:", error);
    }
  };

  const fetchDisponibilidade = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('integracoes_disponiveis')
        .select('plataforma, disponivel');
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data || []).forEach((d: any) => { map[d.plataforma] = d.disponivel; });
      setDisponibilidade(map);
    } catch (error) {
      console.error("Erro ao buscar disponibilidade:", error);
    }
  };

  const handleToggleDisponibilidade = async (plataformaId: string, disponivel: boolean) => {
    setTogglingDisp(plataformaId);
    try {
      const { error } = await (supabase as any)
        .from('integracoes_disponiveis')
        .upsert({
          plataforma: plataformaId,
          disponivel,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'plataforma' });
      if (error) throw error;
      setDisponibilidade(prev => ({ ...prev, [plataformaId]: disponivel }));
      toast.success(disponivel ? "Integração habilitada para novos usuários." : "Integração ocultada para usuários sem conexão ativa.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar disponibilidade");
    } finally {
      setTogglingDisp(null);
    }
  };

  const CATEGORIAS_FIXAS: PlataformaCategoria[] = ["vendas", "anuncios"];

  const isPlataformaDisponivel = (plataformaId: string): boolean => {
    if (isSuperAdmin) return true;
    const plat = PLATAFORMAS.find(p => p.id === plataformaId);
    if (plat && CATEGORIAS_FIXAS.includes(plat.categoria)) return true;
    const userHasActive = integracoes.some((i: any) => i.plataforma === plataformaId && i.ativo);
    if (userHasActive) return true;
    if (disponibilidade[plataformaId] === undefined) return true;
    return disponibilidade[plataformaId];
  };

  const handleSetDefaultLlm = async (plataforma: string) => {
    if (!empresaId) return;
    setSettingDefault(plataforma);
    try {
      const newDefault = llmPadrao === plataforma ? null : plataforma;
      const { error } = await (supabase as any)
        .from('empresas')
        .update({ llm_padrao: newDefault })
        .eq('id', empresaId);
      if (error) throw error;
      setLlmPadrao(newDefault);
      toast.success(newDefault ? `${PLATAFORMAS.find(p => p.id === plataforma)?.name} definida como IA padrão!` : "IA padrão removida.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao definir IA padrão");
    } finally {
      setSettingDefault(null);
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
    // Evolution API requires server URL
    if (currentPlat.id === 'evolution_api' && !apiSecret.trim()) {
      toast.error("A URL do servidor é obrigatória para a Evolution API");
      return;
    }
    // Google Ads requires OAuth2 credentials
    if (currentPlat.id === 'google_ads') {
      if (!googleClientId.trim() || !googleClientSecret.trim() || !googleRefreshToken.trim()) {
        toast.error("Client ID, Client Secret e Refresh Token são obrigatórios para o Google Ads");
        return;
      }
      if (!apiSecret.trim()) {
        toast.error("Customer ID é obrigatório para o Google Ads");
        return;
      }
    }
    setSaving(true);
    try {
      // For Google Ads, store OAuth2 credentials as JSON in webhook_secret
      let webhookSecretValue = currentPlat.categoria === 'ia' && selectedModel ? selectedModel : (apiSecret.trim() || null);
      if (currentPlat.id === 'google_ads') {
        webhookSecretValue = JSON.stringify({
          client_id: googleClientId.trim(),
          client_secret: googleClientSecret.trim(),
          refresh_token: googleRefreshToken.trim(),
        });
      }

      const { error } = await (supabase as any)
        .from('integracoes')
        .upsert({
          empresa_id: empresaId,
          plataforma: connectDialog,
          api_key_encrypted: isWebhookOnly ? 'webhook_only' : apiKey.trim(),
          api_secret_encrypted: apiSecret.trim() || null,
          webhook_secret: webhookSecretValue,
          ambiente,
          ativo: true,
        }, { onConflict: 'empresa_id,plataforma' });

      if (error) throw error;
      
      // If connecting an IA platform (not lovable_ai), auto-disconnect Lovable AI
      if (currentPlat.categoria === 'ia' && connectDialog !== 'lovable_ai') {
        await (supabase as any)
          .from('integracoes')
          .update({ ativo: false })
          .eq('empresa_id', empresaId)
          .eq('plataforma', 'lovable_ai');
      }
      
      toast.success("Integração conectada com sucesso!");
      const savedPlataforma = connectDialog;
      closeWizard();
      fetchIntegracoes();
      // Auto-test connection after saving (only for non-webhook-only and non-skipAutoTest platforms)
      const platConfig = PLATAFORMAS.find(p => p.id === savedPlataforma);
      if (!isWebhookOnly && !platConfig?.skipAutoTest) {
        setTimeout(() => handleTestConnection(savedPlataforma), 500);
      }
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
      setTestResults(prev => { const n = { ...prev }; delete n[plataforma]; return n; });
      fetchIntegracoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar");
    }
  };

  const handleTestConnection = async (plataforma: string, silent = false) => {
    if (!empresaId) return;
    if (!silent) setTesting(plataforma);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      // Google Ads uses sync-ads-data to validate credentials
      if (plataforma === "google_ads") {
        const res = await supabase.functions.invoke("sync-ads-data", {
          body: { empresa_id: empresaId, periodo: 1 },
        });
        if (res.error) throw res.error;
        const result = res.data;
        if (result?.success && result?.data?.length > 0) {
          const gads = result.data[0];
          const msg = `Google Ads conectado! ${gads.campanhas?.length || 0} campanha(s) encontrada(s)`;
          setTestResults(prev => ({ ...prev, [plataforma]: { status: "success", message: msg } }));
          if (!silent) toast.success(msg);
        } else if (result?.success) {
          setTestResults(prev => ({ ...prev, [plataforma]: { status: "warning", message: "Conectado, mas nenhuma campanha encontrada no período" } }));
          if (!silent) toast.warning("Conectado, mas nenhuma campanha encontrada");
        } else {
          throw new Error(result?.error || "Erro desconhecido");
        }
      } else {
        const res = await supabase.functions.invoke("test-integration", {
          body: { plataforma, empresa_id: empresaId },
        });
        if (res.error) throw res.error;
        const result = res.data;
        if (!result || typeof result !== 'object') throw new Error("Resposta inválida do servidor");
        setTestResults(prev => ({ ...prev, [plataforma]: { status: result.status || "error", message: result.message || "Sem resposta" } }));
        if (!silent) {
          if (result.status === "success") toast.success(result.message);
          else if (result.status === "warning") toast.warning(result.message);
          else toast.error(result.message);
        }
      }
    } catch (error: any) {
      const msg = error?.message || "Erro ao testar conexão";
      setTestResults(prev => ({ ...prev, [plataforma]: { status: "error", message: msg } }));
      if (!silent) toast.error(msg);
    } finally {
      if (!silent) setTesting(null);
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
    hubla: {
      event: "purchase_approved",
      data: {
        status: "approved",
        price: 99.0,
        fee: 9.9,
        customer: { name: "Cliente Teste", email: "teste@exemplo.com" },
        product: { name: "Produto de Teste" },
        created_at: new Date().toISOString(),
      },
    },
  };

  const handleTestWebhook = async (plataforma: string) => {
    if (!empresaId) return;
    setTestingWebhook(plataforma);
    
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
        setTestResults(prev => ({ ...prev, [plataforma]: { status: "success", message: `Webhook simulado! Venda registrada (ID: ${result.venda_id?.slice(0, 8)}...)` } }));
        toast.success("Webhook de teste processado com sucesso! Venda registrada.");
      } else {
        setTestResults(prev => ({ ...prev, [plataforma]: { status: "error", message: result.error || "Erro ao processar webhook" } }));
        toast.error(result.error || "Erro ao processar webhook de teste");
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [plataforma]: { status: "error", message: error.message } }));
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
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Integrações</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Conecte plataformas de vendas, pagamentos, anúncios e comunicação</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue={(() => {
          const visibleCats = (Object.keys(CATEGORIAS_INFO) as PlataformaCategoria[]).filter(cat => {
            const plats = PLATAFORMAS.filter(p => p.categoria === cat && !(p.id === 'lovable_ai' && !isSuperAdmin) && isPlataformaDisponivel(p.id));
            return plats.length > 0;
          });
          return visibleCats[0] || "vendas";
        })()} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            {(Object.keys(CATEGORIAS_INFO) as PlataformaCategoria[]).map(cat => {
              const info = CATEGORIAS_INFO[cat];
              const CatIcon = info.icon;
              const filteredPlats = PLATAFORMAS.filter(p => p.categoria === cat && !(p.id === 'lovable_ai' && !isSuperAdmin) && isPlataformaDisponivel(p.id));
              const count = filteredPlats.length;
              if (count === 0) return null;
              const connectedCount = filteredPlats.filter(p => getStatus(p.id) === 'connected').length;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-1.5 text-xs sm:text-sm">
                  <CatIcon className="h-3.5 w-3.5" />
                  {info.label}
                  {connectedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{connectedCount}/{count}</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(CATEGORIAS_INFO) as PlataformaCategoria[]).map(cat => {
            const filteredPlatsForTab = PLATAFORMAS.filter(p => p.categoria === cat && !(p.id === 'lovable_ai' && !isSuperAdmin) && isPlataformaDisponivel(p.id));
            return (
            <TabsContent key={cat} value={cat}>
              {filteredPlatsForTab.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Plug className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhuma integração de {CATEGORIAS_INFO[cat].label.toLowerCase()} disponível no momento.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Entre em contato com o administrador para habilitar integrações.</p>
                </div>
              ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlatsForTab.map(plat => {
            const status = getStatus(plat.id);
            const Icon = plat.icon;
            const platDisponivel = disponibilidade[plat.id] !== false;
            const hasActiveUsers = integracoes.some((i: any) => i.plataforma === plat.id && i.ativo);
            return (
              <Card key={plat.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-lg p-2.5 ${plat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-semibold text-sm">{plat.name}</h3>
                        {status === 'connected' && autoTestingPlatforms.has(plat.id) && !testResults[plat.id] && (
                          <Badge variant="outline" className="border-muted text-muted-foreground text-[10px] px-1.5 animate-pulse">Verificando...</Badge>
                        )}
                        {status === 'connected' && testResults[plat.id]?.status === 'error' && (
                          <Badge variant="outline" className="border-red-300 text-red-600 text-[10px] px-1.5">Erro</Badge>
                        )}
                        {status === 'connected' && testResults[plat.id]?.status === 'warning' && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-700 text-[10px] px-1.5">Instável</Badge>
                        )}
                        {status === 'connected' && testResults[plat.id]?.status === 'success' && (
                          <Badge variant="outline" className="border-green-300 text-green-700 text-[10px] px-1.5">Conectado</Badge>
                        )}
                        {status === 'connected' && !autoTestingPlatforms.has(plat.id) && !testResults[plat.id] && (
                          <Badge variant="outline" className="border-muted text-muted-foreground text-[10px] px-1.5">Conectado</Badge>
                        )}
                        {status === 'disconnected' && <Badge variant="outline" className="border-red-300 text-red-600 text-[10px] px-1.5">Desconectado</Badge>}
                        {plat.categoria === 'ia' && llmPadrao === plat.id && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">⭐ Padrão</Badge>
                        )}
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
                  {/* Super Admin: Toggle availability */}
                  {isSuperAdmin && !CATEGORIAS_FIXAS.includes(plat.categoria) && (
                    <div className="mt-2 flex items-center justify-between p-2 rounded-md bg-muted/50 border border-dashed">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium">Disponível para usuários</span>
                      </div>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={platDisponivel}
                                onCheckedChange={(checked) => handleToggleDisponibilidade(plat.id, checked)}
                                disabled={togglingDisp === plat.id}
                                className="scale-75"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{platDisponivel ? 'Ocultar para usuários sem conexão ativa' : 'Habilitar para todos os usuários'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1.5">
                    {status === 'connected' ? (
                      <TooltipProvider delayDuration={200}>
                        {(!plat.skipAutoTest || plat.id === 'google_ads') && (
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
                        )}
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
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setConfirmAction({ type: 'edit', plataforma: plat.id })}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmAction({ type: 'disconnect', plataforma: plat.id })}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Desconectar</p></TooltipContent>
                        </Tooltip>
                        {plat.categoria === 'ia' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={llmPadrao === plat.id ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSetDefaultLlm(plat.id)}
                                disabled={settingDefault === plat.id}
                              >
                                {settingDefault === plat.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                                  llmPadrao === plat.id ? <Star className="h-3.5 w-3.5" /> : <StarOff className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{llmPadrao === plat.id ? 'IA Padrão ativa' : 'Definir como IA padrão'}</p></TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => openWizard(plat.id)}>Conectar</Button>
                    )}
                  </div>
                  {/* Webhook URL section for connected integrations */}
                  {status === 'connected' && plat.usesWebhook && (
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
                  {/* Model selector for connected IA platforms */}
                  {status === 'connected' && plat.categoria === 'ia' && LLM_MODELS[plat.id] && (
                    <div className="mt-2 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Modelo</Label>
                      <Select
                        value={getSelectedModel(plat.id)}
                        onValueChange={(val) => handleSaveModel(plat.id, val)}
                        disabled={savingModel === plat.id}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {LLM_MODELS[plat.id].map(m => (
                            <SelectItem key={m.value} value={m.value} className="text-xs">
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Dias recebimento for connected sales platforms */}
                  {status === 'connected' && plat.categoria === 'vendas' && (
                    <div className="mt-2 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Prazo de recebimento (dias)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={365}
                          className="h-8 text-xs w-24"
                          defaultValue={integracoes.find((i: any) => i.plataforma === plat.id)?.dias_recebimento ?? 30}
                          onBlur={(e) => {
                            const dias = Math.max(0, Math.min(365, parseInt(e.target.value) || 30));
                            e.target.value = String(dias);
                            const current = integracoes.find((i: any) => i.plataforma === plat.id)?.dias_recebimento ?? 30;
                            if (dias !== current) handleSaveDiasRecebimento(plat.id, dias);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                          disabled={savingDias === plat.id}
                        />
                        <span className="text-[10px] text-muted-foreground">dias</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Vendas aprovadas ficam como receita prevista e são contabilizadas automaticamente após este prazo.
                        {' '}Use 0 para contabilizar imediatamente.
                      </p>
                    </div>
                  )}
                  {testResults[plat.id] && (
                    <div className={`mt-2 flex items-center gap-2 text-xs rounded-md p-2 ${
                      testResults[plat.id].status === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' :
                      testResults[plat.id].status === 'warning' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                      'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                    }`}>
                      {testResults[plat.id].status === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> :
                       testResults[plat.id].status === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> :
                       <XCircle className="h-3.5 w-3.5 shrink-0" />}
                      <span>{testResults[plat.id].message}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
                })}
              </div>
              )}
            </TabsContent>
            );
          })}
        </Tabs>
      )}

      {isSuperAdmin && (
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 w-full text-left group py-2">
              <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Notas Fiscais</h2>
                <p className="text-xs text-muted-foreground">Integração para emissão automática de NF-e / NFS-e</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <SpedyConfigCard />
          </CollapsibleContent>
        </Collapsible>
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
              {empresaId && currentPlat.usesWebhook && currentPlat.events && currentPlat.events.length > 0 && (
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
              {/* Model selector for IA webhookOnly platforms (step 0) */}
              {currentPlat.categoria === 'ia' && LLM_MODELS[currentPlat.id] && (
                <div>
                  <Label>Modelo padrão</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                    <SelectContent>
                      {LLM_MODELS[currentPlat.id].map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Este modelo será usado no chat via Evolution API</p>
                </div>
              )}
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
                <Label>{currentPlat?.id === 'google_ads' ? 'Developer Token *' : 'API Key *'}</Label>
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
                  <Label>{currentPlat.id === 'evolution_api' ? 'URL do Servidor *' : currentPlat.id === 'google_ads' ? 'Customer ID *' : 'API Secret'}</Label>
                  <Input
                    type={currentPlat.id === 'evolution_api' ? 'url' : 'password'}
                    value={apiSecret}
                    onChange={e => setApiSecret(e.target.value)}
                    placeholder={currentPlat.id === 'evolution_api' ? 'https://sua-evolution-api.com' : currentPlat.id === 'google_ads' ? 'Ex: 1234567890 (sem hífens)' : 'Cole o secret aqui'}
                  />
                  {currentPlat.id === 'evolution_api' && (
                    <p className="text-xs text-muted-foreground mt-1">URL base da sua instância Evolution API</p>
                  )}
                  {currentPlat.id === 'google_ads' && (
                    <p className="text-xs text-muted-foreground mt-1">Número da conta no canto superior direito do Google Ads (remova os hífens)</p>
                  )}
                </div>
              )}
              {/* Google Ads OAuth2 fields */}
              {currentPlat.id === 'google_ads' && (
                <>
                  <div>
                    <Label>Client ID (OAuth2) *</Label>
                    <Input
                      value={googleClientId}
                      onChange={e => setGoogleClientId(e.target.value)}
                      placeholder="Ex: 123456789-abc.apps.googleusercontent.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Credencial OAuth2 do Google Cloud Console</p>
                  </div>
                  <div>
                    <Label>Client Secret (OAuth2) *</Label>
                    <Input
                      type="password"
                      value={googleClientSecret}
                      onChange={e => setGoogleClientSecret(e.target.value)}
                      placeholder="Cole o Client Secret aqui"
                    />
                  </div>
                  <div>
                    <Label>Refresh Token *</Label>
                    <Input
                      type="password"
                      value={googleRefreshToken}
                      onChange={e => setGoogleRefreshToken(e.target.value)}
                      placeholder="Cole o Refresh Token gerado no OAuth Playground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Gere em{" "}
                      <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        OAuth Playground
                      </a>
                      {" "}→ selecione "Google Ads API" ou cole o scope <code className="text-xs bg-muted px-1 rounded">https://www.googleapis.com/auth/adwords</code>
                    </p>
                  </div>
                </>
              )}
              {/* Model selector for IA platforms on step 1 */}
              {currentPlat.categoria === 'ia' && LLM_MODELS[currentPlat.id] && (
                <div>
                  <Label>Modelo padrão</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                    <SelectContent>
                      {LLM_MODELS[currentPlat.id].map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Este modelo será usado no chat via Evolution API</p>
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


      {/* Confirmation Dialog for Edit/Disconnect */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'disconnect' ? 'Desconectar Integração' : 'Editar Integração'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'disconnect'
                ? `Tem certeza que deseja desconectar a integração "${PLATAFORMAS.find(p => p.id === confirmAction?.plataforma)?.name}"? A integração ficará inativa até ser reconectada.`
                : `Deseja editar as credenciais da integração "${PLATAFORMAS.find(p => p.id === confirmAction?.plataforma)?.name}"?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === 'disconnect' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                if (confirmAction?.type === 'disconnect') {
                  handleDisconnect(confirmAction.plataforma);
                } else if (confirmAction?.type === 'edit') {
                  openWizard(confirmAction.plataforma, true);
                }
                setConfirmAction(null);
              }}
            >
              {confirmAction?.type === 'disconnect' ? 'Desconectar' : 'Editar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Integracoes;
