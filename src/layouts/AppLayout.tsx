
import React, { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useIsMobile } from "@/hooks/use-mobile";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar();
  const { isAuthenticated, loading, empresaId, userProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const themeReady = useCompanyTheme();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || !themeReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
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
          isMobile ? "ml-0 pt-14" : isExpanded ? "ml-64" : "ml-16"
        )}
      >
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
};
