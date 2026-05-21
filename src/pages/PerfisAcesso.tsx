import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCog, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { usePerfisAcesso, PerfilAcessoPermissao } from "@/hooks/usePerfisAcesso";
import { toast } from "sonner";
import { AcessoTabs } from "@/components/common/AcessoTabs";


const SCREENS = [
  { value: "users", name: "Usuários" },
  { value: "permissions", name: "Permissões" },
  { value: "fornecedores", name: "Fornecedores" },
  { value: "clientes", name: "Clientes" },
  { value: "categorias", name: "Categorias" },
  { value: "contas_bancarias", name: "Contas Bancárias" },
  { value: "formas_pagamento", name: "Formas de Pagamento" },
  { value: "lancamentos", name: "Lançamentos" },
  { value: "relatorios", name: "Relatórios" },
  { value: "projetos", name: "Projetos" },
  { value: "vendas_digitais", name: "Vendas" },
  { value: "cartoes_credito", name: "Cartões de Crédito" },
];

const defaultPerms = (): PerfilAcessoPermissao[] =>
  SCREENS.map(s => ({ tela: s.value, pode_incluir: false, pode_alterar: false, pode_excluir: false }));

const PerfisAcesso = () => {
  const { perfis, loading, createPerfil, updatePerfil, deletePerfil } = usePerfisAcesso();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [perms, setPerms] = useState<PerfilAcessoPermissao[]>(defaultPerms());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const openCreate = () => {
    setEditId(null);
    setNome("");
    setDescricao("");
    setPerms(defaultPerms());
    setDialogOpen(true);
  };

  const openEdit = (perfil: any) => {
    setEditId(perfil.id);
    setNome(perfil.nome);
    setDescricao(perfil.descricao || "");
    const mapped = defaultPerms().map(dp => {
      const existing = perfil.permissoes?.find((p: any) => p.tela === dp.tela);
      return existing ? { ...dp, pode_incluir: existing.pode_incluir, pode_alterar: existing.pode_alterar, pode_excluir: existing.pode_excluir } : dp;
    });
    setPerms(mapped);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const activePerms = perms.filter(p => p.pode_incluir || p.pode_alterar || p.pode_excluir);
      if (editId) {
        await updatePerfil(editId, nome, descricao, activePerms);
      } else {
        await createPerfil(nome, descricao, activePerms);
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePerfil(deleteTarget);
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
    setDeleteTarget(null);
  };

  const togglePerm = (tela: string, field: string, value: boolean) => {
    setPerms(prev => prev.map(p => p.tela === tela ? { ...p, [field]: value } : p));
  };

  return (
    <div className="space-y-6">
      <AcessoTabs />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Perfis de Acesso</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Configure templates de permissão para convites</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Novo Perfil</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : perfis.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum perfil de acesso configurado.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {perfis.map(perfil => (
            <Card key={perfil.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{perfil.nome}</CardTitle>
                  <div className="flex items-center gap-1">
                    {perfil.is_default && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(perfil)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!perfil.is_default && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(perfil.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                {perfil.descricao && <CardDescription className="text-xs">{perfil.descricao}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {(perfil.permissoes || []).map((p: any) => {
                    const screen = SCREENS.find(s => s.value === p.tela);
                    return (
                      <div key={p.tela} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{screen?.name || p.tela}</span>
                        <span className="ml-auto flex gap-1">
                          {p.pode_incluir && <Badge variant="outline" className="text-[10px] px-1">I</Badge>}
                          {p.pode_alterar && <Badge variant="outline" className="text-[10px] px-1">A</Badge>}
                          {p.pode_excluir && <Badge variant="outline" className="text-[10px] px-1">E</Badge>}
                          {!p.pode_incluir && !p.pode_alterar && !p.pode_excluir && <Badge variant="outline" className="text-[10px] px-1">Leitura</Badge>}
                        </span>
                      </div>
                    );
                  })}
                  {(!perfil.permissoes || perfil.permissoes.length === 0) && (
                    <p className="text-xs text-muted-foreground">Sem permissões configuradas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg pr-6">{editId ? "Editar Perfil de Acesso" : "Novo Perfil de Acesso"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Configure o nome e as permissões deste perfil</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Gerente" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Opcional" rows={1} />
              </div>
            </div>

            {/* Mobile: lista compacta */}
            <div className="sm:hidden space-y-2">
              {SCREENS.map(screen => {
                const perm = perms.find(p => p.tela === screen.value)!;
                return (
                  <div key={screen.value} className="rounded-md border p-3">
                    <div className="text-sm font-medium mb-2">{screen.name}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox checked={perm.pode_incluir} onCheckedChange={v => togglePerm(screen.value, "pode_incluir", !!v)} />
                        Incluir
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox checked={perm.pode_alterar} onCheckedChange={v => togglePerm(screen.value, "pode_alterar", !!v)} />
                        Alterar
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox checked={perm.pode_excluir} onCheckedChange={v => togglePerm(screen.value, "pode_excluir", !!v)} />
                        Excluir
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden sm:block rounded-md border overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs">Tela</th>
                    <th className="px-2 py-2 text-center text-xs">Incluir</th>
                    <th className="px-2 py-2 text-center text-xs">Alterar</th>
                    <th className="px-2 py-2 text-center text-xs">Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {SCREENS.map(screen => {
                    const perm = perms.find(p => p.tela === screen.value)!;
                    return (
                      <tr key={screen.value} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 text-sm">{screen.name}</td>
                        <td className="px-2 py-2 text-center">
                          <Checkbox checked={perm.pode_incluir} onCheckedChange={v => togglePerm(screen.value, "pode_incluir", !!v)} />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Checkbox checked={perm.pode_alterar} onCheckedChange={v => togglePerm(screen.value, "pode_alterar", !!v)} />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Checkbox checked={perm.pode_excluir} onCheckedChange={v => togglePerm(screen.value, "pode_excluir", !!v)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Perfil</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir este perfil de acesso?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerfisAcesso;
