import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ArrowRight, Star, LogOut } from "lucide-react";
import { toast } from "sonner";

interface PlanoControles {
  max_lancamentos: number;
  max_notas_fiscais: number;
  chat_ia: boolean;
  dashboard_completo: boolean;
  relatorios_personalizados: boolean;
}

interface PlanoRow {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  periodo: string;
  destaque: boolean;
  badge: string | null;
  link_acesso: string | null;
  max_empresas: number;
  grupo: string | null;
  itens: string[];
  controles: PlanoControles;
}

const defaultControles: PlanoControles = {
  max_lancamentos: 0,
  max_notas_fiscais: 0,
  chat_ia: false,
  dashboard_completo: false,
  relatorios_personalizados: false,
};

function parseItensFromDb(raw: any): { itens: string[]; controles: PlanoControles } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      itens: Array.isArray(raw.items) ? raw.items : [],
      controles: { ...defaultControles, ...(raw.controles || {}) },
    };
  }
  if (Array.isArray(raw)) {
    return { itens: raw.filter((x: any) => typeof x === 'string'), controles: { ...defaultControles } };
  }
  return { itens: [], controles: { ...defaultControles } };
}

function getControleItems(controles: PlanoControles, maxEmpresas?: number): string[] {
  const items: string[] = [];
  if (controles.max_lancamentos === 0) items.push("Lançamentos ilimitados");
  else if (controles.max_lancamentos > 0) items.push(`Até ${controles.max_lancamentos} lançamentos`);
  if (maxEmpresas === 0) items.push("Empresas ilimitadas");
  else if (maxEmpresas != null && maxEmpresas > 0) items.push(`Até ${maxEmpresas} empresa${maxEmpresas > 1 ? 's' : ''}`);
  if (controles.max_notas_fiscais === 0) items.push("Notas fiscais ilimitadas");
  else if (controles.max_notas_fiscais > 0) items.push(`Até ${controles.max_notas_fiscais} notas fiscais/mês`);
  if (controles.chat_ia) items.push("Chat IA");
  if (controles.dashboard_completo) items.push("Dashboard Completo");
  if (controles.relatorios_personalizados) items.push("Relatórios Personalizados");
  return items;
}

const periodoLabels: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

const PlanosExpirados = () => {
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<PlanoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mensal");

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
      setPlanos((data || []).map((p: any) => {
        const parsed = parseItensFromDb(p.itens);
        return { ...p, itens: parsed.itens, controles: parsed.controles };
      }));
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const periodosDisponiveis = React.useMemo(() => {
    const set = new Set(planos.map(p => p.periodo));
    return ["mensal", "trimestral", "anual"].filter(p => set.has(p));
  }, [planos]);

  const gruposComModalidade = React.useMemo(() => {
    const map = new Map<string, PlanoRow>();
    planos.forEach(p => {
      const g = p.grupo || p.nome;
      if (p.periodo === periodoSelecionado) map.set(g, p);
    });
    planos.forEach(p => {
      const g = p.grupo || p.nome;
      if (!map.has(g)) map.set(g, p);
    });
    return Array.from(map.values()).sort((a, b) => (a as any).ordem - (b as any).ordem);
  }, [planos, periodoSelecionado]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Você foi desconectado.");
  };

  const handleSelectPlan = (plano: PlanoRow) => {
    if (plano.link_acesso) {
      window.open(plano.link_acesso, "_blank");
    } else {
      toast.info("Entre em contato para assinar este plano.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          Seu período de teste expirou
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Seus 30 dias de acesso gratuito chegaram ao fim. Escolha um plano para continuar usando o sistema.
        </p>
      </div>

      {periodosDisponiveis.length > 1 && (
        <Tabs value={periodoSelecionado} onValueChange={setPeriodoSelecionado} className="mb-8">
          <TabsList>
            {periodosDisponiveis.map(p => (
              <TabsTrigger key={p} value={p}>
                {periodoLabels[p] || p}
                {p === "anual" && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">2 meses grátis</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {loading ? (
        <div className="text-muted-foreground">Carregando planos...</div>
      ) : gruposComModalidade.length === 0 ? (
        <div className="text-muted-foreground">Nenhum plano disponível no momento. Entre em contato com o administrador.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full mb-8">
          {gruposComModalidade.map((plano) => {
            const controleItems = getControleItems(plano.controles, plano.max_empresas);
            const allItems = [...controleItems, ...plano.itens];
            const grupoName = plano.grupo || plano.nome;
            return (
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
                  <h3 className="text-lg font-bold text-foreground">{grupoName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plano.descricao}</p>
                </div>
                <div className="mb-5 relative z-10">
                  <span className="text-3xl font-extrabold text-foreground">
                    R$ {plano.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">/ {plano.periodo}</span>
                  {plano.periodo === "anual" && (
                    <p className="text-xs text-primary mt-1">
                      ≈ R$ {(plano.preco / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </p>
                  )}
                  {plano.periodo === "trimestral" && (
                    <p className="text-xs text-primary mt-1">
                      ≈ R$ {(plano.preco / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6 flex-1 relative z-10">
                  {(allItems.length > 0 ? allItems : ["Acesso ao sistema"]).map((f, i) => (
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
            );
          })}
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
