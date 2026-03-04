import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Star, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  periodo: string;
  destaque: boolean;
  badge: string | null;
  link_acesso: string | null;
  itens: string[];
}

const PlanosExpirados = () => {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("planos_assinatura")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      setPlanos((data || []).map((p: any) => ({ ...p, itens: Array.isArray(p.itens) ? p.itens : [] })));
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Você foi desconectado.");
  };

  const handleSelectPlan = (plano: Plano) => {
    if (plano.link_acesso) {
      window.open(plano.link_acesso, "_blank");
    } else {
      toast.info("Entre em contato para assinar este plano.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          Seu período de teste expirou
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Seus 30 dias de acesso gratuito chegaram ao fim. Escolha um plano para continuar usando o sistema sem restrições.
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando planos...</div>
      ) : planos.length === 0 ? (
        <div className="text-muted-foreground">Nenhum plano disponível no momento. Entre em contato com o administrador.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full mb-8">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 h-full ${
                plano.destaque
                  ? "glass-card border-2 border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20"
                  : "glass-card"
              }`}
            >
              {plano.destaque && (
                <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{
                  background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.08) 0%, transparent 60%)"
                }} />
              )}
              {plano.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold gap-1.5 rounded-full shadow-lg shadow-primary/30 whitespace-nowrap border-2 border-background">
                    <Star className="h-3 w-3 fill-current" />
                    {plano.badge}
                  </Badge>
                </div>
              )}
              <div className="mb-4 relative z-10">
                <h3 className="text-lg font-bold text-foreground">{plano.nome}</h3>
                <p className="text-xs text-muted-foreground mt-1">{plano.descricao}</p>
              </div>
              <div className="mb-5 relative z-10">
                <span className="text-3xl font-extrabold text-foreground">R$ {plano.preco}</span>
                <span className="text-sm text-muted-foreground ml-1">/ mês</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1 relative z-10">
                {(plano.itens.length > 0 ? plano.itens : ["Acesso ao sistema"]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelectPlan(plano)}
                className={`w-full relative z-10 rounded-full ${plano.destaque ? "shadow-lg shadow-primary/20" : ""}`}
                variant={plano.destaque ? "default" : "outline"}
                size="lg"
              >
                Assinar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button variant="ghost" onClick={handleLogout} className="gap-2 text-muted-foreground">
        <LogOut className="h-4 w-4" />
        Sair do sistema
      </Button>
    </div>
  );
};

export default PlanosExpirados;
