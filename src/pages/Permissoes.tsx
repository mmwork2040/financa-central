
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type User = {
  id: string;
  nome: string;
  email: string;
  permissao: string;
};

type Permission = {
  id: string;
  perfis_id: string;
  tela: string;
  pode_incluir: boolean;
  pode_alterar: boolean;
  pode_excluir: boolean;
};

type Screen = {
  name: string;
  value: string;
  description: string;
  viewOnly?: boolean;
};

const screens: Screen[] = [
  { name: "Usuários", value: "users", description: "Gerenciamento de usuários" },
  { name: "Permissões", value: "permissions", description: "Configuração de permissões de acesso" },
  { name: "Fornecedores", value: "fornecedores", description: "Cadastro de fornecedores" },
  { name: "Clientes", value: "clientes", description: "Cadastro de clientes" },
  { name: "Categorias", value: "categorias", description: "Categorias de receitas e despesas" },
  { name: "Contas Bancárias", value: "contas_bancarias", description: "Gerenciamento de contas" },
  { name: "Formas de Pagamento", value: "formas_pagamento", description: "Cadastro de formas de pagamento" },
  { name: "Lançamentos", value: "lancamentos", description: "Lançamentos financeiros" },
  { name: "Relatórios", value: "relatorios", description: "Visualização de relatórios" },
  { name: "Projetos", value: "projetos", description: "Gerenciamento de projetos" },
  { name: "Vendas Digitais", value: "vendas_digitais", description: "Dados gerados automaticamente — apenas visualização", viewOnly: true },
  { name: "Anúncios Digitais", value: "anuncios", description: "Dados gerados automaticamente — apenas visualização", viewOnly: true },
];

