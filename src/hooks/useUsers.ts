
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, FormData } from "@/types/user.types";
import { fetchUsersData, updateUser, createUser, deleteUserAccount, revokeUserAccess } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

export type { User, FormData };

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const { toast } = useToast();
  const { user: authUser, empresaId, isSuperAdmin } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsersData(isSuperAdmin);
      setUsers(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchUsers();
    }
  }, [authUser, empresaId, isSuperAdmin]);

  const saveUser = async (formData: FormData, selectedId: string | null) => {
    try {
      setSaving(true);
      
      if (!formData.nome || !formData.email || (!selectedId && !formData.senha)) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return false;
      }

      if (selectedId) {
        // Update existing user
        await updateUser(selectedId, {
          nome: formData.nome,
          permissao: formData.permissao,
        });

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        });
      } else {
        // Create new user
        try {
          await createUser(formData, empresaId);
          toast({
            title: "Sucesso",
            description: "Usuário cadastrado com sucesso. Ele receberá um email de confirmação.",
          });
        } catch (error: any) {
          console.error("Error creating user:", error);
          const errorMessage = error.message || "Ocorreu um erro ao criar o usuário";
          toast({
            title: "Erro ao criar usuário",
            description: errorMessage,
            variant: "destructive",
          });
          return false;
        }
      }

      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error("Error saving user:", error);
      const errorMessage = error.message || "Ocorreu um erro ao salvar o usuário";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeleting(true);
      
      await deleteUserAccount(userId);

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const revokeUser = async (userId: string, targetEmpresaId: string) => {
    try {
      setDeleting(true);
      
      await revokeUserAccess(userId, targetEmpresaId);

      toast({
        title: "Acesso revogado",
        description: "O usuário perdeu acesso a esta empresa.",
      });
      
      await fetchUsers();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    users,
    loading,
    saving,
    deleting,
    fetchUsers,
    saveUser,
    deleteUser,
    revokeUser,
    isSuperAdmin
  };
};
