
import { supabase } from "@/integrations/supabase/client";
import { User, FormData } from "@/types/user.types";

export const fetchUsersData = async (isSuperAdmin: boolean = false, empresaId?: string | null) => {
  // Fetch super_admin user_ids to flag them
  const { data: superAdminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'super_admin');
  
  const superAdminIds = new Set(superAdminRoles?.map(r => r.user_id) || []);

  if (isSuperAdmin) {
    // Super admin: fetch all users
    const { data: perfisData, error } = await supabase
      .from('perfis')
      .select('*')
      .order('nome');

    if (error) throw error;

    const empresaIds = [...new Set((perfisData || []).filter(p => p.empresa_id).map(p => p.empresa_id!))];
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nome')
      .in('id', empresaIds.length > 0 ? empresaIds : ['00000000-0000-0000-0000-000000000000']);

    return (perfisData || []).map(p => ({
      ...p,
      empresa_nome: empresas?.find(e => e.id === p.empresa_id)?.nome || null,
      is_super_admin: superAdminIds.has(p.id),
    }));
  }

  // Regular admin: fetch only users that belong to this empresa via user_roles
  if (!empresaId) return [];

  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('empresa_id', empresaId);

  if (rolesError) throw rolesError;

  const userIds = rolesData?.map(r => r.user_id) || [];
  if (userIds.length === 0) return [];

  const { data: perfisData, error } = await supabase
    .from('perfis')
    .select('*')
    .in('id', userIds)
    .order('nome');

  if (error) throw error;

  return (perfisData || []).map(p => ({
    ...p,
    is_super_admin: superAdminIds.has(p.id),
  }));
};

export const updateUser = async (userId: string, userData: { nome: string; permissao: string }, empresaId?: string | null) => {
  // Check if target is super_admin — only self can edit
  const { data: targetRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .maybeSingle();

  if (targetRoles) {
    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser?.user?.id !== userId) {
      throw new Error("Não é possível alterar dados de um Super Admin.");
    }
  }

  // Check if user is owner of a personal company — protect admin status
  const { data: userProfile } = await supabase
    .from('perfis')
    .select('empresa_id')
    .eq('id', userId)
    .single();

  if (userProfile?.empresa_id) {
    const { data: empresa } = await supabase
      .from('empresas')
      .select('pessoal')
      .eq('id', userProfile.empresa_id)
      .single();

    if (empresa?.pessoal) {
      // Force admin for personal company owner
      userData.permissao = 'admin';
    }
  }

  // Update perfil
  const { error } = await supabase
    .from('perfis')
    .update({ nome: userData.nome, permissao: userData.permissao })
    .eq('id', userId);

  if (error) throw error;

  // Also update user_roles role — scoped by empresa_id to avoid cross-empresa changes
  const roleMap: Record<string, "admin" | "usuario" | "leitura"> = {
    admin: 'admin',
    editor: 'usuario',
    leitura: 'leitura',
  };
  const role = roleMap[userData.permissao] || 'leitura';
  
  if (empresaId) {
    // Scoped update: only change role for the specific empresa
    await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId)
      .eq('empresa_id', empresaId);
  } else {
    // Fallback: update all roles for this user (legacy behavior, less secure)
    await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);
  }

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
    // Guard: cannot delete super_admin
    const { data: targetRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (targetRoles) {
      throw new Error("Não é possível excluir um Super Admin.");
    }

    // Call the edge function that handles full user deletion including auth.users
    const { data, error } = await supabase.functions.invoke("delete-auth-user", {
      body: { userId },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const revokeUserAccess = async (userId: string, empresaId: string) => {
  try {
    // Guard: cannot revoke super_admin
    const { data: targetRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (targetRoles) {
      throw new Error("Não é possível revogar acesso de um Super Admin.");
    }

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
