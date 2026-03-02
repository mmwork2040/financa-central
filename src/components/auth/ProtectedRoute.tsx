import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PhoneCompletionScreen from "@/components/auth/PhoneCompletionScreen";

interface ProtectedRouteProps {
  path: string;
  children: React.ReactNode;
}

const PESSOAL_BLOCKED_ROUTES: string[] = [];

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

  if (!canAccessRoute(path)) return <Navigate to="/dashboard" replace />;
  if (isPessoal && PESSOAL_BLOCKED_ROUTES.includes(path)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
