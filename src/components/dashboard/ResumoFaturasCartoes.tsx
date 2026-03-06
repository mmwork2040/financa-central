import React, { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useMonthFilter } from "@/contexts/MonthFilterContext";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

type CartaoResumo = {
  id: string;
  nome: string;
  bandeira: string | null;
  ultimos_digitos: string | null;
  limite: number | null;
  totalFatura: number;
  qtdLancamentos: number;
  totalPago: number;
  totalPendente: number;
};

const ResumoFaturasCartoes = () => {
  const { monthStart, monthEnd } = useMonthFilter();
  const { visible } = useValuesVisibility();
  const [resumos, setResumos] = useState<CartaoResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [{ data: cartoes }, { data: lancamentos }] = await Promise.all([
          (supabase as any).from("cartoes_credito").select("id, nome, bandeira, ultimos_digitos, limite").eq("ativo", true),
          (supabase as any).from("lancamentos").select("cartao_credito_id, valor, status").not("cartao_credito_id", "is", null).gte("data_vencimento", monthStart).lte("data_vencimento", monthEnd),
        ]);

        if (!cartoes?.length) { setResumos([]); return; }

        const map = new Map<string, CartaoResumo>();
        for (const c of cartoes) {
          map.set(c.id, {
            id: c.id, nome: c.nome, bandeira: c.bandeira, ultimos_digitos: c.ultimos_digitos,
            limite: c.limite, totalFatura: 0, qtdLancamentos: 0, totalPago: 0, totalPendente: 0,
          });
        }

        for (const l of lancamentos || []) {
          const r = map.get(l.cartao_credito_id);
          if (!r) continue;
          const v = Number(l.valor) || 0;
          r.totalFatura += v;
          r.qtdLancamentos += 1;
          if (l.status === "pago") r.totalPago += v; else r.totalPendente += v;
        }

        setResumos(Array.from(map.values()).filter(r => r.qtdLancamentos > 0));
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetch();
  }, [monthStart, monthEnd]);

  if (loading || resumos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="text-base font-semibold">Faturas do Mês</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resumos.map((r) => {
          const pct = r.limite && r.limite > 0 ? Math.min((r.totalFatura / r.limite) * 100, 100) : 0;
          return (
            <Card key={r.id} className="hover:-translate-y-0.5 transition-all hover:shadow-lg">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-full bg-primary/10 p-1.5">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.bandeira || ""}{r.ultimos_digitos ? ` •••• ${r.ultimos_digitos}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant={r.totalPendente > 0 ? "destructive" : "default"} className="text-[10px] shrink-0">
                    {r.totalPendente > 0 ? "Pendente" : "Pago"}
                  </Badge>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {maskValue(formatCurrency(r.totalFatura), visible)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.qtdLancamentos} lançamento{r.qtdLancamentos !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {r.limite && r.limite > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {maskValue(formatCurrency(r.limite), visible)} limite
                    </p>
                  )}
                </div>

                {r.limite && r.limite > 0 && (
                  <Progress
                    value={pct}
                    className={cn("h-2", pct > 80 ? "[&>div]:bg-destructive" : "[&>div]:bg-primary")}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ResumoFaturasCartoes;
