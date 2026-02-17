
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check, Pencil, Trash2 } from "lucide-react";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { formatCurrency } from "@/utils/format";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useValuesVisibility } from "@/contexts/ValuesVisibilityContext";

export const LancamentosTable = () => {
  const { canPerformAction } = useAuth();
  const canAlterar = canPerformAction("lancamentos", "pode_alterar");
  const canExcluir = canPerformAction("lancamentos", "pode_excluir");
  const isMobile = useIsMobile();
  const { visible } = useValuesVisibility();
  const displayCurrency = (val: number) => visible ? formatCurrency(val) : "••••••";

  const { 
    lancamentos, handleSort, handleOpenModal, handleOpenDeleteModal, handleUpdateStatus,
    getStatusBadgeClass, getStatusLabel, getTipoBadgeClass
  } = useLancamentosContext();

  const showActions = canAlterar || canExcluir;
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(lancamentos);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((l) => (
          <Card key={l.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{l.descricao}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTipoBadgeClass(l.tipo)}`}>
                      {l.tipo === "receita" ? "Receita" : l.tipo === "investimento" ? "Investimento" : "Despesa"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadgeClass(l.status)}`}>
                      {getStatusLabel(l.status, l.tipo)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.data_vencimento).toLocaleDateString()}
                    {l.categoria?.nome ? ` · ${l.categoria.nome}` : ''}
                  </p>
                  {(l.fornecedor || l.cliente) && (
                    <p className="text-xs text-muted-foreground">
                      {l.fornecedor ? `Forn: ${l.fornecedor.nome}` : `Cli: ${l.cliente?.nome}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <p className={`text-sm font-semibold ${l.tipo === "receita" ? "text-primary" : l.tipo === "investimento" ? "text-accent-foreground" : "text-destructive"}`}>
                    {displayCurrency(l.valor)}
                  </p>
                  {showActions && (
                    <div className="flex gap-0.5">
                      {canAlterar && l.status === "pendente" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary"
                          onClick={() => handleUpdateStatus(l.id!, l.tipo === "receita" ? "recebido" : "pago")}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canAlterar && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenModal(l)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canExcluir && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleOpenDeleteModal(l.id!)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('data_vencimento')}>
                Vencimento <ArrowUpDown className="ml-2 h-3 w-3" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('descricao')}>
                Descrição <ArrowUpDown className="ml-2 h-3 w-3" />
              </div>
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('valor')}>
                Valor <ArrowUpDown className="ml-2 h-3 w-3" />
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="w-[150px] text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lancamentos.map((lancamento) => (
            <TableRow key={lancamento.id}>
              <TableCell>{new Date(lancamento.data_vencimento).toLocaleDateString()}</TableCell>
              <TableCell className="font-medium">
                {lancamento.descricao}
                <div className="text-xs text-muted-foreground">
                  {lancamento.fornecedor ? `Fornecedor: ${lancamento.fornecedor.nome}` : 
                    lancamento.cliente ? `Cliente: ${lancamento.cliente.nome}` : ''}
                </div>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeClass(lancamento.tipo)}`}>
                  {lancamento.tipo === "receita" ? "Receita" : lancamento.tipo === "investimento" ? "Investimento" : "Despesa"}
                </span>
              </TableCell>
              <TableCell>{lancamento.categoria?.nome || '-'}</TableCell>
              <TableCell className={`font-medium ${lancamento.tipo === "receita" ? "text-primary" : lancamento.tipo === "investimento" ? "text-accent-foreground" : "text-destructive"}`}>
                {displayCurrency(lancamento.valor)}
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
                      <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(lancamento.id!, lancamento.tipo === "receita" ? "recebido" : "pago")} className="h-8 w-8 p-0 text-primary">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {canAlterar && (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(lancamento)} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canExcluir && (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteModal(lancamento.id!)} className="h-8 w-8 p-0 text-destructive">
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
