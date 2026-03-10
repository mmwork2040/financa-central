import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PhoneCompletionScreen from "@/components/auth/PhoneCompletionScreen";

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

const PESSOAL_BLOCKED_ROUTES: string[] = [
  "/vendas-digitais",
  "/anuncios",
  "/clientes",
  "/fornecedores",
  "/projetos",
  "/users",
  "/permissions",
  "/settings/webhooks",
];

export const ProtectedRoute = ({ path, children }: ProtectedRouteProps) => {
  const { canAccessRoute, loading, isAuthenticated, isPessoal, needsPhone, user, userProfile, refreshProfile } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Force phone completion before anything else
  if (needsPhone && userProfile) {
    return (
      <PhoneCompletionScreen
        userId={user!.id}
        userName={userProfile.nome || ""}
        onComplete={refreshProfile}
      />
    );
  }

  if (!canAccessRoute(path)) {
    // If blocked from dashboard, try to find first accessible route
    if (path === "/dashboard") {
      const fallbackRoutes = ["/transactions", "/clientes", "/fornecedores", "/categorias", "/bank-accounts", "/payment-methods", "/reports", "/projetos"];
      const firstAccessible = fallbackRoutes.find(r => canAccessRoute(r));
      if (firstAccessible) return <Navigate to={firstAccessible} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  if (isPessoal && PESSOAL_BLOCKED_ROUTES.includes(path)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
