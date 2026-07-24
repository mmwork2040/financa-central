import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  LayoutDashboard,
  ArrowRightLeft,
  MessageCircle,
  FileText,
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const slides = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao ContabilizaAI!",
    description:
      "Vamos te apresentar rapidamente as principais funções para você começar a usar o sistema com o pé direito.",
  },
  {
    icon: LayoutDashboard,
    title: "Página Inicial",
    description:
      "Veja um resumo financeiro completo — receitas, despesas, saldo em conta e projeções — tudo em um só lugar.",
  },
  {
    icon: ArrowRightLeft,
    title: "Lançamentos",
    description:
      "Registre suas receitas e despesas manualmente, em parcelas ou como recorrentes. O sistema projeta os próximos meses automaticamente.",
  },
  {
    icon: MessageCircle,
    title: "Lance direto pelo WhatsApp",
    description:
      "Use o botão flutuante verde para fazer lançamentos enviando uma simples mensagem no WhatsApp. Rápido e sem sair do app.",
  },
  {
    icon: FileText,
    title: "Notas Fiscais e Integrações",
    description:
      "Emita notas fiscais direto do sistema e conecte com Hotmart, Asaas e outras plataformas para automatizar os lançamentos.",
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
  const { user, userProfile, empresas } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const maxPJ = userProfile?.max_empresas_pj ?? 1;
  const empresasPJ = empresas.filter((e) => e.pessoal !== true).length;
  const podeAdicionarPJ = maxPJ > 0 && empresasPJ < maxPJ;

  const totalSteps = slides.length + (podeAdicionarPJ ? 1 : 0);
  const isFinalStep = step === totalSteps - 1;

  const finish = async (addEmpresa: boolean) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await (supabase.from("perfis") as any)
        .update({ onboarding_concluido: true })
        .eq("id", user.id);
      onClose();
      if (addEmpresa) {
        // leva ao seletor de empresa/criação (Sidebar > "+ criar")
        toast.info("Use o seletor de empresas no topo do menu para adicionar uma nova.");
        navigate("/dashboard");
      }
    } catch (e: any) {
      toast.error("Não foi possível salvar o onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (isFinalStep) {
      finish(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  const renderContent = () => {
    if (step < slides.length) {
      const slide = slides[step];
      const Icon = slide.icon;
      return (
        <div className="flex flex-col items-center text-center gap-5 py-4">
          <div className="rounded-full bg-primary/10 p-5">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{slide.title}</h2>
          <p className="text-muted-foreground max-w-md">{slide.description}</p>
        </div>
      );
    }
    // Bonus step: adicionar empresa PJ
    return (
      <div className="flex flex-col items-center text-center gap-5 py-4">
        <div className="rounded-full bg-primary/10 p-5">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Adicione a contabilidade do seu negócio</h2>
        <p className="text-muted-foreground max-w-md">
          Você pode gerenciar até <strong>{maxPJ}</strong>{" "}
          {maxPJ === 1 ? "empresa" : "empresas"} além da sua conta pessoal.
          Quer cadastrar agora?
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish(false)}>
      <DialogContent className="max-w-lg">
        <div className="space-y-4">
          <Progress value={((step + 1) / totalSteps) * 100} className="h-1" />
          {renderContent()}

          <div className="flex items-center justify-between pt-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 0 || saving}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>

            <span className="text-xs text-muted-foreground">
              {step + 1} de {totalSteps}
            </span>

            <div className="flex gap-2">
              {!isFinalStep && (
                <Button variant="ghost" size="sm" onClick={() => finish(false)} disabled={saving}>
                  Pular
                </Button>
              )}
              {isFinalStep && step >= slides.length ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => finish(false)} disabled={saving}>
                    Agora não
                  </Button>
                  <Button size="sm" onClick={() => finish(true)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Building2 className="h-4 w-4 mr-1" />}
                    Adicionar empresa
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleNext} disabled={saving}>
                  {isFinalStep ? (
                    <>
                      <Check className="h-4 w-4 mr-1" /> Concluir
                    </>
                  ) : (
                    <>
                      Próximo <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
