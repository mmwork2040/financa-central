
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";

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
];

const Permissoes = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchPermissions(selectedUser);
    } else {
      setPermissions([]);
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
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
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

      // Garantir que todas as telas tenham permissões
      const existingScreens = (data || []).map(p => p.tela);
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
    } catch (error: any) {
      toast({
        title: "Erro ao carregar permissões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handlePermissionChange = (tela: string, tipo: 'pode_incluir' | 'pode_alterar' | 'pode_excluir', value: boolean) => {
    setPermissions(permissions.map(p => 
      p.tela === tela ? { ...p, [tipo]: value } : p
    ));
  };

  const savePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSaving(true);
      
      // Para cada permissão, verificar se já existe ou precisa ser criada
      for (const permission of permissions) {
        if (permission.id.startsWith('temp-')) {
          // Criar nova permissão
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
        } else {
          // Atualizar permissão existente
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
      
      toast({
        title: "Permissões salvas",
        description: "As permissões foram atualizadas com sucesso.",
      });
      
      // Recarregar permissões
      fetchPermissions(selectedUser);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar permissões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = users.find(u => u.id === selectedUser)?.permissao === 'admin';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Permissões</h1>
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
                            const allChecked = permissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir);
                            setPermissions(permissions.map(p => ({
                              ...p,
                              pode_incluir: !allChecked,
                              pode_alterar: !allChecked,
                              pode_excluir: !allChecked,
                            })));
                          }}
                        >
                          {permissions.every(p => p.pode_incluir && p.pode_alterar && p.pode_excluir) ? "Desmarcar Tudo" : "Selecionar Tudo"}
                        </Button>
                      </div>
                      <table className="w-full table-auto min-w-[400px]">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-sm">Tela</th>
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
                            const allRowChecked = permission.pode_incluir && permission.pode_alterar && permission.pode_excluir;
                            
                            return (
                              <tr key={screen.value} className="border-t hover:bg-muted/50">
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={allRowChecked}
                                      onCheckedChange={(checked) => {
                                        const val = !!checked;
                                        setPermissions(permissions.map(p =>
                                          p.tela === screen.value
                                            ? { ...p, pode_incluir: val, pode_alterar: val, pode_excluir: val }
                                            : p
                                        ));
                                      }}
                                    />
                                    <div>
                                      <p className="font-medium text-sm">{screen.name}</p>
                                      <p className="text-xs text-muted-foreground hidden sm:block">{screen.description}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={permission.pode_incluir}
                                      onCheckedChange={(checked) => handlePermissionChange(screen.value, 'pode_incluir', !!checked)}
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={permission.pode_alterar}
                                      onCheckedChange={(checked) => handlePermissionChange(screen.value, 'pode_alterar', !!checked)}
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={permission.pode_excluir}
                                      onCheckedChange={(checked) => handlePermissionChange(screen.value, 'pode_excluir', !!checked)}
                                    />
                                  </div>
                                </td>
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
