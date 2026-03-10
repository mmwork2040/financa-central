import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Loader2, Ticket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InvitePermissionsConfig from "./InvitePermissionsConfig";

interface InviteCode {
  id: string;
  code: string;
  role: string;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  empresa_id?: string;
  redeemed_by?: string | null;
  redeemed_by_name?: string | null;
  redeemed_by_email?: string | null;
  redeemed_at?: string | null;
}

export interface ScreenPermission {
  tela: string;
  nome: string;
  pode_incluir: boolean;
  pode_alterar: boolean;
  pode_excluir: boolean;
}

export const screens = [
  { value: "users", name: "Usuários" },
  { value: "permissions", name: "Permissões" },
  { value: "fornecedores", name: "Fornecedores" },
  { value: "clientes", name: "Clientes" },
  { value: "categorias", name: "Categorias" },
  { value: "contas_bancarias", name: "Contas Bancárias" },
  { value: "formas_pagamento", name: "Formas de Pagamento" },
  { value: "lancamentos", name: "Lançamentos" },
  { value: "relatorios", name: "Relatórios" },
];

const defaultPermissions = (): ScreenPermission[] =>
  screens.map(s => ({ tela: s.value, nome: s.name, pode_incluir: false, pode_alterar: false, pode_excluir: false }));

