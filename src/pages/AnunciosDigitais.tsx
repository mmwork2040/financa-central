import React, { useState, useEffect } from "react";
import { Megaphone, TrendingUp, DollarSign, MousePointer, Target, RefreshCw, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CampaignData {
  nome: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
  receita: number;
}

interface AdData {
  plataforma: string;
  totalGasto: number;
  totalReceita: number;
  totalCliques: number;
  totalImpressoes: number;
  totalConversoes: number;
  roas: number;
  campanhas: CampaignData[];
}

const MASK = "••••••";

const AnunciosDigitais = () => {
  const [periodo, setPeriodo] = useState("30");
  const [adSummary, setAdSummary] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [valoresVisiveis, setValoresVisiveis] = useState(false);
  const { empresaId } = useAuth();

  useEffect(() => {
    if (empresaId) fetchAdData();
  }, [periodo, empresaId]);

  const fetchAdData = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { data: integracoes } = await supabase
        .from("integracoes")
        .select("plataforma, ativo")
        .eq("ativo", true)
        .in("plataforma", ["meta_ads", "google_ads"]);

      const activeIntegrations = integracoes?.length || 0;
      setHasIntegrations(activeIntegrations > 0);

      if (activeIntegrations === 0) {
        setAdSummary([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("sync-ads-data", {
        body: { empresa_id: empresaId, periodo: parseInt(periodo) },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setAdSummary(data.data);
      } else {
        throw new Error(data?.error || "Erro ao buscar dados");
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados de anúncios:", error);
      toast.error("Erro ao carregar dados de anúncios: " + (error.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await fetchAdData();
    setSyncing(false);
    toast.success("Dados sincronizados!");
  };

  const displayValue = (value: string | number) => valoresVisiveis ? String(value) : MASK;
  const displayCurrency = (value: number) => valoresVisiveis ? formatCurrency(value) : MASK;

  const totalGasto = adSummary.reduce((s, a) => s + a.totalGasto, 0);
  const totalReceita = adSummary.reduce((s, a) => s + a.totalReceita, 0);
  const roasGeral = totalGasto > 0 ? totalReceita / totalGasto : 0;

  const chartData = adSummary.map(a => ({
    name: a.plataforma,
    "Investido": a.totalGasto,
    "Receita": a.totalReceita,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Anúncios</h1>
          </div>
          <p className="text-sm text-muted-foreground">Acompanhe o desempenho dos seus anúncios</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setValoresVisiveis(v => !v)}
            title={valoresVisiveis ? "Ocultar valores" : "Exibir valores"}
          >
            {valoresVisiveis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing || !hasIntegrations}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", syncing && "animate-spin")} />
            Sincronizar
          </Button>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      ) : !hasIntegrations ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Nenhuma integração de anúncios ativa</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte suas contas Meta Ads ou Google Ads em <strong>Configurações → Integrações</strong> para ver dados reais.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-destructive/10 p-1.5"><DollarSign className="h-4 w-4 text-destructive" /></div>
                  <span className="text-xs text-muted-foreground">Investido</span>
                </div>
                <p className="text-lg font-bold text-destructive">{displayCurrency(totalGasto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-green-100 p-1.5"><TrendingUp className="h-4 w-4 text-green-600" /></div>
                  <span className="text-xs text-muted-foreground">Receita gerada</span>
                </div>
                <p className="text-lg font-bold text-green-600">{displayCurrency(totalReceita)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-blue-100 p-1.5"><Target className="h-4 w-4 text-blue-600" /></div>
                  <span className="text-xs text-muted-foreground">ROAS</span>
                </div>
                <p className={cn("text-lg font-bold", roasGeral >= 2 ? "text-green-600" : roasGeral >= 1 ? "text-amber-600" : "text-destructive")}>
                  {valoresVisiveis ? `${roasGeral.toFixed(1)}x` : MASK}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-purple-100 p-1.5"><MousePointer className="h-4 w-4 text-purple-600" /></div>
                  <span className="text-xs text-muted-foreground">Conversões</span>
                </div>
                <p className="text-lg font-bold">
                  {valoresVisiveis ? adSummary.reduce((s, a) => s + a.totalConversoes, 0) : MASK}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (totalGasto > 0 || totalReceita > 0) && valoresVisiveis && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Investido vs Receita por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Investido" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Platform Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            {adSummary.map(ad => (
              <Card key={ad.plataforma}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{ad.plataforma}</h3>
                    <Badge className={cn("text-[10px]", ad.roas >= 2 ? "bg-green-100 text-green-700" : ad.roas >= 1 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      ROAS {valoresVisiveis ? `${ad.roas.toFixed(1)}x` : MASK}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Investido</p>
                      <p className="font-medium text-destructive">{displayCurrency(ad.totalGasto)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Receita</p>
                      <p className="font-medium text-green-600">{displayCurrency(ad.totalReceita)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cliques</p>
                      <p className="font-medium">{valoresVisiveis ? ad.totalCliques.toLocaleString() : MASK}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Impressões</p>
                      <p className="font-medium">{valoresVisiveis ? ad.totalImpressoes.toLocaleString() : MASK}</p>
                    </div>
                  </div>

                  {ad.campanhas && ad.campanhas.length > 0 && valoresVisiveis && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold mb-2">Campanhas ({ad.campanhas.length})</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {ad.campanhas.map((c, i) => (
                          <div key={i} className="text-xs flex justify-between items-center">
                            <span className="truncate max-w-[60%]">{c.nome}</span>
                            <span className="text-muted-foreground">{formatCurrency(c.gasto)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ad.totalGasto === 0 && ad.totalReceita === 0 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Sem dados para o período selecionado
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">💡 Como funciona</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Os dados são buscados diretamente da API das plataformas conectadas</li>
                <li>• Use o botão <strong>Sincronizar</strong> para atualizar os dados</li>
                <li>• O ROAS (Return on Ad Spend) mostra quanto você recebe por cada real investido</li>
                <li>• ROAS &gt; 2x = 🟢 Bom | ROAS 1-2x = 🟡 Atenção | ROAS &lt; 1x = 🔴 Prejuízo</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnunciosDigitais;
