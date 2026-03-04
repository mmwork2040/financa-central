import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, DollarSign, Target, Receipt,
  Clock, CalendarDays, Percent, PiggyBank
} from "lucide-react";
import type { Projeto } from "@/hooks/useProjetos";

interface LancamentoSummary {
  receitasRealizadas: number;
  despesasRealizadas: number;
  receitasPendentes: number;
  despesasPendentes: number;
}

interface Props {
  projeto: Projeto;
  summary: LancamentoSummary;
}

export const ProjetoResumo = ({ projeto, summary }: Props) => {
  const { visible } = useValuesVisibility();
  const display = (val: number) => (visible ? formatCurrency(val) : "••••••");

  const lucro = summary.receitasRealizadas - summary.despesasRealizadas;
  const impostoBase = projeto.imposto_base === "receita" ? summary.receitasRealizadas : Math.max(lucro, 0);
  const imposto = (Number(projeto.imposto_percentual) / 100) * impostoBase;
  const lucroLiquido = lucro - imposto;
  const totalPendente = summary.receitasPendentes - summary.despesasPendentes;

  const cards = [
    { label: "Investimento Previsto", value: projeto.investimento_previsto, icon: Target, color: "text-blue-600" },
    { label: "Despesa Prevista", value: projeto.despesa_prevista, icon: Receipt, color: "text-orange-600" },
    { label: "Receitas Realizadas", value: summary.receitasRealizadas, icon: TrendingUp, color: "text-primary" },
    { label: "Despesas Realizadas", value: summary.despesasRealizadas, icon: TrendingDown, color: "text-destructive" },
    { label: "Lucro Projetado", value: lucro, icon: DollarSign, color: lucro >= 0 ? "text-primary" : "text-destructive" },
    { label: `Imposto (${projeto.imposto_percentual}% s/ ${projeto.imposto_base === "receita" ? "receita" : "lucro"})`, value: imposto, icon: Percent, color: "text-amber-600" },
    { label: "Lucro Líquido", value: lucroLiquido, icon: PiggyBank, color: lucroLiquido >= 0 ? "text-primary" : "text-destructive" },
    { label: "Saldo Pendente", value: totalPendente, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-4">
      {(projeto.data_inicio || projeto.data_fim) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            {projeto.data_inicio ? format(new Date(projeto.data_inicio + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
            {" → "}
            {projeto.data_fim ? format(new Date(projeto.data_fim + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
              <p className={`text-lg font-semibold ${c.color}`}>{display(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
