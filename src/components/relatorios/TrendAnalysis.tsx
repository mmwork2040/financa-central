
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";

interface TrendAnalysisProps {
  dataFluxo: {name: string; receitas: number; despesas: number}[];
  periodo: string;
  totalReceitas: number;
  totalDespesas: number;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ 
  dataFluxo, 
  periodo, 
  totalReceitas, 
  totalDespesas 
}) => {
  const getPeriodoLabel = () => {
    switch (periodo) {
      case 'mes': return 'Último mês';
      case 'trimestre': return 'Último trimestre';
      case 'semestre': return 'Último semestre';
      case 'ano': return 'Último ano';
      default: return periodo;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendências</CardTitle>
        <CardDescription>
          Análise do período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Período analisado</span>
            <span className="font-medium">{getPeriodoLabel()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Saldo do período</span>
            <span className={`font-bold ${totalReceitas >= totalDespesas ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalReceitas - totalDespesas)}
            </span>
          </div>
          {dataFluxo.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período com maior receita</span>
                <span className="font-medium">
                  {dataFluxo.reduce((max, item) => item.receitas > max.receitas ? item : max, dataFluxo[0])?.name || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período com maior despesa</span>
                <span className="font-medium">
                  {dataFluxo.reduce((max, item) => item.despesas > max.despesas ? item : max, dataFluxo[0])?.name || "-"}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendAnalysis;