const InviteCodesCard = () => {
  const { empresaId, userRole, isSuperAdmin } = useAuth();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [maxUses, setMaxUses] = useState("5");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [deleteTarget, setDeleteTarget] = useState<InviteCode | null>(null);
  const [deletingCode, setDeletingCode] = useState(false);
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const [screenPermissions, setScreenPermissions] = useState<ScreenPermission[]>(defaultPermissions());

  const isAdmin = userRole === "admin" || isSuperAdmin;

  useEffect(() => {
    if (isAdmin && empresaId) fetchCodes();
  }, [empresaId, isAdmin]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("invite_codes")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCodes(data || []);
    } catch (error: any) {
      console.error("Error fetching invite codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const role = isAdminRole ? "admin" : "usuario";
      const body: any = { role, maxUses: parseInt(maxUses), expiresInDays: parseInt(expiresInDays) };
      if (!isAdminRole) {
        const activePerms = screenPermissions.filter(p => p.pode_incluir || p.pode_alterar || p.pode_excluir);
        body.permissoes = activePerms.map(p => ({ tela: p.tela, pode_incluir: p.pode_incluir, pode_alterar: p.pode_alterar, pode_excluir: p.pode_excluir }));
      }
      const { data, error } = await supabase.functions.invoke("generate-invite-code", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Código gerado: ${data.invite.code}`);
      fetchCodes();
      setScreenPermissions(defaultPermissions());
      setIsAdminRole(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar código");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência.");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingCode(true);
    try {
      if (deleteTarget.redeemed_by && deleteTarget.empresa_id) {
        const { error: roleError } = await supabase.from("user_roles").delete().eq("user_id", deleteTarget.redeemed_by).eq("empresa_id", deleteTarget.empresa_id);
        if (roleError) throw roleError;
        await (supabase as any).from("permissoes").delete().eq("perfis_id", deleteTarget.redeemed_by);
        const { data: remainingRoles } = await supabase.from("user_roles").select("empresa_id").eq("user_id", deleteTarget.redeemed_by);
        if (remainingRoles && remainingRoles.length > 0) {
          await supabase.from("perfis").update({ empresa_id: remainingRoles[0].empresa_id }).eq("id", deleteTarget.redeemed_by);
        } else {
          await supabase.from("perfis").update({ empresa_id: null }).eq("id", deleteTarget.redeemed_by);
        }
      }
      const { error } = await (supabase as any).from("invite_codes").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setCodes(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success(deleteTarget.redeemed_by ? "Código removido. O acesso do usuário à empresa também foi revogado." : "Código removido");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover");
    } finally {
      setDeletingCode(false);
      setDeleteTarget(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5" />
            Códigos de Convite
          </CardTitle>
          <CardDescription>
            Gere códigos para convidar pessoas para esta empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário de geração */}
          <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Administrador</Label>
                <Switch checked={isAdminRole} onCheckedChange={setIsAdminRole} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Máx. usos (0 = ilimitado)</Label>
                <Input className="w-20 h-9" type="number" min="0" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expira em dias (0 = nunca)</Label>
                <Input className="w-24 h-9" type="number" min="0" value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)} />
              </div>
              <Button onClick={() => setShowConfirmGenerate(true)} disabled={generating} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Gerar Código
              </Button>
            </div>

            {!isAdminRole && (
              <InvitePermissionsConfig
                screenPermissions={screenPermissions}
                onPermissionChange={(tela, field, value) =>
                  setScreenPermissions(prev => prev.map(p => p.tela === tela ? { ...p, [field]: value } : p))
                }
                onToggleAll={() => {
                  const allChecked = screenPermissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir);
                  setScreenPermissions(prev => prev.map(p => ({ ...p, pode_incluir: !allChecked, pode_alterar: !allChecked, pode_excluir: !allChecked })));
                }}
                onToggleRow={(tela, checked) =>
                  setScreenPermissions(prev => prev.map(p => p.tela === tela ? { ...p, pode_incluir: checked, pode_alterar: checked, pode_excluir: checked } : p))
                }
              />
            )}
          </div>

          {/* Lista de códigos */}
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum código gerado ainda.</p>
          ) : (
            <div className="space-y-2">
              {codes.map(code => <InviteCodeItem key={code.id} code={code} onCopy={handleCopy} onDelete={setDeleteTarget} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de exclusão */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              {deleteTarget?.redeemed_by
                ? "Este código já foi resgatado. Excluí-lo também revogará o acesso do usuário à empresa. Deseja continuar?"
                : "Deseja realmente excluir este código de convite?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deletingCode}>
              {deletingCode && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação */}
      <Dialog open={showConfirmGenerate} onOpenChange={setShowConfirmGenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Código de Convite</DialogTitle>
            <DialogDescription>
              Será gerado um código com perfil <strong>{isAdminRole ? "Administrador" : "Usuário"}</strong>,
              máximo de <strong>{maxUses === "0" ? "ilimitados" : maxUses}</strong> usos
              {expiresInDays !== "0" && <>, expirando em <strong>{expiresInDays} dias</strong></>}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmGenerate(false)}>Cancelar</Button>
            <Button onClick={() => { setShowConfirmGenerate(false); handleGenerate(); }} disabled={generating}>
              {generating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Sub-componente para cada código
const InviteCodeItem = ({ code, onCopy, onDelete }: { code: InviteCode; onCopy: (c: string) => void; onDelete: (c: InviteCode) => void }) => {
  const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
  const isUsedUp = code.max_uses > 0 && code.uses >= code.max_uses;
  const isInactive = !code.active;

  return (
    <div className={`rounded-lg border p-3 space-y-1.5 ${isInactive ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <code className="font-mono text-base font-bold tracking-wider">{code.code}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onCopy(code.code)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-xs">{code.role}</Badge>
          <span className="text-xs text-muted-foreground">{code.uses}/{code.max_uses === 0 ? "∞" : code.max_uses} usos</span>
          {isInactive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
          {isExpired && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
          {isUsedUp && !isInactive && <Badge variant="secondary" className="text-xs">Esgotado</Badge>}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(code)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {code.redeemed_by_name && (
        <p className="text-xs text-muted-foreground pl-1">
          Usado por <span className="font-medium text-foreground">{code.redeemed_by_name}</span>
          {code.redeemed_by_email && <span> ({code.redeemed_by_email})</span>}
          {code.redeemed_at && <span> em {new Date(code.redeemed_at).toLocaleDateString()}</span>}
        </p>
      )}
    </div>
  );
};

export default InviteCodesCard;
