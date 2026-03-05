
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserX, User as UserIcon } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTableHead from "@/components/common/SortableTableHead";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  nome: string;
  email: string;
  permissao: string;
  created_at: string;
  empresa_id?: string | null;
  empresa_nome?: string | null;
  is_super_admin?: boolean;
  assinatura_status?: string;
}

interface UsersListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onRevoke?: (userId: string, empresaId: string) => void;
  isSuperAdmin?: boolean;
  currentUserId?: string;
}

const getPermissaoLabel = (permissao: string): string => {
  switch (permissao) {
    case "admin": return "Administrador";
    case "editor": return "Editor";
    case "leitura": return "Leitura";
    default: return "Desconhecido";
  }
};

const getPermissaoClass = (permissao: string): string => {
  switch (permissao) {
    case "admin": return "bg-destructive/10 text-destructive";
    case "editor": return "bg-accent text-accent-foreground";
    case "leitura": return "bg-primary/10 text-primary";
    default: return "bg-muted text-muted-foreground";
  }
};

const getAssinaturaLabel = (status?: string): string => {
  switch (status) {
    case "ativo": return "Ativo";
    case "trial": return "Trial";
    case "vencido": return "Vencido";
    case "cancelled": return "Cancelado";
    case "expired": return "Expirado";
    default: return status || "Trial";
  }
};

const getAssinaturaBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "ativo": return "default";
    case "trial": return "secondary";
    case "vencido":
    case "expired":
    case "cancelled": return "destructive";
    default: return "secondary";
  }
};

const getInitials = (nome: string) => {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join("")
    .toUpperCase();
};

export const UsersList = ({ users, onEdit, onDelete, onRevoke, isSuperAdmin, currentUserId }: UsersListProps) => {
  const isMobile = useIsMobile();
  const { canPerformAction } = useAuth();
  const canAlterar = canPerformAction("users", "pode_alterar");
  const canExcluir = canPerformAction("users", "pode_excluir");
  const { sortedItems, sortKey, sortDir, toggleSort } = useTableSort(users);
  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(sortedItems);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((user) => {
          const isTargetSuperAdmin = user.is_super_admin === true;
          const isSelf = user.id === currentUserId;
          const canModify = (!isTargetSuperAdmin || isSelf) && canAlterar;
          const canDelete = (!isTargetSuperAdmin || isSelf) && canExcluir;

          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(user.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{user.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {isSuperAdmin && (
                        <span className="text-[10px] text-muted-foreground">{user.empresa_nome || "Sem empresa"}</span>
                      )}
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPermissaoClass(user.permissao)}`}>
                          {isTargetSuperAdmin ? "Super Admin" : getPermissaoLabel(user.permissao)}
                        </span>
                        <Badge variant={getAssinaturaBadgeVariant(user.assinatura_status)} className="text-[10px]">
                          {getAssinaturaLabel(user.assinatura_status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 ml-2">
                    {canModify && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && onRevoke && user.empresa_id && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-warning" onClick={() => onRevoke(user.id, user.empresa_id!)}>
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && !isSelf && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="Nome" sortKey="nome" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <SortableTableHead label="Email" sortKey="email" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            {isSuperAdmin && <SortableTableHead label="Empresa" sortKey="empresa_nome" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />}
            <SortableTableHead label="Permissão" sortKey="permissao" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <SortableTableHead label="Assinatura" sortKey="assinatura_status" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <SortableTableHead label="Data de Cadastro" sortKey="created_at" currentSortKey={sortKey} currentSortDir={sortDir} onSort={toggleSort} />
            <TableHead className="w-[140px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((user) => {
            const isTargetSuperAdmin = user.is_super_admin === true;
            const isSelf = user.id === currentUserId;
            const canModify = (!isTargetSuperAdmin || isSelf) && canAlterar;
            const canDeleteUser = (!isTargetSuperAdmin || isSelf) && canExcluir;

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(user.nome)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.nome}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{user.empresa_nome || "Sem empresa"}</span>
                  </TableCell>
                )}
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissaoClass(user.permissao)}`}>
                    {isTargetSuperAdmin ? "Super Admin" : getPermissaoLabel(user.permissao)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getAssinaturaBadgeVariant(user.assinatura_status)} className="text-[10px]">
                    {getAssinaturaLabel(user.assinatura_status)}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex justify-center space-x-1">
                    {canModify && (
                      <Button size="icon" variant="ghost" onClick={() => onEdit(user)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteUser && onRevoke && user.empresa_id && (
                      <Button size="icon" variant="ghost" onClick={() => onRevoke(user.id, user.empresa_id!)} className="h-8 w-8 text-warning">
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteUser && !isSelf && (
                      <Button size="icon" variant="ghost" onClick={() => onDelete(user.id)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
