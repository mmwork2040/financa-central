import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Loader2, Ticket, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface Empresa {
  id: string;
  nome: string;
}

interface ScreenPermission {
  tela: string;
  nome: string;
  pode_incluir: boolean;
  pode_alterar: boolean;
  pode_excluir: boolean;
}

const screens = [
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

const InviteCodesCard = () => {
  const { empresaId, userRole, isSuperAdmin } = useAuth();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [maxUses, setMaxUses] = useState("5");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<InviteCode | null>(null);
  const [deletingCode, setDeletingCode] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const [screenPermissions, setScreenPermissions] = useState<ScreenPermission[]>(
    screens.map(s => ({ tela: s.value, nome: s.name, pode_incluir: false, pode_alterar: false, pode_excluir: false }))
  );

  const isAdmin = userRole === "admin" || isSuperAdmin;

  useEffect(() => {
    if (isAdmin) {
      fetchCodes();
      if (isSuperAdmin) fetchAllEmpresas();
    }
  }, [empresaId, isAdmin, isSuperAdmin]);

  useEffect(() => {
    if (empresaId) setSelectedEmpresaId(empresaId);
  }, [empresaId]);

  const fetchAllEmpresas = async () => {
    try {
      const { data, error } = await supabase.from("empresas").select("id, nome").eq("pessoal", false).order("nome");
      if (error) throw error;
      setAllEmpresas(data || []);
    } catch (error: any) {
      console.error("Error fetching empresas:", error);
    }
  };

  const fetchCodes = async () => {
    try {
      setLoading(true);
      let query = (supabase as any).from("invite_codes").select("*").order("created_at", { ascending: false });
      if (!isSuperAdmin && empresaId) query = query.eq("empresa_id", empresaId);
      const { data, error } = await query;
      if (error) throw error;
      setCodes(data || []);
    } catch (error: any) {
      console.error("Error fetching invite codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (tela: string, field: 'pode_incluir' | 'pode_alterar' | 'pode_excluir', value: boolean) => {
    setScreenPermissions(prev => prev.map(p => p.tela === tela ? { ...p, [field]: value } : p));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const role = isAdminRole ? "admin" : "usuario";
      const body: any = { role, maxUses: parseInt(maxUses), expiresInDays: parseInt(expiresInDays) };
      if (isSuperAdmin && selectedEmpresaId) body.empresaId = selectedEmpresaId;
      if (!isAdminRole) {
        const activePerms = screenPermissions.filter(p => p.pode_incluir || p.pode_alterar || p.pode_excluir);
        body.permissoes = activePerms.map(p => ({ tela: p.tela, pode_incluir: p.pode_incluir, pode_alterar: p.pode_alterar, pode_excluir: p.pode_excluir }));
      }
      const { data, error } = await supabase.functions.invoke("generate-invite-code", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Código gerado: ${data.invite.code}`);
      fetchCodes();
      setScreenPermissions(screens.map(s => ({ tela: s.value, nome: s.name, pode_incluir: false, pode_alterar: false, pode_excluir: false })));
      setShowPermissions(false);
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
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Códigos de Convite
        </CardTitle>
        <CardDescription>
          {isSuperAdmin
            ? "Gere códigos para convidar pessoas para qualquer empresa do sistema"
            : "Gere códigos para convidar pessoas para sua empresa"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            {isSuperAdmin && (
              <div className="space-y-1">
                <Label className="text-xs">Empresa</Label>
                <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                  <SelectContent>
                    {allEmpresas.map(e => (<SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label className="text-xs">Administrador</Label>
              <Switch checked={isAdminRole} onCheckedChange={setIsAdminRole} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Máx. usos (0 = ilimitado)</Label>
              <Input className="w-20" type="number" min="0" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expira em dias (0 = nunca)</Label>
              <Input className="w-24" type="number" min="0" value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)} />
            </div>
            <Button onClick={() => setShowConfirmGenerate(true)} disabled={generating} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Gerar Código
            </Button>
          </div>

          {!isAdminRole && (
            <div className="space-y-3">
              <Button variant="outline" size="sm" onClick={() => setShowPermissions(!showPermissions)} className="w-full justify-between">
                <span>Configurar Permissões de Acesso</span>
                {showPermissions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showPermissions && (
                <div className="rounded-md border">
                  <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                      const allChecked = screenPermissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir);
                      setScreenPermissions(prev => prev.map(p => ({ ...p, pode_incluir: !allChecked, pode_alterar: !allChecked, pode_excluir: !allChecked })));
                    }}>
                      {screenPermissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir) ? "Desmarcar Tudo" : "Selecionar Tudo"}
                    </Button>
                  </div>
                  <table className="w-full table-auto text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Tela</th>
                        <th className="px-3 py-2 text-center font-medium">Incluir</th>
                        <th className="px-3 py-2 text-center font-medium">Alterar</th>
                        <th className="px-3 py-2 text-center font-medium">Excluir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {screenPermissions.map(perm => {
                        const allRowChecked = perm.pode_incluir && perm.pode_alterar && perm.pode_excluir;
                        return (
                        <tr key={perm.tela} className="border-t hover:bg-muted/50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={allRowChecked} onCheckedChange={(checked) => {
                                const val = !!checked;
                                setScreenPermissions(prev => prev.map(p => p.tela === perm.tela ? { ...p, pode_incluir: val, pode_alterar: val, pode_excluir: val } : p));
                              }} />
                              <span className="font-medium">{perm.nome}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center"><div className="flex justify-center"><Checkbox checked={perm.pode_incluir} onCheckedChange={(checked) => handlePermissionChange(perm.tela, 'pode_incluir', !!checked)} /></div></td>
                          <td className="px-3 py-2 text-center"><div className="flex justify-center"><Checkbox checked={perm.pode_alterar} onCheckedChange={(checked) => handlePermissionChange(perm.tela, 'pode_alterar', !!checked)} /></div></td>
                          <td className="px-3 py-2 text-center"><div className="flex justify-center"><Checkbox checked={perm.pode_excluir} onCheckedChange={(checked) => handlePermissionChange(perm.tela, 'pode_excluir', !!checked)} /></div></td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum código gerado ainda.</p>
        ) : (
          <div className="space-y-2">
            {codes.map(code => {
              const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
              const isUsedUp = code.max_uses > 0 && code.uses >= code.max_uses;
              const isInactive = !code.active;
              return (
                <div key={code.id} className={`rounded-lg border p-3 space-y-2 ${isInactive ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-lg font-bold tracking-wider">{code.code}</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(code.code)}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSuperAdmin && code.empresa_id && (
                        <Badge variant="outline" className="text-xs bg-muted">
                          {allEmpresas.find(e => e.id === code.empresa_id)?.nome || "Empresa"}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{code.role}</Badge>
                      <span className="text-xs text-muted-foreground">{code.uses}/{code.max_uses === 0 ? "∞" : code.max_uses} usos</span>
                      {isInactive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                      {isExpired && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
                      {isUsedUp && !isInactive && <Badge variant="secondary" className="text-xs">Esgotado</Badge>}
                      {!code.redeemed_by && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(code)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </div>
                  {code.redeemed_by_name && (
                    <div className="text-xs text-muted-foreground pl-1">
                      Usado por <span className="font-medium text-foreground">{code.redeemed_by_name}</span>
                      {code.redeemed_by_email && <span> ({code.redeemed_by_email})</span>}
                      {code.redeemed_at && <span> em {new Date(code.redeemed_at).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

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
            {deletingCode ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default InviteCodesCard;
