
import { supabase } from "@/integrations/supabase/client";
import { User, FormData } from "@/types/user.types";

export const fetchUsersData = async (isSuperAdmin: boolean = false) => {
  // Super admin: fetch all users; regular admin: RLS handles filtering by empresa
  const { data: perfisData, error } = await supabase
    .from('perfis')
    .select('*')
    .order('nome');

  if (error) throw error;
  
  if (isSuperAdmin && perfisData) {
    // For super admin, also fetch empresa names for each user
    const empresaIds = [...new Set(perfisData.filter(p => p.empresa_id).map(p => p.empresa_id!))];
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nome')
      .in('id', empresaIds);
    
    return perfisData.map(p => ({
      ...p,
      empresa_nome: empresas?.find(e => e.id === p.empresa_id)?.nome || null,
    }));
  }

  return perfisData || [];
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

export const revokeUserAccess = async (userId: string, empresaId: string) => {
  try {
    // Remove user_role for this empresa
    const { error: roleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('empresa_id', empresaId);

    if (roleError) throw roleError;

    // Check if user has any remaining roles
    const { data: remainingRoles } = await supabase
      .from('user_roles')
      .select('empresa_id')
      .eq('user_id', userId);

    if (remainingRoles && remainingRoles.length > 0) {
      // Switch user to first remaining empresa
      await supabase
        .from('perfis')
        .update({ empresa_id: remainingRoles[0].empresa_id })
        .eq('id', userId);
    } else {
      // No more roles, clear empresa_id
      await supabase
        .from('perfis')
        .update({ empresa_id: null })
        .eq('id', userId);
    }

    return true;
  } catch (error) {
    console.error("Error revoking user access:", error);
    throw error;
  }
};
