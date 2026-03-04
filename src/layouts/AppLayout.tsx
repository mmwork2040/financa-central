
import React, { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useIsMobile } from "@/hooks/use-mobile";
import FloatingChatButton from "@/components/common/FloatingChatButton";

import MobileBottomNav from "@/components/common/MobileBottomNav";
import { useSupportNotifications } from "@/hooks/useSupportNotifications";
import { MonthFilterProvider } from "@/contexts/MonthFilterContext";
import MonthCarousel from "@/components/common/MonthCarousel";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar();
  const { isAuthenticated, loading, empresaId, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const themeReady = useCompanyTheme();
  useSupportNotifications();

  const monthFilterRoutes = ["/dashboard", "/transactions", "/vendas-digitais", "/anuncios"];
  const showMonthFilter = monthFilterRoutes.includes(location.pathname);
  useSupportNotifications();

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
    <MonthFilterProvider>
      <div className="flex min-h-screen bg-background overflow-x-hidden">
        <Sidebar />
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out min-w-0",
            isMobile ? "ml-0 pt-14" : isExpanded ? "ml-60" : "ml-14"
          )}
        >
          <div className="w-full px-3 py-4 md:px-4 md:py-6 max-w-full pb-20 md:pb-6">
            {showMonthFilter && (
              <div className="mb-3 flex justify-center">
                <MonthCarousel />
              </div>
            )}
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
        <MobileBottomNav />
        <FloatingChatButton />
        
      </div>
    </MonthFilterProvider>
  );
};
