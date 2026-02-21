
import React, { useState, useEffect } from "react";
import { Plug, Loader2, ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PLATAFORMAS = [
  { id: "hotmart", name: "Hotmart", description: "Plataforma de produtos digitais", site: "https://app.hotmart.com/tools/credentials", doc: "https://developers.hotmart.com/docs/pt-BR/" },
  { id: "eduzz", name: "Eduzz", description: "Venda de infoprodutos", site: "https://orbita.eduzz.com/producer/config-api", doc: "https://developer.eduzz.com/" },
  { id: "monetizze", name: "Monetizze", description: "Afiliados e produtos digitais", site: "https://app.monetizze.com.br/developer/api", doc: "https://docs.monetizze.com.br/" },
  { id: "stripe", name: "Stripe", description: "Pagamentos internacionais", site: "https://dashboard.stripe.com/apikeys", doc: "https://docs.stripe.com/api" },
  { id: "paypal", name: "PayPal", description: "Pagamentos globais", site: "https://developer.paypal.com/dashboard/applications", doc: "https://developer.paypal.com/docs/api/overview/" },
  { id: "asaas", name: "Asaas", description: "Cobranças e pagamentos", site: "https://www.asaas.com/config/api", doc: "https://docs.asaas.com/" },
  { id: "meta_ads", name: "Meta Ads", description: "Facebook & Instagram Ads", site: "https://business.facebook.com/settings", doc: "https://developers.facebook.com/docs/marketing-apis/" },
  { id: "google_ads", name: "Google Ads", description: "Anúncios no Google", site: "https://console.cloud.google.com/apis/credentials", doc: "https://developers.google.com/google-ads/api/docs/start" },
];

const Integracoes = () => {
  const { empresaId } = useAuth();
  const [integracoes, setIntegracoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [ambiente, setAmbiente] = useState("producao");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIntegracoes();
  }, []);

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
    if (!connectDialog || !apiKey.trim() || !empresaId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('integracoes')
        .upsert({
          empresa_id: empresaId,
          plataforma: connectDialog,
          api_key_encrypted: apiKey.trim(),
          api_secret_encrypted: apiSecret.trim() || null,
          ambiente,
          ativo: true,
        }, { onConflict: 'empresa_id,plataforma' });

      if (error) throw error;
      toast.success("Integração conectada com sucesso!");
      setConnectDialog(null);
      setApiKey("");
      setApiSecret("");
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
      fetchIntegracoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Plug className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Integrações</h1>
        </div>
        <p className="text-sm text-muted-foreground">Conecte suas plataformas de vendas digitais</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATAFORMAS.map(plat => {
            const status = getStatus(plat.id);
            return (
              <Card key={plat.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{plat.name}</h3>
                      {status === 'connected' && <Badge className="bg-green-100 text-green-700 text-[10px]">🟢 Conectado</Badge>}
                      {status === 'disconnected' && <Badge className="bg-red-100 text-red-700 text-[10px]">🔴 Desconectado</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{plat.description}</p>
                    <div className="flex gap-2 mt-1">
                      <a href={plat.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> Acessar painel
                      </a>
                      {plat.doc && (
                        <a href={plat.doc} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary hover:underline">
                          <BookOpen className="h-3 w-3" /> Documentação
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    {status === 'connected' ? (
                      <Button variant="outline" size="sm" onClick={() => handleDisconnect(plat.id)}>
                        Desconectar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setConnectDialog(plat.id)}>
                        Conectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!connectDialog} onOpenChange={(o) => !o && setConnectDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar {PLATAFORMAS.find(p => p.id === connectDialog)?.name}</DialogTitle>
            <DialogDescription>Insira suas credenciais da API para conectar a plataforma.</DialogDescription>
            {connectDialog && (() => {
              const plat = PLATAFORMAS.find(p => p.id === connectDialog);
              return plat ? (
                <div className="flex gap-3 pt-1">
                  <a href={plat.site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Obter credenciais
                  </a>
                  {plat.doc && (
                    <a href={plat.doc} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline">
                      <BookOpen className="h-3 w-3" /> Ver documentação
                    </a>
                  )}
                </div>
              ) : null;
            })()}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>API Key *</Label>
              <Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Cole sua API Key aqui" />
            </div>
            <div>
              <Label>API Secret (opcional)</Label>
              <Input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="Cole o secret se necessário" />
            </div>
            <div>
              <Label>Ambiente</Label>
              <Select value={ambiente} onValueChange={setAmbiente}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="producao">Produção</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleConnect} disabled={saving || !apiKey.trim()} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Conectando...</> : "Conectar plataforma"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Integracoes;
