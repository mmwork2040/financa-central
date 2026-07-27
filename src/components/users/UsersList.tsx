
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserX, RefreshCw, AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LimitesUsuarioButton from "./LimitesUsuarioButton";

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
  trial_started_at?: string | null;
}

const isUserExpired = (user: User): boolean => {
  if (user.is_super_admin) return false;
  const status = user.assinatura_status || "trial";
  if (["vencido", "expired", "cancelled"].includes(status)) return true;
  if (status === "trial") {
    const started = user.trial_started_at || user.created_at;
    if (!started) return false;
    const end = new Date(started);
    end.setDate(end.getDate() + 30);
    return new Date() > end;
  }
}

const getTrialInfo = (user: User): { label: string; expired: boolean } | null => {
  if (user.is_super_admin) return null;
  if ((user.assinatura_status || "trial") !== "trial") return null;
  const started = user.trial_started_at || user.created_at;
  if (!started) return null;
  const end = new Date(started);
  end.setDate(end.getDate() + 30);
  const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
  const dateStr = end.toLocaleDateString("pt-BR");
  return days > 0
    ? { label: `Trial até ${dateStr} (${days} ${days === 1 ? "dia" : "dias"})`, expired: false }
    : { label: `Trial expirado em ${dateStr}`, expired: true };
}


interface UsersListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onRevoke?: (userId: string, empresaId: string) => void;
  isSuperAdmin?: boolean;
  currentUserId?: string;
  onRefresh?: () => void;
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

const statusOptions = [
  { value: "trial", label: "Trial" },
  { value: "ativo", label: "Ativo" },
  { value: "vencido", label: "Vencido" },
  { value: "cancelled", label: "Cancelado" },
  { value: "expired", label: "Expirado" },
];

const getAssinaturaLabel = (status?: string): string => {
  return statusOptions.find(s => s.value === status)?.label || status || "Trial";
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

const AssinaturaBadge = ({ user, isSuperAdmin, onRefresh }: { user: User; isSuperAdmin?: boolean; onRefresh?: () => void }) => {
  const [updating, setUpdating] = useState(false);

  const handleChangeStatus = async (newStatus: string) => {
    if (newStatus === (user.assinatura_status || "trial")) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ assinatura_status: newStatus })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(`Assinatura de ${user.nome} alterada para "${getAssinaturaLabel(newStatus)}".`);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar status.");
    } finally {
      setUpdating(false);
    }
  };

  const badge = (
    <Badge
      variant={getAssinaturaBadgeVariant(user.assinatura_status)}
      className={`text-[10px] ${isSuperAdmin ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      {updating ? "..." : getAssinaturaLabel(user.assinatura_status)}
    </Badge>
  );

  if (!isSuperAdmin) return badge;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{badge}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[120px]">
        {statusOptions.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleChangeStatus(opt.value)}
            className={opt.value === (user.assinatura_status || "trial") ? "font-semibold bg-muted" : ""}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const RenewTrialButton = ({ user, onRefresh }: { user: User; onRefresh?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [saving, setSaving] = useState(false);

  const handleRenew = async () => {
    setSaving(true);
    try {
      const newStart = new Date(Date.now() - (30 - days) * 86400000).toISOString();
      const { error } = await supabase
        .from("perfis")
        .update({ assinatura_status: "trial", trial_started_at: newStart })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(`Teste de ${user.nome} renovado por ${days} dias.`);
      setOpen(false);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao renovar teste.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-amber-600"
        title="Renovar período de testes"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renovar período de testes</DialogTitle>
            <DialogDescription>
              Estender o teste de <strong>{user.nome}</strong> por mais alguns dias.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Dias adicionais</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
            />
            <div className="flex gap-1 flex-wrap">
              {[7, 15, 30].map((d) => (
                <Button key={d} type="button" size="sm" variant="outline" onClick={() => setDays(d)}>
                  {d} dias
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleRenew} disabled={saving}>
              {saving ? "Salvando..." : "Renovar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const UsersList = ({ users, onEdit, onDelete, onRevoke, isSuperAdmin, currentUserId, onRefresh }: UsersListProps) => {
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
          const expired = isUserExpired(user);

          return (
            <Card key={user.id} className={expired ? "border-destructive/50 bg-destructive/5" : ""}>
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
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPermissaoClass(user.permissao)}`}>
                          {isTargetSuperAdmin ? "Super Admin" : getPermissaoLabel(user.permissao)}
                        </span>
                        <AssinaturaBadge user={user} isSuperAdmin={isSuperAdmin} onRefresh={onRefresh} />
                        {expired && (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" /> Expirado
                          </Badge>
                        )}
                      </div>
                      {getTrialInfo(user) && (
                        <p className={`text-[10px] ${getTrialInfo(user)!.expired ? "text-destructive" : "text-muted-foreground"}`}>
                          {getTrialInfo(user)!.label}
                        </p>
                      )}

                    </div>
                  </div>
                  <div className="flex gap-0.5 ml-2">
                    {canModify && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {isSuperAdmin && expired && !isTargetSuperAdmin && (
                      <RenewTrialButton user={user} onRefresh={onRefresh} />
                    )}
                    {isSuperAdmin && !isTargetSuperAdmin && (
                      <LimitesUsuarioButton userId={user.id} userName={user.nome} onSaved={onRefresh} />
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
            const expired = isUserExpired(user);

            return (
              <TableRow key={user.id} className={expired ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(user.nome)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.nome}</span>
                    {expired && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="h-3 w-3" /> Expirado
                      </Badge>
                    )}
                  </div>
                  {getTrialInfo(user) && (
                    <span className={`block mt-1 ml-11 text-[10px] ${getTrialInfo(user)!.expired ? "text-destructive" : "text-muted-foreground"}`}>
                      {getTrialInfo(user)!.label}
                    </span>
                  )}

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
                  <AssinaturaBadge user={user} isSuperAdmin={isSuperAdmin} onRefresh={onRefresh} />
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <div className="flex justify-center space-x-1">
                    {canModify && (
                      <Button size="icon" variant="ghost" onClick={() => onEdit(user)} className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {isSuperAdmin && expired && !isTargetSuperAdmin && (
                      <RenewTrialButton user={user} onRefresh={onRefresh} />
                    )}
                    {isSuperAdmin && !isTargetSuperAdmin && (
                      <LimitesUsuarioButton userId={user.id} userName={user.nome} onSaved={onRefresh} />
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
