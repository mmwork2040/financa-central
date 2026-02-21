
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserX, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import MobilePagination, { usePagination } from "@/components/common/MobilePagination";

interface User {
  id: string;
  nome: string;
  email: string;
  permissao: string;
  created_at: string;
  empresa_id?: string | null;
  empresa_nome?: string | null;
  is_super_admin?: boolean;
}

type SortKey = "nome" | "email" | "empresa_nome" | "permissao" | "created_at";
type SortDir = "asc" | "desc";

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

export const UsersList = ({ users, onEdit, onDelete, onRevoke, isSuperAdmin, currentUserId }: UsersListProps) => {
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedUsers = useMemo(() => {
    if (!sortKey) return users;
    return [...users].sort((a, b) => {
      if (sortKey === "created_at") {
        return sortDir === "asc"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const aVal = ((a as any)[sortKey] ?? "").toString().toLowerCase();
      const bVal = ((b as any)[sortKey] ?? "").toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [users, sortKey, sortDir]);

  const { currentPage, totalPages, setCurrentPage, paginatedItems } = usePagination(sortedUsers);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3 inline" />
      : <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedItems.map((user) => {
          const isTargetSuperAdmin = user.is_super_admin === true;
          const isSelf = user.id === currentUserId;
          const canModify = !isTargetSuperAdmin || isSelf;

          return (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {isSuperAdmin && (
                      <span className="text-[10px] text-muted-foreground">{user.empresa_nome || "Sem empresa"}</span>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPermissaoClass(user.permissao)}`}>
                      {isTargetSuperAdmin ? "Super Admin" : getPermissaoLabel(user.permissao)}
                    </span>
                  </div>
                  <div className="flex gap-0.5 ml-2">
                    {canModify && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canModify && onRevoke && user.empresa_id && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-warning" onClick={() => onRevoke(user.id, user.empresa_id!)}>
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {canModify && !isSelf && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!canModify && (
                      <span className="text-xs text-muted-foreground italic self-center">Protegido</span>
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
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("nome")}>Nome <SortIcon column="nome" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("email")}>Email <SortIcon column="email" /></TableHead>
            {isSuperAdmin && <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("empresa_nome")}>Empresa <SortIcon column="empresa_nome" /></TableHead>}
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("permissao")}>Permissão <SortIcon column="permissao" /></TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("created_at")}>Data de Cadastro <SortIcon column="created_at" /></TableHead>
            <TableHead className="w-[140px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((user) => {
            const isTargetSuperAdmin = user.is_super_admin === true;
            const isSelf = user.id === currentUserId;
            const canModify = !isTargetSuperAdmin || isSelf;

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nome}</TableCell>
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
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex justify-center space-x-1">
                    {canModify && (
                      <Button size="icon" variant="ghost" onClick={() => onEdit(user)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canModify && onRevoke && user.empresa_id && (
                      <Button size="icon" variant="ghost" onClick={() => onRevoke(user.id, user.empresa_id!)} className="h-8 w-8 text-warning">
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {canModify && !isSelf && (
                      <Button size="icon" variant="ghost" onClick={() => onDelete(user.id)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!canModify && (
                      <span className="text-xs text-muted-foreground italic">Protegido</span>
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
