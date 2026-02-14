import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  userProfile: any | null;
  empresaId: string | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  userProfile: null,
  empresaId: null,
  userRole: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
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

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('empresa_id, role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Erro ao carregar role do usuário:", error);
        return null;
      }

      if (data) {
        setEmpresaId(data.empresa_id);
        setUserRole(data.role);
      }
      return data;
    } catch (error) {
      console.error("Erro ao carregar role:", error);
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
            fetchUserRole(currentSession.user.id);
          }, 0);
        } else {
          setUserProfile(null);
          setEmpresaId(null);
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        Promise.all([
          fetchUserProfile(currentSession.user.id),
          fetchUserRole(currentSession.user.id),
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
          fetchUserRole(data.user.id),
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

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        loading,
        user,
        userProfile,
        empresaId,
        userRole,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
