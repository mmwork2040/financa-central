
import React, { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import { useCompanyTheme } from "@/hooks/useCompanyTheme";
import { useIsMobile } from "@/hooks/use-mobile";

import FloatingWhatsAppButton from "@/components/common/FloatingWhatsAppButton";
import WhatsAppWelcomeModal from "@/components/common/WhatsAppWelcomeModal";
import MobileBottomNav from "@/components/common/MobileBottomNav";
import { useSupportNotifications } from "@/hooks/useSupportNotifications";
import { MonthFilterProvider } from "@/contexts/MonthFilterContext";
import MonthCarousel from "@/components/common/MonthCarousel";
import { Button } from "@/components/ui/button";
import { Clock, Activity } from "lucide-react";
import { PhoneReminderModal } from "@/components/common/PhoneReminderModal";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar();
  const { isAuthenticated, loading, empresaId, userProfile, isSuperAdmin, isTrialActive, trialDaysRemaining, assinaturaStatus } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = React.useState(false);

  React.useEffect(() => {
    if (userProfile && userProfile.onboarding_concluido === false) {
      setOnboardingOpen(true);
    }
  }, [userProfile?.id, userProfile?.onboarding_concluido]);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const themeReady = useCompanyTheme();
  useSupportNotifications();

  const monthFilterRoutes = ["/dashboard", "/transactions", "/vendas-digitais", "/anuncios"];
  const showMonthFilter = monthFilterRoutes.includes(location.pathname);

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
            {/* Plan/Trial Banner */}
            {!isSuperAdmin && assinaturaStatus === 'trial' && trialDaysRemaining !== null && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 mb-3">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {isTrialActive
                    ? <>Você tem <span className="font-bold">{trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}</span> restantes no período de teste.</>
                    : <>Seu período de teste expirou.</>
                  }
                </p>
                <Button variant="outline" size="sm" className="ml-auto text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 h-7 px-3 rounded-full" onClick={() => navigate("/ver-planos")}>
                  Fazer upgrade
                </Button>
              </div>
            )}
            {!isSuperAdmin && assinaturaStatus === 'ativo' && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 mb-3">
                <Activity className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">Plano ativo</p>
                <Button variant="ghost" size="sm" className="ml-auto text-xs h-7 px-3 rounded-full" onClick={() => navigate("/ver-planos")}>
                  Ver planos
                </Button>
              </div>
            )}
            {showMonthFilter && (
              <div className="mb-3 flex justify-center">
                <MonthCarousel />
              </div>
            )}
            <div className="animate-fade-in" key={empresaId}>
              {children}
            </div>
          </div>
        </main>
        <MobileBottomNav />
        <FloatingWhatsAppButton />
        <WhatsAppWelcomeModal />
        <PhoneReminderModal />
        
      </div>
    </MonthFilterProvider>
  );
};
