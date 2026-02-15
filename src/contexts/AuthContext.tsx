import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session, User } from "@supabase/supabase-js";

type EmpresaInfo = {
  empresa_id: string;
  role: string;
  empresa_nome?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  userProfile: any | null;
  empresaId: string | null;
  userRole: string | null;
  isSuperAdmin: boolean;
  empresas: EmpresaInfo[];
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
  empresas: [],
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
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Erro ao carregar perfil do usuário:", error);
        return null;
      }

      setUserProfile(data);
      return data;
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      return null;
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      // Fetch all roles for this user
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('empresa_id, role')
        .eq('user_id', userId);

      if (error) {
        console.error("Erro ao carregar roles do usuário:", error);
        return null;
      }

      if (!roles || roles.length === 0) return null;

      // Fetch empresa names for all roles
      const empresaIds = roles.map(r => r.empresa_id);
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('id, nome')
        .in('id', empresaIds);

      const empresasList: EmpresaInfo[] = roles.map(r => ({
        empresa_id: r.empresa_id,
        role: r.role,
        empresa_nome: empresasData?.find(e => e.id === r.empresa_id)?.nome || 'Empresa',
      }));

      setEmpresas(empresasList);

      // Get profile to determine active empresa
      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('id', userId)
        .single();

      const activeEmpresaId = profile?.empresa_id || roles[0].empresa_id;
      const activeRole = roles.find(r => r.empresa_id === activeEmpresaId);

      setEmpresaId(activeEmpresaId);
      setUserRole(activeRole?.role || roles[0].role);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Erro de login",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (data.user) {
        const [profile] = await Promise.all([
          fetchUserProfile(data.user.id),
          fetchUserRoles(data.user.id),
        ]);
        navigate("/dashboard");
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo ${profile?.nome || email}!`,
        });
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
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
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
      setUserRole(data.role);

      // Update profile empresa_id locally
      setUserProfile((prev: any) => prev ? { ...prev, empresa_id: targetEmpresaId } : prev);

      toast({
        title: "Empresa alterada",
        description: `Você está agora na empresa selecionada.`,
      });

      // Reload to refresh all data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao trocar empresa",
        description: error.message,
        variant: "destructive",
      });
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
        isSuperAdmin: userRole === 'super_admin',
        empresas,
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
