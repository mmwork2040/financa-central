
import React from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/formatters";

interface FluxoCaixaChartProps {
  data: {name: string; receitas: number; despesas: number; receitasPrevistas?: number; despesasPrevistas?: number}[];
}

const FluxoCaixaChart: React.FC<FluxoCaixaChartProps> = ({ data }) => {
  const hasPrevistas = data.some(d => (d.receitasPrevistas || 0) > 0 || (d.despesasPrevistas || 0) > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
        <CardDescription>
          Evolução de receitas e despesas ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Nenhum lançamento encontrado no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value).split(',')[0]} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas Confirmadas" fill="#10b981" stackId="receitas" />
              {hasPrevistas && (
                <Bar dataKey="receitasPrevistas" name="Receitas Previstas" fill="#6ee7b7" stackId="receitas" />
              )}
              <Bar dataKey="despesas" name="Despesas Confirmadas" fill="#ef4444" stackId="despesas" />
              {hasPrevistas && (
                <Bar dataKey="despesasPrevistas" name="Despesas Previstas" fill="#fca5a5" stackId="despesas" />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FluxoCaixaChart;
