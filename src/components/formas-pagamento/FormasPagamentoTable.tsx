
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { FormaPagamento } from "@/hooks/useFormasPagamento";

interface FormasPagamentoTableProps {
  formasPagamento: FormaPagamento[];
  onEdit: (forma: FormaPagamento) => void;
  onDelete: (id: string) => void;
}

const FormasPagamentoTable: React.FC<FormasPagamentoTableProps> = ({
  formasPagamento,
  onEdit,
  onDelete
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formasPagamento.map((forma) => (
            <TableRow key={forma.id}>
              <TableCell>{forma.descricao}</TableCell>
              <TableCell>
                <div className="flex justify-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost" 
                    onClick={() => onEdit(forma)} 
                    className="h-8 w-8 text-blue-500 hover:text-blue-600"
                  >
                    <span className="sr-only">Editar</span>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon"
                    variant="ghost" 
                    onClick={() => onDelete(forma.id)} 
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <span className="sr-only">Excluir</span>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FormasPagamentoTable;
