
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowLeftRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReconciliationItem {
  vendaId: string;
  produto: string;
  plataforma: string;
  valorVenda: number;
  dataVenda: string;
  lancamentoId?: string;
  lancamentoDescricao?: string;
  status: "conciliado" | "pendente" | "divergente";
}

const ReconciliationView = () => {
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState<string | null>(null);

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const fetchReconciliation = async () => {
    setLoading(true);
    try {
      // Get digital sales
      const { data: vendas } = await supabase
        .from("vendas_digitais")
        .select("*")
        .order("data_venda", { ascending: false })
        .limit(50);

      // Get lancamentos with matching descriptions/values
      const { data: lancamentos } = await supabase
        .from("lancamentos")
        .select("*")
        .eq("tipo", "receita")
        .order("data_vencimento", { ascending: false })
        .limit(100);

      const reconciled: ReconciliationItem[] = (vendas || []).map(venda => {
        // Try to find a matching lancamento
        const match = lancamentos?.find(l => 
          Math.abs(l.valor - venda.valor_liquido) < 0.01 &&
          l.descricao?.toLowerCase().includes(venda.produto?.toLowerCase() || "") 
        );

        return {
          vendaId: venda.id,
          produto: venda.produto || "Produto",
          plataforma: venda.plataforma,
          valorVenda: venda.valor_liquido,
          dataVenda: venda.data_venda,
          lancamentoId: match?.id,
          lancamentoDescricao: match?.descricao,
          status: match ? "conciliado" : "pendente",
        };
      });

      setItems(reconciled);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoReconcile = async (item: ReconciliationItem) => {
    setReconciling(item.vendaId);
    try {
      // Create a lancamento from the digital sale
      const { error } = await supabase.from("lancamentos").insert({
        descricao: `${item.produto} (${item.plataforma})`,
        valor: item.valorVenda,
        tipo: "receita",
        status: "recebido",
        data_vencimento: item.dataVenda.split("T")[0],
        data_pagamento: item.dataVenda.split("T")[0],
      });

      if (error) throw error;
      toast.success("Venda conciliada com sucesso!");
      fetchReconciliation();
    } catch (error: any) {
      toast.error(error.message || "Erro ao conciliar");
    } finally {
      setReconciling(null);
    }
  };

  const pendentes = items.filter(i => i.status === "pendente").length;
  const conciliados = items.filter(i => i.status === "conciliado").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Conciliação Automática
        </CardTitle>
        <CardDescription>
          Vendas digitais vs lançamentos financeiros
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma venda digital para conciliar. Conecte suas plataformas em Integrações.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-3">
              <Badge className="bg-green-100 text-green-700">{conciliados} conciliados</Badge>
              <Badge className="bg-amber-100 text-amber-700">{pendentes} pendentes</Badge>
            </div>

            {/* Items */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {items.slice(0, 20).map(item => (
                <div key={item.vendaId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.status === "conciliado" ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <p className="text-sm font-medium truncate">{item.produto}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {item.plataforma} • {formatDate(item.dataVenda)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(item.valorVenda)}</p>
                    {item.status === "pendente" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        disabled={reconciling === item.vendaId}
                        onClick={() => handleAutoReconcile(item)}
                      >
                        {reconciling === item.vendaId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : "Conciliar"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReconciliationView;
