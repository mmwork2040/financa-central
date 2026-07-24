import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, Loader2, Save, Eye, EyeOff, ShieldAlert, BarChart3, AlertTriangle, MessageCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { normalizeWhatsAppUrl } from "@/utils/whatsapp";
import { isFloatingWAHidden, setFloatingWAHidden, FLOATING_WA_EVENT, FLOATING_WA_STORAGE_KEY } from "@/utils/floatingWhatsAppVisibility";

const PROVIDERS = [
  {
    value: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "o3-mini", "gpt-4-turbo"],
  },
  {
    value: "google_gemini",
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  {
    value: "anthropic",
    label: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder"],
  },
  {
    value: "lovable_ai",
    label: "Lovable AI Gateway",
    defaultModel: "google/gemini-3.6-flash",
    models: [
      "google/gemini-3.6-flash",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash",
      "openai/gpt-5-mini",
      "openai/gpt-5",
    ],
  },
];

type Empresa = { id: string; nome: string; email: string | null };

const ConfigGlobalIA = () => {
  const { isSuperAdmin } = useAuth();
  const sb = supabase as any;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [access, setAccess] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [planLimits, setPlanLimits] = useState<Record<string, number>>({}); // empresa_id -> limite do plano
  const [globalChatUrl, setGlobalChatUrl] = useState("");
  const [globalChatMensagem, setGlobalChatMensagem] = useState("");
  const [globalChatEmpresaId, setGlobalChatEmpresaId] = useState<string | null>(null);
  const [savingChat, setSavingChat] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openKey, setOpenKey] = useState(false);
  const [openUsage, setOpenUsage] = useState(false);
  const [openWaBtn, setOpenWaBtn] = useState(false);
  const [waBtnHidden, setWaBtnHidden] = useState<boolean>(() => isFloatingWAHidden());

  const loadAll = async () => {
    setLoading(true);
    const [{ data: cfg }, { data: emps }, { data: liberacoes }, { data: usageRows }, { data: perfis }] = await Promise.all([
      sb.from("ai_global_config").select("*").eq("ativo", true).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("empresas").select("id, nome, email").order("nome"),
      sb.from("ai_global_access").select("empresa_id, liberado, limite_tokens_mes_override"),
      sb.from("ai_usage_log")
        .select("empresa_id, total_tokens")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      sb.from("perfis").select("empresa_id, assinatura_plano_id, planos_assinatura:assinatura_plano_id(limite_tokens_ia_mes)").not("empresa_id", "is", null),
    ]);

    if (cfg) {
      setProvider(cfg.provider);
      setModel(cfg.model);
      setAtivo(cfg.ativo);
      setHasKey(!!cfg.api_key);
    }
    setEmpresas((emps || []) as Empresa[]);
    const acc: Record<string, boolean> = {};
    const ovr: Record<string, string> = {};
    (liberacoes || []).forEach((l: any) => {
      acc[l.empresa_id] = l.liberado;
      ovr[l.empresa_id] = l.limite_tokens_mes_override != null ? String(l.limite_tokens_mes_override) : "";
    });
    setAccess(acc);
    setOverrides(ovr);

    const usageMap: Record<string, number> = {};
    (usageRows || []).forEach((r: any) => {
      usageMap[r.empresa_id] = (usageMap[r.empresa_id] || 0) + Number(r.total_tokens || 0);
    });
    setUsage(usageMap);

    const limitMap: Record<string, number> = {};
    (perfis || []).forEach((p: any) => {
      const lim = Number(p.planos_assinatura?.limite_tokens_ia_mes || 0);
      if (p.empresa_id && lim > (limitMap[p.empresa_id] || 0)) limitMap[p.empresa_id] = lim;
    });
    setPlanLimits(limitMap);

    // Global WhatsApp/chat URL — stored on the earliest super_admin empresa
    const { data: role } = await sb
      .from("user_roles")
      .select("empresa_id, created_at")
      .eq("role", "super_admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (role?.empresa_id) {
      setGlobalChatEmpresaId(role.empresa_id);
      const { data: emp } = await supabase
        .from("empresas")
        .select("chat_lancamentos_url, chat_lancamentos_mensagem")
        .eq("id", role.empresa_id)
        .maybeSingle();
      setGlobalChatUrl((emp as any)?.chat_lancamentos_url || "");
      setGlobalChatMensagem((emp as any)?.chat_lancamentos_mensagem || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const handleSaveConfig = async () => {
    if (!apiKey && !hasKey) {
      toast.error("Informe a chave da API");
      return;
    }
    setSaving(true);
    try {
      const { data: existing } = await sb
        .from("ai_global_config")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const payload: any = {
        provider,
        model: model || PROVIDERS.find(p => p.value === provider)?.defaultModel || "",
        ativo,
      };
      if (apiKey) payload.api_key = apiKey;

      if (existing) {
        const { error } = await sb.from("ai_global_config").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("ai_global_config").insert(payload);
        if (error) throw error;
      }
      toast.success("Configuração de IA global salva");
      setApiKey("");
      setHasKey(true);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const saveOverride = async (empresaId: string) => {
    const raw = overrides[empresaId];
    const value = raw === "" || raw == null ? null : Number(raw);
    const { error } = await sb.from("ai_global_access").upsert({
      empresa_id: empresaId,
      liberado: !!access[empresaId],
      limite_tokens_mes_override: value,
    }, { onConflict: "empresa_id" });
    if (error) toast.error("Erro ao salvar limite");
    else toast.success("Limite atualizado");
  };

  const getEffectiveLimit = (empresaId: string): number => {
    const ovr = overrides[empresaId];
    if (ovr && ovr !== "") return Number(ovr);
    return planLimits[empresaId] || 0;
  };

  const fmt = (n: number) => n.toLocaleString("pt-BR");

  const handleSaveGlobalChat = async () => {
    if (!globalChatEmpresaId) {
      toast.error("Empresa super admin não encontrada");
      return;
    }
    setSavingChat(true);
    try {
      const url = normalizeWhatsAppUrl(globalChatUrl, globalChatMensagem) || null;
      const mensagem = globalChatMensagem.trim() || null;
      const { error } = await supabase
        .from("empresas")
        .update({ chat_lancamentos_url: url, chat_lancamentos_mensagem: mensagem } as any)
        .eq("id", globalChatEmpresaId);
      if (error) throw error;
      setGlobalChatUrl(url || "");
      window.dispatchEvent(new Event("chat-urls-updated"));
      toast.success("Link global do WhatsApp salvo");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSavingChat(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">IA — Provedor Global</h1>
          <p className="text-sm text-muted-foreground">Chave de IA da plataforma (fallback). Empresas podem usar a própria em <strong>Configurações → Integrações → IA da Empresa</strong>.</p>

        </div>
      </div>


      <Collapsible open={openChat} onOpenChange={setOpenChat}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Link global de lançamento (WhatsApp / Chat)
                  </CardTitle>
                  <CardDescription>
                    Usado por padrão em todas as empresas quando não houver link específico configurado. Aceita wa.me, Telegram ou qualquer URL de chat.
                  </CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openChat ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Link de destino</Label>
                <Input
                  value={globalChatUrl}
                  onChange={(e) => setGlobalChatUrl(e.target.value)}
                  onBlur={() => setGlobalChatUrl(normalizeWhatsAppUrl(globalChatUrl, globalChatMensagem))}
                  placeholder="https://wa.me/5511999999999"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mensagem pré-preenchida (WhatsApp)</Label>
                <Textarea
                  value={globalChatMensagem}
                  onChange={(e) => setGlobalChatMensagem(e.target.value)}
                  placeholder="Faça os lançamentos pelo WhatsApp"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Use wa.me/55NUMERO para abrir com mensagem; links api.whatsapp.com serão convertidos automaticamente.</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveGlobalChat} disabled={savingChat || loading}>
                  {savingChat ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={openWaBtn} onOpenChange={setOpenWaBtn}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Botão flutuante do WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Controle a exibição do botão flutuante de lançamento via WhatsApp para este navegador.
                  </CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openWaBtn ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm">Exibir botão flutuante</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando desativado, o botão fica oculto até ser reativado aqui.
                  </p>
                </div>
                <Switch
                  checked={!waBtnHidden}
                  onCheckedChange={(v) => {
                    const hidden = !v;
                    setWaBtnHidden(hidden);
                    setFloatingWAHidden(hidden);
                    toast.success(hidden ? "Botão ocultado" : "Botão exibido");
                  }}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={openKey} onOpenChange={setOpenKey}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg"><ShieldAlert className="h-4 w-4 text-amber-600" />Configuração da chave</CardTitle>
                  <CardDescription>A chave fica protegida — só o Super Admin pode lê-la/alterá-la. Empresas liberadas usam transparentemente.</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openKey ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Provedor</Label>
                  <Select value={provider} onValueChange={(v) => { setProvider(v); setModel(PROVIDERS.find(p => p.value === v)?.defaultModel || ""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Modelo</Label>
                  {(() => {
                    const current = PROVIDERS.find(p => p.value === provider);
                    const models = current?.models || [];
                    const isCustom = !!model && !models.includes(model);
                    return (
                      <Select
                        value={isCustom ? "__custom__" : (model || current?.defaultModel || "")}
                        onValueChange={(v) => {
                          if (v === "__custom__") { setModel(""); return; }
                          setModel(v);
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                        <SelectContent>
                          {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          <SelectItem value="__custom__">Outro (personalizado)</SelectItem>
                        </SelectContent>
                      </Select>
                    );
                  })()}
                  {(() => {
                    const current = PROVIDERS.find(p => p.value === provider);
                    const models = current?.models || [];
                    const isCustom = !!model && !models.includes(model);
                    if (!isCustom && model) return null;
                    return (
                      <Input
                        className="mt-2"
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        placeholder={current?.defaultModel}
                      />
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Chave da API {hasKey && <Badge variant="outline" className="ml-2 text-[10px]">Já configurada</Badge>}</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={hasKey ? "Deixe vazio para manter a atual" : "Cole aqui a chave do provedor"}
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowKey(s => !s)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                  <span className="text-sm">Configuração ativa</span>
                </div>
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar configuração
                </Button>
              </div>
            </>
          )}
        </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={openUsage} onOpenChange={setOpenUsage}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-4 w-4 text-primary" />Uso de tokens por empresa (mês atual)</CardTitle>
                  <CardDescription>Libere acesso, ajuste o limite manual e acompanhe o consumo. O limite efetivo segue o override; se vazio, vale o limite do plano.</CardDescription>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openUsage ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {empresas.map(emp => {
                const used = usage[emp.id] || 0;
                const limit = getEffectiveLimit(emp.id);
                const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                const over = limit > 0 && used >= limit;
                const warn = limit > 0 && pct >= 80 && !over;
                return (
                  <div key={emp.id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{emp.nome}</div>
                        {emp.email && <div className="text-xs text-muted-foreground truncate">{emp.email}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Liberado</span>
                        <Switch
                          checked={!!access[emp.id]}
                          onCheckedChange={async (v) => {
                            setAccess(prev => ({ ...prev, [emp.id]: v }));
                            const { error } = await sb.from("ai_global_access").upsert({
                              empresa_id: emp.id, liberado: v,
                              liberado_em: v ? new Date().toISOString() : null,
                            }, { onConflict: "empresa_id" });
                            if (error) { toast.error("Erro"); setAccess(prev => ({ ...prev, [emp.id]: !v })); }
                            else toast.success(v ? "Liberada" : "Acesso revogado");
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-end gap-2 flex-wrap">
                      <div className="text-xs">
                        <div className="text-muted-foreground">Usado / Limite</div>
                        <div className="font-semibold">
                          {fmt(used)} / {limit > 0 ? fmt(limit) : "—"}
                          {limit > 0 && <Badge variant={over ? "destructive" : warn ? "outline" : "outline"} className="ml-2 text-[10px]">{pct}%</Badge>}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full transition-all ${over ? "bg-destructive" : warn ? "bg-amber-500" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder={`Plano: ${fmt(planLimits[emp.id] || 0)}`}
                        value={overrides[emp.id] ?? ""}
                        onChange={(e) => setOverrides(prev => ({ ...prev, [emp.id]: e.target.value }))}
                        className="h-9 text-sm max-w-[180px]"
                      />
                      <Button size="sm" variant="outline" onClick={() => saveOverride(emp.id)}>Salvar limite</Button>
                      {(warn || over) && (
                        <Badge variant={over ? "destructive" : "outline"} className="gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" />
                          {over ? "Bloqueado" : "Alerta 80%"}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {empresas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa cadastrada</p>}
            </div>
          )}
        </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default ConfigGlobalIA;
