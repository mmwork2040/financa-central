import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session, User } from "@supabase/supabase-js";
import { usePermissoes } from "@/hooks/usePermissoes";

const authErrorMessages: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "E-mail não confirmado. Verifique sua caixa de entrada.",
  "User not found": "Usuário não encontrado.",
  "Invalid email or password": "E-mail ou senha inválidos.",
  "Too many requests": "Muitas tentativas. Aguarde alguns minutos.",
  "User already registered": "Este e-mail já está cadastrado.",
  "Signup requires a valid password": "A senha informada é inválida.",
  "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
};

function translateAuthError(msg: string): string {
  return authErrorMessages[msg] || msg;
}

type EmpresaInfo = {
  empresa_id: string;
  role: string;
  empresa_nome?: string;
  pessoal?: boolean;
};

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  userProfile: any | null;
  empresaId: string | null;
  userRole: string | null;
  isSuperAdmin: boolean;
  isPessoal: boolean;
  empresas: EmpresaInfo[];
  canAccessRoute: (path: string) => boolean;
  canAccessScreen: (screenKey: string) => boolean;
  canPerformAction: (screenKey: string, action: 'pode_incluir' | 'pode_alterar' | 'pode_excluir') => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchEmpresa: (empresaId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  userProfile: null,
  empresaId: null,
  userRole: null,
  isSuperAdmin: false,
  isPessoal: false,
  empresas: [],
  canAccessRoute: () => true,
  canAccessScreen: () => true,
  canPerformAction: () => false,
  login: async () => {},
  logout: async () => {},
  switchEmpresa: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaInfo[]>([]);
  const isSuperAdmin = userRole === 'super_admin';
  const isPessoal = empresas.find(e => e.empresa_id === empresaId)?.pessoal === true;
  const { canAccessRoute, canAccessScreen, canPerformAction } = usePermissoes(user?.id || null, userRole, isSuperAdmin);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('perfis')
        .select('*, evolution_webhook_url')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error("Erro ao carregar perfil do usuário:", error);
        setUserProfile(null);
        setEmpresaId(null);
        return null;
      }

      setUserProfile(data);
      return data;
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setUserProfile(null);
      setEmpresaId(null);
      return null;
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data: isSuperAdminResult } = await supabase.rpc('is_super_admin', { _user_id: userId });
      const superAdmin = isSuperAdminResult === true;

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('empresa_id, role')
        .eq('user_id', userId);

      if (error) {
        console.error("Erro ao carregar roles do usuário:", error);
      }

      let empresasList: EmpresaInfo[] = [];

      if (superAdmin) {
        const { data: allEmpresas } = await supabase
          .from('empresas')
          .select('id, nome, pessoal')
          .order('nome');

        empresasList = (allEmpresas || []).map(e => ({
          empresa_id: e.id,
          role: roles?.find(r => r.empresa_id === e.id)?.role || 'super_admin',
          empresa_nome: e.nome,
          pessoal: e.pessoal,
        }));
      } else {
        if (!roles || roles.length === 0) return null;

        const empresaIds = roles.map(r => r.empresa_id);
        const { data: empresasData } = await supabase
          .from('empresas')
          .select('id, nome, pessoal')
          .in('id', empresaIds);

        empresasList = roles.map(r => ({
          empresa_id: r.empresa_id,
          role: r.role,
          empresa_nome: empresasData?.find(e => e.id === r.empresa_id)?.nome || 'Empresa',
          pessoal: empresasData?.find(e => e.id === r.empresa_id)?.pessoal || false,
        }));
      }

      setEmpresas(empresasList);

      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('id', userId)
        .single();

      const activeEmpresaId = profile?.empresa_id || (roles && roles.length > 0 ? roles[0].empresa_id : empresasList[0]?.empresa_id);
      
      if (superAdmin) {
        setUserRole('super_admin');
      } else {
        const activeRole = roles?.find(r => r.empresa_id === activeEmpresaId);
        setUserRole(activeRole?.role || (roles && roles.length > 0 ? roles[0].role : null));
      }

      setEmpresaId(activeEmpresaId || null);

      return { empresasList, activeEmpresaId };
    } catch (error) {
      console.error("Erro ao carregar roles:", error);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
            fetchUserRoles(currentSession.user.id);
          }, 0);
        } else {
          setUserProfile(null);
          setEmpresaId(null);
          setUserRole(null);
          setEmpresas([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        Promise.all([
          fetchUserProfile(currentSession.user.id),
          fetchUserRoles(currentSession.user.id),
        ]).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(translateAuthError(error.message));
        throw error;
      }

      if (data.user) {
        const [profile] = await Promise.all([
          fetchUserProfile(data.user.id),
          fetchUserRoles(data.user.id),
        ]);
        navigate("/dashboard");
        toast.success(`Bem-vindo ${profile?.nome || email}!`);
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setEmpresaId(null);
      setUserRole(null);
      setEmpresas([]);
      navigate("/login");
      toast.success("Você foi desconectado do sistema.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    } finally {
      setLoading(false);
    }
  };

  const switchEmpresa = async (targetEmpresaId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("switch-empresa", {
        body: { empresaId: targetEmpresaId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setEmpresaId(targetEmpresaId);
      if (data.role === 'super_admin') {
        setUserRole('super_admin');
      } else {
        setUserRole(data.role);
      }

      setUserProfile((prev: any) => prev ? { ...prev, empresa_id: targetEmpresaId } : prev);

      toast.success("Você está agora na empresa selecionada.");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao trocar empresa");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        loading,
        user,
        userProfile,
        empresaId,
        userRole,
        isSuperAdmin,
        isPessoal,
        empresas,
        canAccessRoute,
        canAccessScreen,
        canPerformAction,
        login,
        logout,
        switchEmpresa,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
