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

export type PlanoControles = {
  max_lancamentos: number;
  chat_ia: boolean;
  dashboard_completo: boolean;
  relatorios_personalizados: boolean;
};

const defaultPlanoControles: PlanoControles = {
  max_lancamentos: 0,
  chat_ia: true,
  dashboard_completo: true,
  relatorios_personalizados: true,
};

function parseControlesFromItens(raw: any): PlanoControles {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.controles) {
    return { ...defaultPlanoControles, ...raw.controles };
  }
  return { ...defaultPlanoControles };
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
  needsPhone: boolean;
  planControles: PlanoControles;
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
  assinaturaStatus: string;
  canAccessRoute: (path: string) => boolean;
  canAccessScreen: (screenKey: string) => boolean;
  canPerformAction: (screenKey: string, action: 'pode_incluir' | 'pode_alterar' | 'pode_excluir') => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchEmpresa: (empresaId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  needsPhone: false,
  planControles: defaultPlanoControles,
  isTrialActive: true,
  trialDaysRemaining: null,
  assinaturaStatus: 'trial',
  canAccessRoute: () => true,
  canAccessScreen: () => true,
  canPerformAction: () => false,
  login: async () => {},
  logout: async () => {},
  switchEmpresa: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaInfo[]>([]);
  const [planControles, setPlanControles] = useState<PlanoControles>(defaultPlanoControles);
  const [isTrialActive, setIsTrialActive] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [assinaturaStatus, setAssinaturaStatus] = useState('trial');
  const isSuperAdmin = userRole === 'super_admin';
  const isPessoal = empresas.find(e => e.empresa_id === empresaId)?.pessoal === true;
  const needsPhone = !!user && !!userProfile && !userProfile.evolution_webhook_url;
  const { canAccessRoute, canAccessScreen, canPerformAction } = usePermissoes(user?.id || null, userRole, isSuperAdmin);
  const navigate = useNavigate();

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const fetchPlanControles = async (profile: any) => {
    if (!profile) return;
    
    // Check if user is in trial
    const status = profile.assinatura_status || 'trial';
    const trialStarted = profile.trial_started_at || profile.created_at;
    
    setAssinaturaStatus(status);
    
    if (status === 'trial' && trialStarted) {
      const trialEnd = new Date(trialStarted);
      trialEnd.setDate(trialEnd.getDate() + 30);
      const now = new Date();
      const diffMs = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      setTrialDaysRemaining(daysLeft);
      if (now <= trialEnd) {
        setIsTrialActive(true);
        setPlanControles(defaultPlanoControles);
        return;
      }
    }
    
    setIsTrialActive(false);
    setTrialDaysRemaining(0);
    
    // Fetch plan controls if user has a plan
    if (profile.assinatura_plano_id && status === 'ativo') {
      try {
        const { data } = await (supabase as any)
          .from('planos_assinatura')
          .select('itens')
          .eq('id', profile.assinatura_plano_id)
          .single();
        if (data) {
          setPlanControles(parseControlesFromItens(data.itens));
          return;
        }
      } catch (e) {
        console.error("Erro ao carregar controles do plano:", e);
      }
    }
    
    // No active plan - restrict everything
    setPlanControles({
      max_lancamentos: 10,
      chat_ia: false,
      dashboard_completo: false,
      relatorios_personalizados: false,
    });
  };

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
      // Fetch plan controls based on profile
      fetchPlanControles(data);
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

      if (!roles || roles.length === 0) return null;

      const empresaIds = roles.map(r => r.empresa_id);
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('id, nome, pessoal')
        .in('id', empresaIds);

      empresasList = roles.map(r => ({
        empresa_id: r.empresa_id,
        role: r.role === 'super_admin' ? 'admin' : r.role,
        empresa_nome: empresasData?.find(e => e.id === r.empresa_id)?.nome || 'Empresa',
        pessoal: empresasData?.find(e => e.id === r.empresa_id)?.pessoal || false,
      }));

      setEmpresas(empresasList);

      const { data: profile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('id', userId)
        .single();

      const rawEmpresaId = profile?.empresa_id || (roles && roles.length > 0 ? roles[0].empresa_id : empresasList[0]?.empresa_id);
      const activeEmpresaId = rawEmpresaId && String(rawEmpresaId).trim() !== '' ? rawEmpresaId : null;
      
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
        const [profile, rolesResult] = await Promise.all([
          fetchUserProfile(data.user.id),
          fetchUserRoles(data.user.id),
        ]);

        // Check trial/subscription status
        const isSuperAdminUser = rolesResult?.empresasList?.some((e: any) => 
          e.role === 'super_admin' || e.role === 'admin'
        );
        
        // Super admins bypass subscription check
        const { data: saCheck } = await supabase.rpc('is_super_admin', { _user_id: data.user.id });
        
        if (!saCheck) {
          const assinaturaStatus = profile?.assinatura_status || 'trial';
          const trialStarted = profile?.trial_started_at || profile?.created_at;
          
          if (assinaturaStatus === 'trial' && trialStarted) {
            const trialEnd = new Date(trialStarted);
            trialEnd.setDate(trialEnd.getDate() + 30);
            
            if (new Date() > trialEnd) {
              // Trial expired - redirect to plans page
              navigate("/planos-expirados");
              toast.error("Seu período de teste de 30 dias expirou. Escolha um plano para continuar.");
              return;
            }
          } else if (assinaturaStatus === 'expired' || assinaturaStatus === 'cancelled') {
            navigate("/planos-expirados");
            toast.error("Sua assinatura expirou. Escolha um plano para continuar.");
            return;
          }
        }

        // Fire login webhook (global - searches all empresas)
        const activeEmpresaId = rolesResult?.activeEmpresaId || profile?.empresa_id;
        if (activeEmpresaId) {
          try {
            await supabase.functions.invoke("fire-webhook", {
              body: {
                empresa_id: activeEmpresaId,
                evento: "Acesso do Usuário",
                descricao: `Login: ${profile?.nome || email}`,
                nome: profile?.nome || null,
                id_usuario: data.user.id || null,
                id_telegram: profile?.telegram_id || null,
                telefone: profile?.evolution_webhook_url || null,
                email: profile?.email || null,
                acao: "login",
              },
            });
          } catch (whErr) {
            console.error("[login webhook] error:", whErr);
          }
        }

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
        needsPhone,
        canAccessRoute,
        canAccessScreen,
        canPerformAction,
        login,
        logout,
        switchEmpresa,
        refreshProfile,
        planControles: isSuperAdmin ? defaultPlanoControles : planControles,
        isTrialActive: isSuperAdmin ? true : isTrialActive,
        trialDaysRemaining: isSuperAdmin ? null : trialDaysRemaining,
        assinaturaStatus: isSuperAdmin ? 'ativo' : assinaturaStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
