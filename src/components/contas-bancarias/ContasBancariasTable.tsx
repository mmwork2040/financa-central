
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  saldo_inicial: number | null;
  saldo_atual: number | null;
  created_at: string;
  updated_at: string;
}

interface ContasBancariasTableProps {
  contasBancarias: ContaBancaria[];
  onEdit: (conta: ContaBancaria) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ContasBancariasTable: React.FC<ContasBancariasTableProps> = ({
  contasBancarias,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const showActions = canEdit || canDelete;

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Agência</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Saldo Inicial</TableHead>
            <TableHead className="text-right">Saldo Atual</TableHead>
            {showActions && <TableHead className="w-[100px] text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contasBancarias.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell className="font-medium">{conta.nome}</TableCell>
              <TableCell>{conta.banco || '-'}</TableCell>
              <TableCell>{conta.agencia || '-'}</TableCell>
              <TableCell>{conta.conta || '-'}</TableCell>
              <TableCell className="text-right">{formatCurrency(conta.saldo_inicial || 0)}</TableCell>
              <TableCell className={`text-right font-medium ${(conta.saldo_atual || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(conta.saldo_atual || 0)}
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex justify-center space-x-2">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm" 
                        onClick={() => onEdit(conta)} 
                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
                      >
                        <span className="sr-only">Editar</span>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDelete(conta.id)} 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <span className="sr-only">Excluir</span>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContasBancariasTable;
