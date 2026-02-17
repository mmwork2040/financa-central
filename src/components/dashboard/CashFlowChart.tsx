
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CashFlowChartProps {
  data: Array<{
    name: string;
    receitas: number;
    despesas: number;
  }>;
  formatCurrency: (value: number) => string;
}

export const CashFlowChart = ({ data, formatCurrency }: CashFlowChartProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
        <CardDescription>
          Receitas e despesas dos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] px-2 sm:px-6">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Não há dados disponíveis</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="#10b981" />
              <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
