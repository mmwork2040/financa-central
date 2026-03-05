
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, FormData } from "@/types/user.types";
import { fetchUsersData, updateUser, createUser, deleteUserAccount, revokeUserAccess } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

export type { User, FormData };

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const { user: authUser, empresaId, isSuperAdmin } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsersData(isSuperAdmin);
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) fetchUsers();
  }, [authUser, empresaId, isSuperAdmin]);

  const saveUser = async (formData: FormData, selectedId: string | null) => {
    try {
      setSaving(true);
      
      if (!formData.nome || !formData.email || (!selectedId && !formData.senha)) {
        toast.error("Preencha todos os campos obrigatórios");
        return false;
      }

      if (selectedId) {
        await updateUser(selectedId, {
          nome: formData.nome,
          permissao: formData.permissao,
        }, empresaId);
        toast.success("Usuário atualizado com sucesso");
      } else {
        try {
          await createUser(formData, empresaId);
          toast.success("Usuário cadastrado com sucesso. Ele receberá um email de confirmação.");
        } catch (error: any) {
          console.error("Error creating user:", error);
          toast.error(error.message || "Ocorreu um erro ao criar o usuário");
          return false;
        }
      }

      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Ocorreu um erro ao salvar o usuário");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeleting(true);
      await deleteUserAccount(userId);
      toast.success("Usuário excluído com sucesso");
      await fetchUsers();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir usuário");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const revokeUser = async (userId: string, targetEmpresaId: string) => {
    try {
      setDeleting(true);
      await revokeUserAccess(userId, targetEmpresaId);
      toast.success("O usuário perdeu acesso a esta empresa.");
      await fetchUsers();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao revogar acesso");
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
