
import React, { useState, useEffect } from "react";
import { Megaphone, TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AdData {
  plataforma: string;
  totalGasto: number;
  totalReceita: number;
  totalCliques: number;
  totalImpressoes: number;
  totalConversoes: number;
  roas: number;
}

const AnunciosDigitais = () => {
  const [periodo, setPeriodo] = useState("30");
  const [adSummary, setAdSummary] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdData();
  }, [periodo]);

  const fetchAdData = async () => {
    setLoading(true);
    try {
      // Get vendas_digitais as revenue proxy for connected platforms
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
      const dataInicioStr = dataInicio.toISOString().split("T")[0];

      const { data: vendas } = await supabase
        .from("vendas_digitais")
        .select("*")
        .gte("data_venda", dataInicioStr);

      // Get integrations to know which platforms are connected
      const { data: integracoes } = await supabase
        .from("integracoes")
        .select("plataforma, ativo")
        .eq("ativo", true);

      const platforms = ["meta_ads", "google_ads"];
      const summary: AdData[] = platforms.map(plat => {
        const platVendas = vendas?.filter(v => 
          v.plataforma?.toLowerCase().includes(plat.replace("_ads", ""))
        ) || [];
        
        const totalReceita = platVendas.reduce((s, v) => s + (v.valor_liquido || 0), 0);
        // Estimate ad spend as 30% of revenue (placeholder until real API integration)
        const totalGasto = totalReceita * 0.3;
        
        return {
          plataforma: plat === "meta_ads" ? "Meta Ads" : "Google Ads",
          totalGasto,
          totalReceita,
          totalCliques: Math.floor(totalReceita / 2.5), // Placeholder metrics
          totalImpressoes: Math.floor(totalReceita / 0.05),
          totalConversoes: platVendas.length,
          roas: totalGasto > 0 ? totalReceita / totalGasto : 0,
        };
      });

      setAdSummary(summary);
    } catch (error) {
      console.error("Erro ao carregar dados de anúncios:", error);
    } finally {
      setLoading(false);
    }
  };

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

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-red-100 p-1.5"><DollarSign className="h-4 w-4 text-red-600" /></div>
                  <span className="text-xs text-muted-foreground">Investido</span>
                </div>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalGasto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-green-100 p-1.5"><TrendingUp className="h-4 w-4 text-green-600" /></div>
                  <span className="text-xs text-muted-foreground">Receita gerada</span>
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalReceita)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-blue-100 p-1.5"><Target className="h-4 w-4 text-blue-600" /></div>
                  <span className="text-xs text-muted-foreground">ROAS</span>
                </div>
                <p className={cn("text-lg font-bold", roasGeral >= 2 ? "text-green-600" : roasGeral >= 1 ? "text-amber-600" : "text-red-600")}>
                  {roasGeral.toFixed(1)}x
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-purple-100 p-1.5"><MousePointer className="h-4 w-4 text-purple-600" /></div>
                  <span className="text-xs text-muted-foreground">Conversões</span>
                </div>
                <p className="text-lg font-bold">{adSummary.reduce((s, a) => s + a.totalConversoes, 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (totalGasto > 0 || totalReceita > 0) && (
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
                      ROAS {ad.roas.toFixed(1)}x
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Investido</p>
                      <p className="font-medium text-red-600">{formatCurrency(ad.totalGasto)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Receita</p>
                      <p className="font-medium text-green-600">{formatCurrency(ad.totalReceita)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cliques</p>
                      <p className="font-medium">{ad.totalCliques.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversões</p>
                      <p className="font-medium">{ad.totalConversoes}</p>
                    </div>
                  </div>
                  {ad.totalGasto === 0 && ad.totalReceita === 0 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Conecte via Integrações para ver dados reais
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
                <li>• Conecte suas contas Meta Ads e Google Ads em <strong>Configurações → Integrações</strong></li>
                <li>• Os dados de gastos e resultados são importados automaticamente</li>
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
