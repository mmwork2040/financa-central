
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check, Pencil, Trash2 } from "lucide-react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";
import { useAuth } from "@/contexts/AuthContext";

export const LancamentosTable = () => {
  const { canPerformAction } = useAuth();
  const canAlterar = canPerformAction("lancamentos", "pode_alterar");
  const canExcluir = canPerformAction("lancamentos", "pode_excluir");

  const { 
    lancamentos, 
    handleSort, 
    handleOpenModal, 
    handleOpenDeleteModal, 
    handleUpdateStatus,
    getStatusBadgeClass,
    getStatusLabel,
    getTipoBadgeClass
  } = useLancamentosContext();

  const showActions = canAlterar || canExcluir;

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('data_vencimento')}>
                Vencimento
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('descricao')}>
                Descrição
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </div>
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('valor')}>
                Valor
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="w-[150px] text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lancamentos.map((lancamento) => (
            <TableRow key={lancamento.id}>
              <TableCell>
                {new Date(lancamento.data_vencimento).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-medium">
                {lancamento.descricao}
                <div className="text-xs text-gray-500">
                  {lancamento.fornecedor ? `Fornecedor: ${lancamento.fornecedor.nome}` : 
                    lancamento.cliente ? `Cliente: ${lancamento.cliente.nome}` : ''}
                </div>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeClass(lancamento.tipo)}`}>
                  {lancamento.tipo === "receita" ? "Receita" : "Despesa"}
                </span>
              </TableCell>
              <TableCell>
                {lancamento.categoria?.nome || '-'}
              </TableCell>
              <TableCell className={`font-medium ${lancamento.tipo === "receita" ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(lancamento.valor)}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(lancamento.status)}`}>
                  {getStatusLabel(lancamento.status, lancamento.tipo)}
                </span>
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex justify-center space-x-1">
                    {canAlterar && lancamento.status === "pendente" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUpdateStatus(
                          lancamento.id!, 
                          lancamento.tipo === "receita" ? "recebido" : "pago"
                        )} 
                        className="h-8 w-8 p-0 text-green-600"
                      >
                        <span className="sr-only">Marcar como pago/recebido</span>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {canAlterar && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenModal(lancamento)} 
                        className="h-8 w-8 p-0 text-blue-600"
                      >
                        <span className="sr-only">Editar</span>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canExcluir && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenDeleteModal(lancamento.id!)} 
                        className="h-8 w-8 p-0 text-red-600"
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
