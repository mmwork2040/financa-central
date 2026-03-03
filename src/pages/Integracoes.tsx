
import React, { useState, useEffect } from "react";
import { Plug, Loader2, ExternalLink, BookOpen, ChevronRight, ChevronLeft, Check, CreditCard, Globe, ShoppingCart, BarChart3, Megaphone, DollarSign, Zap, Target, Activity, CheckCircle2, XCircle, AlertTriangle, Pencil, Copy, Webhook, Info, Share2, MessageCircle, Send, Brain, Star, StarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PlataformaCategoria = "vendas" | "pagamentos" | "anuncios" | "comunicacao" | "ia";

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
  vendas: { label: "Vendas Digitais", icon: ShoppingCart },
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
  // --- Pagamentos ---
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
      "Crie uma conta de gerenciador (MCC) em ads.google.com/home/tools/manager-accounts",
      "Vincule sua conta de anunciante ao MCC",
      "No MCC, acesse Ferramentas → Centro de API e copie o Developer Token",
      "Copie também o Customer ID (número da conta, formato XXX-XXX-XXXX, sem hífens)",
    ],
    needsSecret: true, usesWebhook: false, keyValidation: { hint: "Developer Token do MCC (ex: AbCdEfG...)" },
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
  const [ambiente, setAmbiente] = useState("producao");
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string }>>({});
  const [autoTestingPlatforms, setAutoTestingPlatforms] = useState<Set<string>>(new Set());
  const [autoTestDone, setAutoTestDone] = useState(false);
  const [webhookExpanded, setWebhookExpanded] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportTargetEmpresa, setExportTargetEmpresa] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ count: number; webhookUrls: { plataforma: string; url: string }[] } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'disconnect' | 'edit'; plataforma: string } | null>(null);
  const [llmPadrao, setLlmPadrao] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");

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
      return plat && !plat.webhookOnly;
    });
    if (testable.length === 0) return;
    setAutoTestDone(true);
    const platformIds = new Set(testable.map((i: any) => i.plataforma));
    setAutoTestingPlatforms(platformIds);
    testable.forEach((i: any) => {
      handleTestConnection(i.plataforma, true).finally(() => {
        setAutoTestingPlatforms(prev => {
          const next = new Set(prev);
          next.delete(i.plataforma);
          return next;
        });
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
    setApiKey("");
    setApiSecret("");
    const integ = integracoes.find((i: any) => i.plataforma === platId);
    setAmbiente(integ?.ambiente || "producao");
    setSelectedModel(integ?.webhook_secret || LLM_MODELS[platId]?.[0]?.value || '');
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
        .select('plataforma, ativo, ambiente, created_at, webhook_secret');
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
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('integracoes')
        .upsert({
          empresa_id: empresaId,
          plataforma: connectDialog,
          api_key_encrypted: isWebhookOnly ? 'webhook_only' : apiKey.trim(),
          api_secret_encrypted: apiSecret.trim() || null,
          webhook_secret: currentPlat.categoria === 'ia' && selectedModel ? selectedModel : (apiSecret.trim() || null),
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
      // Auto-test connection after saving (only for non-webhook-only platforms)
      if (!isWebhookOnly) {
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
    setTesting(plataforma);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      
      const res = await supabase.functions.invoke("test-integration", {
        body: { plataforma, empresa_id: empresaId },
      });
      
      if (res.error) throw res.error;
      const result = res.data;
      setTestResults(prev => ({ ...prev, [plataforma]: { status: result.status, message: result.message } }));
      
      if (!silent) {
        if (result.status === "success") {
          toast.success(result.message);
        } else if (result.status === "warning") {
          toast.warning(result.message);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error: any) {
      const msg = error.message || "Erro ao testar conexão";
      setTestResults(prev => ({ ...prev, [plataforma]: { status: "error", message: msg } }));
      if (!silent) toast.error(msg);
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

  const handleExportIntegracoes = async () => {
    if (!empresaId || !exportTargetEmpresa) return;
    setExporting(true);
    try {
      const res = await supabase.functions.invoke("export-integracoes", {
        body: { sourceEmpresaId: empresaId, targetEmpresaId: exportTargetEmpresa },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      
      setExportResult({ count: res.data.count, webhookUrls: res.data.webhookUrls || [] });
      const targetNome = empresas.find(e => e.empresa_id === exportTargetEmpresa)?.empresa_nome || 'empresa';
      toast.success(`${res.data.count} integrações exportadas para ${targetNome}!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao exportar integrações");
    } finally {
      setExporting(false);
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
        <p className="text-xs sm:text-sm text-muted-foreground">Conecte plataformas de vendas, pagamentos, anúncios e comunicação</p>
        {isSuperAdmin && (
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setExportDialogOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Exportar integrações para outra empresa
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="vendas" className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            {(Object.keys(CATEGORIAS_INFO) as PlataformaCategoria[]).map(cat => {
              const info = CATEGORIAS_INFO[cat];
              const CatIcon = info.icon;
              const filteredPlats = PLATAFORMAS.filter(p => p.categoria === cat && !(p.id === 'lovable_ai' && !isSuperAdmin));
              const count = filteredPlats.length;
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

          {(Object.keys(CATEGORIAS_INFO) as PlataformaCategoria[]).map(cat => (
            <TabsContent key={cat} value={cat}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PLATAFORMAS.filter(p => p.categoria === cat && !(p.id === 'lovable_ai' && !isSuperAdmin)).map(plat => {
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
            </TabsContent>
          ))}
        </Tabs>
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

      {/* Export Dialog */}
      <AlertDialog open={exportDialogOpen} onOpenChange={(open) => {
        setExportDialogOpen(open);
        if (!open) { setExportResult(null); setExportTargetEmpresa(""); }
      }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {exportResult ? "Exportação Concluída" : "Exportar Integrações"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {exportResult
                ? `${exportResult.count} integrações conectadas foram copiadas com sucesso. As webhook URLs abaixo já estão atualizadas com o ID da empresa destino.`
                : <>Esta ação irá <strong>substituir todas as integrações</strong> da empresa selecionada pelas integrações <strong>conectadas</strong> da empresa atual (incluindo credenciais e webhooks). Esta ação não pode ser desfeita.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!exportResult ? (
            <>
              <div className="space-y-2 py-2">
                <Label>Empresa de destino</Label>
                <Select value={exportTargetEmpresa} onValueChange={setExportTargetEmpresa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas
                      .filter(e => e.empresa_id !== empresaId)
                      .map(e => (
                        <SelectItem key={e.empresa_id} value={e.empresa_id}>
                          {e.empresa_nome || 'Empresa'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={exporting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => { e.preventDefault(); handleExportIntegracoes(); }}
                  disabled={!exportTargetEmpresa || exporting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {exporting ? "Exportando..." : "Confirmar Exportação"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              {exportResult.webhookUrls.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground">Novas Webhook URLs (já com empresa destino):</p>
                  {exportResult.webhookUrls.map((wh) => (
                    <div key={wh.plataforma} className="space-y-1">
                      <p className="text-xs font-semibold capitalize">{wh.plataforma}</p>
                      <div className="flex items-center gap-1">
                        <Input readOnly value={wh.url} className="text-[10px] h-7 font-mono bg-muted" />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copiada!"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

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
