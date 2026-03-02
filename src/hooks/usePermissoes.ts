import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ScreenPermission = {
  tela: string;
  pode_incluir: boolean;
  pode_alterar: boolean;
  pode_excluir: boolean;
};

// Map route paths to screen permission keys
const routeToScreenMap: Record<string, string> = {
  "/users": "users",
  "/permissions": "permissions",
  "/fornecedores": "fornecedores",
  "/clientes": "clientes",
  "/categorias": "categorias",
  "/bank-accounts": "contas_bancarias",
  "/payment-methods": "formas_pagamento",
  "/transactions": "lancamentos",
  "/reports": "relatorios",
  "/projetos": "projetos",
  "/vendas-digitais": "vendas_digitais",
  "/settings/integracoes": "integracoes",
  "/settings/webhooks": "webhooks",
  "/anuncios": "anuncios",
};

// Screens that require admin role to access (not permission-based)
const adminOnlyScreens = ["users", "permissions"];

export const usePermissoes = (userId: string | null, userRole: string | null, isSuperAdmin: boolean) => {
  const [permissions, setPermissions] = useState<ScreenPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setPermissions([]);
      setLoadingPermissions(false);
      return;
    }

    // Super admin and admin have full access
    if (isSuperAdmin || userRole === "admin") {
      setPermissions([]);
      setLoadingPermissions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("permissoes")
        .select("tela, pode_incluir, pode_alterar, pode_excluir")
        .eq("perfis_id", userId);

      if (error) {
        console.error("Erro ao carregar permissões:", error);
      }
      setPermissions(data || []);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setLoadingPermissions(false);
    }
  }, [userId, userRole, isSuperAdmin]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Screens that only have view permission (stored as pode_incluir)
  const viewOnlyScreens = ["vendas_digitais", "anuncios"];

  /** Check if user can view a screen (has any permission for it, or it's dashboard/settings) */
  const canAccessScreen = useCallback((screenKey: string): boolean => {
    if (isSuperAdmin || userRole === "admin") return true;

    // Admin-only screens
    if (adminOnlyScreens.includes(screenKey)) return false;

    // If no permissions defined at all, user has view-only access to everything
    if (permissions.length === 0) return true;

    // Check if user has any permission for this screen
    const perm = permissions.find(p => p.tela === screenKey);
    
    // For view-only screens, check pode_incluir as the "can view" flag
    if (viewOnlyScreens.includes(screenKey)) {
      return !!perm && perm.pode_incluir;
    }
    
    // If the screen is in the permissions list (even with all false), they can view it
    // If not in the list, they cannot access it
    return !!perm;
  }, [permissions, userRole, isSuperAdmin]);

  /** Check if user can view a route path */
  const canAccessRoute = useCallback((path: string): boolean => {
    // Dashboard and settings are always accessible
    if (path === "/dashboard" || path === "/settings" || path === "/settings/integracoes" || path === "/settings/webhooks") return true;

    const screenKey = routeToScreenMap[path];
    if (!screenKey) return true;

    return canAccessScreen(screenKey);
  }, [canAccessScreen]);

  /** Check a specific action on a screen */
  const canPerformAction = useCallback((screenKey: string, action: 'pode_incluir' | 'pode_alterar' | 'pode_excluir'): boolean => {
    if (isSuperAdmin || userRole === "admin") return true;

    const perm = permissions.find(p => p.tela === screenKey);
    if (!perm) return false;
    return perm[action];
  }, [permissions, userRole, isSuperAdmin]);

  return {
    permissions,
    loadingPermissions,
    canAccessScreen,
    canAccessRoute,
    canPerformAction,
    refetchPermissions: fetchPermissions,
  };
};
