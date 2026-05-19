import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Save, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const PROVIDERS = [
  { value: "openai", label: "OpenAI", defaultModel: "gpt-4o" },
  { value: "google_gemini", label: "Google Gemini", defaultModel: "gemini-2.5-flash" },
  { value: "anthropic", label: "Anthropic Claude", defaultModel: "claude-3-5-sonnet-20241022" },
  { value: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat" },
  { value: "lovable_ai", label: "Lovable AI Gateway", defaultModel: "google/gemini-3-flash-preview" },
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

  useEffect(() => {
    if (!isSuperAdmin) return;
    const load = async () => {
      setLoading(true);
      const [{ data: cfg }, { data: emps }, { data: liberacoes }] = await Promise.all([
        sb.from("ai_global_config").select("*").eq("ativo", true).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("empresas").select("id, nome, email").order("nome"),
        sb.from("ai_global_access").select("empresa_id, liberado"),
      ]);

      if (cfg) {
        setProvider(cfg.provider);
        setModel(cfg.model);
        setAtivo(cfg.ativo);
        setHasKey(!!cfg.api_key);
      }
      setEmpresas((emps || []) as Empresa[]);
      const acc: Record<string, boolean> = {};
      (liberacoes || []).forEach((l: any) => { acc[l.empresa_id] = l.liberado; });
      setAccess(acc);
      setLoading(false);
    };
    load();
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

  const toggleAccess = async (empresaId: string, value: boolean) => {
    setAccess(prev => ({ ...prev, [empresaId]: value }));
    const { error } = await sb.from("ai_global_access").upsert({
      empresa_id: empresaId,
      liberado: value,
      liberado_em: value ? new Date().toISOString() : null,
    }, { onConflict: "empresa_id" });
    if (error) {
      toast.error("Erro ao alterar liberação");
      setAccess(prev => ({ ...prev, [empresaId]: !value }));
    } else {
      toast.success(value ? "Empresa liberada" : "Acesso revogado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">IA Global</h1>
          <p className="text-sm text-muted-foreground">Configure uma única chave de IA e libere acesso por empresa.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldAlert className="h-4 w-4 text-amber-600" />Configuração da chave</CardTitle>
          <CardDescription>A chave fica protegida — só o Super Admin pode lê-la/alterá-la. Empresas liberadas usam transparentemente.</CardDescription>
        </CardHeader>
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
                  <Input value={model} onChange={e => setModel(e.target.value)} placeholder={PROVIDERS.find(p => p.value === provider)?.defaultModel} />
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Empresas liberadas</CardTitle>
          <CardDescription>Empresas ativas usam a IA global; as não liberadas continuam com integração própria (Integrações).</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {empresas.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{emp.nome}</div>
                    {emp.email && <div className="text-xs text-muted-foreground truncate">{emp.email}</div>}
                  </div>
                  <Switch
                    checked={!!access[emp.id]}
                    onCheckedChange={(v) => toggleAccess(emp.id, v)}
                  />
                </div>
              ))}
              {empresas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa cadastrada</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigGlobalIA;
