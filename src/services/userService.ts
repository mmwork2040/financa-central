
import { supabase } from "@/integrations/supabase/client";
import { User, FormData } from "@/types/user.types";

export const fetchUsersData = async () => {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .order('nome');

  if (error) throw error;
  return data || [];
};

export const updateUser = async (userId: string, userData: { nome: string; permissao: string }) => {
  // Update perfil
  const { error } = await supabase
    .from('perfis')
    .update({ nome: userData.nome, permissao: userData.permissao })
    .eq('id', userId);

  if (error) throw error;

  // Also update user_roles role
  const roleMap: Record<string, "admin" | "usuario" | "leitura"> = {
    admin: 'admin',
    editor: 'usuario',
    leitura: 'leitura',
  };
  const role = roleMap[userData.permissao] || 'leitura';
  
  await supabase
    .from('user_roles')
    .update({ role })
    .eq('user_id', userId);

  return true;
};

export const createUser = async (formData: FormData, empresaId?: string | null) => {
  try {
    // Check if email already exists
    const { data: existingProfiles } = await supabase
      .from('perfis')
      .select('email')
      .eq('email', formData.email)
      .maybeSingle();

    if (existingProfiles) {
      throw new Error("Este email já está registrado. Por favor, use outro email.");
    }

    // Create user via edge function to handle everything server-side
    const { data, error } = await supabase.functions.invoke("create-tenant-user", {
      body: {
        email: formData.email,
        password: formData.senha || '',
        nome: formData.nome,
        permissao: formData.permissao,
        empresaId,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    
    return { id: data?.userId };
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const deleteUserAccount = async (userId: string) => {
  try {
    // Delete user_roles first
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Delete profile
    const { error: profileError } = await supabase
      .from('perfis')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