const Permissoes = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [visibleScreens, setVisibleScreens] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchPermissions(selectedUser);
    } else {
      setPermissions([]);
      setVisibleScreens(new Set());
    }
  }, [selectedUser]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome');

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPermissions(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permissoes')
        .select('*')
        .eq('perfis_id', userId);

      if (error) {
        throw error;
      }

      const existingScreens = (data || []).map(p => p.tela);
      const visible = new Set<string>(existingScreens);
      
      const allPermissions = [...(data || [])];
      
      screens.forEach(screen => {
        if (!existingScreens.includes(screen.value)) {
          allPermissions.push({
            id: `temp-${screen.value}`,
            perfis_id: userId,
            tela: screen.value,
            pode_incluir: false,
            pode_alterar: false,
            pode_excluir: false
          });
        }
      });
      
      setPermissions(allPermissions);
      setVisibleScreens(visible);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar permissões");
    } finally {
      setLoading(false);
    }
  }

  const handlePermissionChange = (tela: string, tipo: 'pode_incluir' | 'pode_alterar' | 'pode_excluir', value: boolean) => {
    setPermissions(permissions.map(p => 
      p.tela === tela ? { ...p, [tipo]: value } : p
    ));
  };

  const handleVisibilityChange = (tela: string, checked: boolean) => {
    const newVisible = new Set(visibleScreens);
    if (checked) {
      newVisible.add(tela);
    } else {
      newVisible.delete(tela);
      // Reset all permissions when disabling visibility
      setPermissions(permissions.map(p =>
        p.tela === tela ? { ...p, pode_incluir: false, pode_alterar: false, pode_excluir: false } : p
      ));
    }
    setVisibleScreens(newVisible);
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSaving(true);
      
      for (const permission of permissions) {
        const isVisible = visibleScreens.has(permission.tela);
        
        if (permission.id.startsWith('temp-')) {
          // Only create if visible
          if (isVisible) {
            const { error } = await supabase
              .from('permissoes')
              .insert([{
                perfis_id: selectedUser,
                tela: permission.tela,
                pode_incluir: permission.pode_incluir,
                pode_alterar: permission.pode_alterar,
                pode_excluir: permission.pode_excluir
              }]);
              
            if (error) throw error;
          }
        } else {
          if (!isVisible) {
            // Delete if not visible
            const { error } = await supabase
              .from('permissoes')
              .delete()
              .eq('id', permission.id);
              
            if (error) throw error;
          } else {
            // Update existing
            const { error } = await supabase
              .from('permissoes')
              .update({
                pode_incluir: permission.pode_incluir,
                pode_alterar: permission.pode_alterar,
                pode_excluir: permission.pode_excluir
              })
              .eq('id', permission.id);
              
            if (error) throw error;
          }
        }
      }
      
      toast.success("Permissões atualizadas com sucesso.");
      
      fetchPermissions(selectedUser);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar permissões");
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = users.find(u => u.id === selectedUser)?.permissao === 'admin';
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Permissões</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Defina as permissões de acesso para cada usuário</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Permissões</CardTitle>
          <CardDescription>
            Defina as permissões de acesso para cada usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="user-select" className="text-sm font-medium">Selecione um usuário</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user-select" className="w-full">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-3rem)]">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <span className="block truncate">{user.nome} <span className="hidden sm:inline">({user.email})</span> - {user.permissao === 'admin' ? 'Admin' : user.permissao === 'financeiro' ? 'Financeiro' : 'Leitura'}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUser && (
              <>
                {isAdmin ? (
                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Este usuário é um Administrador e possui todas as permissões do sistema automaticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            const allVisible = screens.every(s => visibleScreens.has(s.value));
                            const allChecked = allVisible && permissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir);
                            if (allChecked) {
                              // Uncheck all
                              setVisibleScreens(new Set());
                              setPermissions(permissions.map(p => ({
                                ...p,
                                pode_incluir: false,
                                pode_alterar: false,
                                pode_excluir: false,
                              })));
                            } else {
                              // Check all
                              const allScreens = new Set(screens.map(s => s.value));
                              setVisibleScreens(allScreens);
                              setPermissions(permissions.map(p => {
                                const screen = screens.find(s => s.value === p.tela);
                                if (screen?.viewOnly) {
                                  return { ...p, pode_incluir: true };
                                }
                                return {
                                  ...p,
                                  pode_incluir: true,
                                  pode_alterar: true,
                                  pode_excluir: true,
                                };
                              }));
                            }
                          }}
                        >
                          {screens.every(s => visibleScreens.has(s.value)) && permissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir)
                            ? "Desmarcar Tudo" : "Selecionar Tudo"}
                        </Button>
                      </div>
                      <table className="w-full table-auto min-w-[500px]">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-sm">Tela</th>
                            <th className="px-2 py-2 text-center text-sm">Visualizar</th>
                            <th className="px-2 py-2 text-center text-sm">Incluir</th>
                            <th className="px-2 py-2 text-center text-sm">Alterar</th>
                            <th className="px-2 py-2 text-center text-sm">Excluir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {screens.map((screen) => {
                            const permission = permissions.find(p => p.tela === screen.value) || {
                              tela: screen.value,
                              pode_incluir: false,
                              pode_alterar: false,
                              pode_excluir: false
                            };
                            const isViewOnly = screen.viewOnly === true;
                            const isVisible = visibleScreens.has(screen.value);
                            
                             return (
                              <tr key={screen.value} className="border-t hover:bg-muted/50">
                                <td className="px-3 py-2">
                                  <div>
                                    <p className="font-medium text-sm">{screen.name}</p>
                                    <p className="text-xs text-muted-foreground hidden sm:block">{screen.description}</p>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={isVisible}
                                      onCheckedChange={(checked) => {
                                        handleVisibilityChange(screen.value, !!checked);
                                        // For viewOnly screens, also set pode_incluir
                                        if (isViewOnly && checked) {
                                          handlePermissionChange(screen.value, 'pode_incluir', true);
                                        }
                                      }}
                                    />
                                  </div>
                                </td>
                                {isViewOnly ? (
                                  <td colSpan={3} className="px-2 py-2 text-center">
                                    <span className="text-xs text-muted-foreground">Somente visualização</span>
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-2 py-2 text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={permission.pode_incluir}
                                          disabled={!isVisible}
                                          onCheckedChange={(checked) => handlePermissionChange(screen.value, 'pode_incluir', !!checked)}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={permission.pode_alterar}
                                          disabled={!isVisible}
                                          onCheckedChange={(checked) => handlePermissionChange(screen.value, 'pode_alterar', !!checked)}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={permission.pode_excluir}
                                          disabled={!isVisible}
                                          onCheckedChange={(checked) => handlePermissionChange(screen.value, 'pode_excluir', !!checked)}
                                        />
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={savePermissions} disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Salvar Permissões"}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Permissoes;
