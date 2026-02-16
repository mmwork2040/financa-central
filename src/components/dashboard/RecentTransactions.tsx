
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Lancamento {
  id: string;
  descricao: string;
  tipo: 'receita' | 'despesa' | 'investimento';
  valor: number;
  data_vencimento: string;
  status: string;
  cliente?: {
    nome: string;
  };
  fornecedor?: {
    nome: string;
  };
  categoria?: {
    nome: string;
  };
}

interface RecentTransactionsProps {
  lancamentos: Lancamento[];
  formatCurrency: (value: number | null) => string;
  formatDate: (dateString: string | null) => string;
}

export const RecentTransactions = ({
  lancamentos,
  formatCurrency,
  formatDate
}: RecentTransactionsProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Lançamentos Recentes</CardTitle>
        <CardDescription>
          Últimos lançamentos registrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lancamentos.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <div className="-mx-4 -my-2 max-h-[260px] overflow-y-auto">
            <table className="w-full table-auto">
              <tbody>
                {lancamentos.map((lancamento) => (
                  <tr key={lancamento.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium">{lancamento.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {lancamento.tipo === 'receita' 
                            ? `Cliente: ${lancamento.cliente?.nome || '-'}` 
                            : lancamento.tipo === 'investimento'
                            ? `Investimento`
                            : `Fornecedor: ${lancamento.fornecedor?.nome || '-'}`}
                        </p>
                        {lancamento.categoria && (
                          <p className="text-xs text-muted-foreground">
                            Categoria: {lancamento.categoria.nome}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <p className="text-right">
                          <span className={`font-medium ${
                            lancamento.tipo === 'receita' ? 'text-green-600' : lancamento.tipo === 'investimento' ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(lancamento.valor)}
                          </span>
                        </p>
                        <p className="text-right text-xs text-muted-foreground">
                          Venc: {formatDate(lancamento.data_vencimento)}
                        </p>
                        <p className="text-right text-xs text-muted-foreground">
                          Status: {lancamento.status.charAt(0).toUpperCase() + lancamento.status.slice(1)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
