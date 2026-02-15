import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

export const ProtectedRoute = ({ path, children }: ProtectedRouteProps) => {
  const { canAccessRoute, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccessRoute(path)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
