import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight, X, Home, Files, Briefcase, Users, Truck, PieChart,
  Sparkles, ChevronRight,
} from "lucide-react";

export type DemoSection = "dashboard" | "lancamentos" | "projetos" | "clientes" | "fornecedores" | "relatorios";

interface TourStep {
  section: DemoSection;
  title: string;
  description: string;
  icon: React.ElementType;
}

const tourSteps: TourStep[] = [
  {
    section: "dashboard",
    title: "Dashboard Financeiro",
    description: "Visão completa do seu financeiro: receitas, despesas, saldo, projeção de caixa e saúde financeira — tudo em tempo real.",
    icon: Home,
  },
  {
    section: "lancamentos",
    title: "Lançamentos",
    description: "Registre receitas e despesas em segundos. Organize por categorias, projetos e formas de pagamento — inclusive pelo Telegram.",
    icon: Files,
  },
  {
    section: "projetos",
    title: "Projetos",
    description: "Acompanhe o orçamento de cada projeto com receitas, despesas e impostos calculados automaticamente.",
    icon: Briefcase,
  },
  {
    section: "clientes",
    title: "Clientes",
    description: "Base completa de clientes com dados de contato, endereço e histórico de transações.",
    icon: Users,
  },
  {
    section: "fornecedores",
    title: "Fornecedores",
    description: "Cadastro centralizado de fornecedores para controle de pagamentos e relacionamento.",
    icon: Truck,
  },
  {
    section: "relatorios",
    title: "Relatórios",
    description: "Gráficos e análises financeiras para tomar decisões inteligentes com base em dados reais.",
    icon: PieChart,
  },
];

interface DemoTourProps {
  onNavigate: (section: DemoSection) => void;
  currentSection: DemoSection;
}

const DemoTour = ({ onNavigate, currentSection }: DemoTourProps) => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Auto-start tour after a short delay
  useEffect(() => {
    if (dismissed) return;
    const t = setTimeout(() => setActive(true), 1500);
    return () => clearTimeout(t);
  }, [dismissed]);

  // Sync section when step changes
  useEffect(() => {
    if (active && tourSteps[step]) {
      onNavigate(tourSteps[step].section);
    }
  }, [step, active, onNavigate]);

  const next = useCallback(() => {
    if (step < tourSteps.length - 1) {
      setStep(s => s + 1);
    } else {
      setActive(false);
      setDismissed(true);
    }
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const skip = useCallback(() => {
    setActive(false);
    setDismissed(true);
  }, []);

  const restart = useCallback(() => {
    setStep(0);
    setDismissed(false);
    setActive(true);
  }, []);

  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;
  const Icon = current?.icon;

  // Floating restart button when tour is dismissed
  if (!active && dismissed) {
    return (
      <button
        onClick={restart}
        className="fixed bottom-24 md:bottom-6 right-4 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform animate-[scale-in_0.3s_ease-out]"
        title="Reiniciar tour"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  if (!active) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] animate-[fade-in_0.3s_ease-out]"
        onClick={skip}
      />

      {/* Tour Card */}
      <div className="fixed z-[70] bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md animate-[fade-in_0.4s_ease-out,scale-in_0.3s_ease-out]">
        <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / tourSteps.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  {Icon && <Icon className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Passo {step + 1} de {tourSteps.length}
                  </p>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {current.title}
                  </h3>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={skip}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {current.description}
            </p>

            {/* Step dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {tourSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={prev}>
                    Anterior
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={skip}>
                  Pular tour
                </Button>
              </div>
              <Button size="sm" className="rounded-full gap-1" onClick={next}>
                {isLast ? (
                  <>
                    Finalizar
                    <Sparkles className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoTour;
