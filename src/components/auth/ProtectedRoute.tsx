import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

const PESSOAL_BLOCKED_ROUTES = ["/users", "/permissions"];

export const ProtectedRoute = ({ path, children }: ProtectedRouteProps) => {
  const { canAccessRoute, loading, isAuthenticated, isPessoal } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccessRoute(path)) return <Navigate to="/dashboard" replace />;
  if (isPessoal && PESSOAL_BLOCKED_ROUTES.includes(path)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
