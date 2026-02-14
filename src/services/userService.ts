
import { supabase } from "@/integrations/supabase/client";
import { User, FormData } from "@/types/user.types";

export const fetchUsersData = async () => {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .order('nome');

  if (error) {
    throw error;
  }

  return data || [];
};

export const updateUser = async (userId: string, userData: { nome: string; permissao: string }) => {
  const { error } = await supabase
    .from('perfis')
    .update(userData)
    .eq('id', userId);

  if (error) throw error;
  return true;
};

export const createUser = async (formData: FormData) => {
  try {
    // Check if email already exists in the profiles table
    const { data: existingProfiles, error: profileCheckError } = await supabase
      .from('perfis')
      .select('email')
      .eq('email', formData.email)
      .maybeSingle();

    if (profileCheckError) {
      console.error("Error checking existing profile:", profileCheckError);
      throw profileCheckError;
    }

    if (existingProfiles) {
      throw new Error("Este email já está registrado. Por favor, use outro email.");
    }

    // Create the user in Auth using signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.senha || '',
      options: {
        data: {
          nome: formData.nome,
          permissao: formData.permissao
        }
      }
    });

    if (authError) {
      // Check for specific error messages related to existing user
      if (authError.message?.includes("User already registered") || 
          authError.message?.includes("already exists") ||
          authError.message?.includes("já está registrado")) {
        throw new Error("Este email já está registrado. Por favor, use outro email.");
      }
      
      console.error("Error creating user in Auth:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Falha ao criar usuário. Nenhum ID de usuário retornado.");
    }

    // Create the user profile
    const { error: profileError } = await supabase
      .from('perfis')
      .insert({
        id: authData.user.id,
        email: formData.email,
        nome: formData.nome,
        permissao: formData.permissao
      });

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      
      // Unfortunately, we can't easily delete the auth user without admin privileges
      // But we'll leave the error handling in place for completeness
      console.error("Unable to clean up auth user after profile creation error due to permission limits");
      
      throw profileError;
    }
    
    return { id: authData.user.id };
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const deleteUserAccount = async (userId: string) => {
  try {
    // Without admin privileges, we can only delete the profile
    // The auth user would remain but cannot log in without profile
    const { error: profileError } = await supabase
      .from('perfis')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw profileError;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
