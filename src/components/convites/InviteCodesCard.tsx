import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2, Loader2, Ticket } from "lucide-react";
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

const InviteCodesCard = () => {
  const { empresaId, userRole, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newRole, setNewRole] = useState("leitura");
  const [maxUses, setMaxUses] = useState("5");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<InviteCode | null>(null);
  const [deletingCode, setDeletingCode] = useState(false);

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
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      setAllEmpresas(data || []);
    } catch (error: any) {
      console.error("Error fetching empresas:", error);
    }
  };

  const fetchCodes = async () => {
    try {
      setLoading(true);
      let query = (supabase as any)
        .from("invite_codes")
        .select("*")
        .order("created_at", { ascending: false });

      // Super admin sees all codes; regular admin only their empresa
      if (!isSuperAdmin && empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data, error } = await query;
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
      const body: any = {
        role: newRole,
        maxUses: parseInt(maxUses),
        expiresInDays: parseInt(expiresInDays),
      };

      // Super admin can target a specific empresa
      if (isSuperAdmin && selectedEmpresaId) {
        body.empresaId = selectedEmpresaId;
      }

      const { data, error } = await supabase.functions.invoke("generate-invite-code", {
        body,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Código gerado!", description: `Código: ${data.invite.code}` });
      fetchCodes();
    } catch (error: any) {
      toast({ title: "Erro ao gerar código", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado!", description: "Código copiado para a área de transferência." });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingCode(true);
    try {
      // If code was used, revoke the user's access first
      if (deleteTarget.redeemed_by && deleteTarget.empresa_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", deleteTarget.redeemed_by)
          .eq("empresa_id", deleteTarget.empresa_id);
        if (roleError) throw roleError;

        // Check remaining roles and update perfil
        const { data: remainingRoles } = await supabase
          .from("user_roles")
          .select("empresa_id")
          .eq("user_id", deleteTarget.redeemed_by);

        if (remainingRoles && remainingRoles.length > 0) {
          await supabase
            .from("perfis")
            .update({ empresa_id: remainingRoles[0].empresa_id })
            .eq("id", deleteTarget.redeemed_by);
        } else {
          await supabase
            .from("perfis")
            .update({ empresa_id: null })
            .eq("id", deleteTarget.redeemed_by);
        }
      }

      const { error } = await (supabase as any)
        .from("invite_codes")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;
      setCodes(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast({ 
        title: "Código removido", 
        description: deleteTarget.redeemed_by ? "O acesso do usuário à empresa também foi revogado." : undefined 
      });
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
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
        {/* Generate form */}
        <div className="flex flex-wrap items-end gap-3">
          {isSuperAdmin && (
            <div className="space-y-1">
              <Label className="text-xs">Empresa</Label>
              <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {allEmpresas.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Permissão</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leitura">Leitura</SelectItem>
                <SelectItem value="usuario">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Máx. usos (0 = ilimitado)</Label>
            <Input className="w-20" type="number" min="0" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Expira em dias (0 = nunca)</Label>
            <Input className="w-24" type="number" min="0" value={expiresInDays} onChange={e => setExpiresInDays(e.target.value)} />
          </div>
          <Button onClick={handleGenerate} disabled={generating} size="sm">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Gerar Código
          </Button>
        </div>

        {/* Codes list */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(code.code)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSuperAdmin && code.empresa_id && (
                        <Badge variant="outline" className="text-xs bg-muted">
                          {allEmpresas.find(e => e.id === code.empresa_id)?.nome || "Empresa"}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{code.role}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {code.uses}/{code.max_uses === 0 ? "∞" : code.max_uses} usos
                      </span>
                      {isInactive && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                      {isExpired && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
                      {isUsedUp && !isInactive && <Badge variant="secondary" className="text-xs">Esgotado</Badge>}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(code)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {code.redeemed_by_name && (
                    <div className="text-xs text-muted-foreground pl-1">
                      Usado por <span className="font-medium text-foreground">{code.redeemed_by_name}</span>
                      {code.redeemed_by_email && <span> ({code.redeemed_by_email})</span>}
                      {code.redeemed_at && (
                        <span> em {new Date(code.redeemed_at).toLocaleDateString("pt-BR")} às {new Date(code.redeemed_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Delete confirmation dialog */}
    <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            {deleteTarget?.redeemed_by
              ? `Este código foi utilizado por ${deleteTarget.redeemed_by_name || "um usuário"}. Ao excluí-lo, o acesso deste usuário à empresa será revogado. Deseja continuar?`
              : "Tem certeza que deseja excluir este código de convite? Esta ação não pode ser desfeita."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deletingCode}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deletingCode}>
            {deletingCode ? "Processando..." : deleteTarget?.redeemed_by ? "Excluir e Revogar Acesso" : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default InviteCodesCard;
