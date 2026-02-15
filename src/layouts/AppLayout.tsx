
import React, { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar();
  const { isAuthenticated, loading, empresaId, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show onboarding if user has no empresa
  if (!empresaId) {
    return <OnboardingScreen userName={userProfile?.nome || "Usuário"} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isExpanded ? "ml-64" : "ml-16"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
