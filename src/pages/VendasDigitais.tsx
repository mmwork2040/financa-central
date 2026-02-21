
import React, { useState, useEffect } from "react";
import { ShoppingCart, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const VendasDigitais = () => {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVendas();
  }, []);

  const fetchVendas = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vendas_digitais')
        .select('*')
        .order('data_venda', { ascending: false });
      if (error) throw error;
      setVendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = vendas.filter(v => 
    v.produto?.toLowerCase().includes(search.toLowerCase()) ||
    v.cliente?.toLowerCase().includes(search.toLowerCase()) ||
    v.plataforma?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    aprovada: "bg-green-100 text-green-700",
    pendente: "bg-amber-100 text-amber-700",
    reembolsada: "bg-red-100 text-red-700",
    cancelada: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Vendas Digitais</h1>
        </div>
        <p className="text-sm text-muted-foreground">Vendas recebidas das plataformas conectadas</p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por produto, cliente ou plataforma..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhuma venda digital ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Conecte suas plataformas em <strong>Configurações → Integrações</strong> para começar a receber vendas automaticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(venda => (
            <Card key={venda.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold truncate">{venda.produto || "Produto"}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">{venda.plataforma}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{venda.cliente || "—"} • {formatDate(venda.data_venda)}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(venda.valor_liquido)}</p>
                  {venda.taxa > 0 && (
                    <p className="text-[10px] text-muted-foreground">Taxa: {formatCurrency(venda.taxa)}</p>
                  )}
                  <Badge className={cn("text-[10px] mt-1", statusColors[venda.status] || "")}>
                    {venda.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendasDigitais;
