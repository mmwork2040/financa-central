import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  ArrowRight,
  MessageSquare,
  UserPlus,
  Mic,
  FileBarChart,
  Table2,
  Calculator,
  XCircle,
  Lightbulb,
  Megaphone,
  Briefcase,
  Wrench,
  GraduationCap,
} from "lucide-react";
import PhoneMockup from "@/components/landing/PhoneMockup";
import ChatBubble from "@/components/landing/ChatBubble";
import DashboardMockup from "@/components/landing/DashboardMockup";
import ContasListMockup from "@/components/landing/ContasListMockup";
import IntegrationsMockup from "@/components/landing/IntegrationsMockup";
import PricingCard from "@/components/landing/PricingCard";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 glass-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Contabiliza AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Entrar</Button>
            <Button onClick={() => navigate("/register")}>Criar Conta</Button>
          </div>
        </div>
      </nav>

      {/* ===== SEÇÃO 1: HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                Seu departamento financeiro a uma{" "}
                <span className="text-primary">mensagem de distância</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
                Conheça sua nova plataforma de gestão financeira para sua empresa, acelerada por inteligência artificial.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button size="lg" onClick={() => navigate("/register")} className="text-base px-8">
                  Testar por 30 dias grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <PhoneMockup>
                <div className="bg-muted/30 px-3 py-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">Contabiliza AI</p>
                      <p className="text-[9px] text-muted-foreground">online</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-3 space-y-2.5">
                  <ChatBubble isBot message="Olá! Sou sua assistente financeira. Como posso ajudar?" time="09:41" />
                  <ChatBubble message="Paguei R$ 1.200 de aluguel hoje no Pix" time="09:42" />
                  <ChatBubble isBot message="✅ Lançamento registrado! Despesa de R$ 1.200,00 — Aluguel, pago via Pix em 04/03/2026." time="09:42" />
                  <ChatBubble message="Qual meu saldo do mês?" time="09:43" />
                  <ChatBubble isBot message="📊 Seu saldo em março: Receitas R$ 18.500 | Despesas R$ 8.200 | Saldo R$ 10.300. Quer um relatório detalhado?" time="09:43" />
                </div>
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 2: CONEXÃO COM A DOR ===== */}
      <section className="relative border-y border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex justify-center gap-6 mb-6">
              <div className="relative">
                <Table2 className="h-10 w-10 text-muted-foreground/40" />
                <XCircle className="h-5 w-5 text-destructive absolute -top-1 -right-1" />
              </div>
              <div className="relative">
                <Calculator className="h-10 w-10 text-muted-foreground/40" />
                <XCircle className="h-5 w-5 text-destructive absolute -top-1 -right-1" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Chega de planilhas ou sistemas ineficientes
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              O tempo que você perde tentando conciliar números, caçando recibos e preenchendo células complexas é o tempo que você deveria investir em{" "}
              <span className="text-foreground font-semibold">vender mais e escalar o seu negócio</span>.
              A burocracia não pode ser um obstáculo para o seu crescimento.
            </p>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 3: COMO FUNCIONA ===== */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tudo com o auxílio de <span className="text-primary">inteligência artificial</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">Veja como é simples fazer os lançamentos e ter o controle total.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: 1, icon: MessageSquare, title: "Acesse o chat", desc: "Abra o chat diretamente do seu celular, onde estiver." },
            { step: 2, icon: UserPlus, title: "Cadastre-se", desc: "Crie sua conta na plataforma em poucos segundos." },
            { step: 3, icon: Mic, title: "Faça lançamentos", desc: "Envie mensagens de texto, áudios ou fotos de forma natural." },
            { step: 4, icon: FileBarChart, title: "Peça relatórios", desc: "Solicite relatórios à IA e gerencie seu financeiro na palma da mão." },
          ].map((item) => (
            <div key={item.step} className="glass-card rounded-2xl p-6 text-center space-y-3 group hover:shadow-lg transition-all relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                {item.step}
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mt-2 group-hover:bg-primary/20 transition-colors">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SEÇÃO 4: FUNCIONALIDADES ===== */}
      <section className="border-y border-border/40">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Um sistema completo, <span className="text-primary">sem a complexidade</span> de um sistema tradicional
            </h2>
          </div>

          {/* Feature 1 — Lançamentos */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Lançamento de Receitas e Despesas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Registre entradas e saídas em segundos, conversando com a IA. Envie um áudio, uma foto do recibo ou simplesmente digite — a IA cuida do resto.
              </p>
            </div>
            <div className="flex justify-center">
              <PhoneMockup className="scale-90">
                <div className="bg-muted/30 px-3 py-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-[10px] font-semibold text-foreground">Contabiliza AI</p>
                  </div>
                </div>
                <div className="px-3 py-3 space-y-2.5">
                  <ChatBubble message="🎤 Áudio (0:08)" time="14:22" />
                  <ChatBubble isBot message="Entendi! Você pagou R$ 350,00 ao fornecedor ABC pela entrega de materiais. Confirmo o lançamento?" time="14:22" />
                  <ChatBubble message="Confirma" time="14:23" />
                  <ChatBubble isBot message="✅ Despesa de R$ 350,00 registrada com sucesso! Categoria: Materiais." time="14:23" />
                </div>
              </PhoneMockup>
            </div>
          </div>

          {/* Feature 2 — Fluxo de Caixa */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 flex justify-center">
              <DashboardMockup />
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize a saúde financeira do seu negócio com clareza e previsibilidade. Dashboard completo com gráficos, resumos e indicadores em tempo real.
              </p>
            </div>
          </div>

          {/* Feature 3 — Controle de Contas */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Controle de Contas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Saiba exatamente o que foi pago, o que está pendente e não perca nenhum vencimento. Status visuais para acompanhar tudo rapidamente.
              </p>
            </div>
            <div className="flex justify-center">
              <ContasListMockup />
            </div>
          </div>

          {/* Feature 4 — Relatórios */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 flex justify-center">
              <PhoneMockup className="scale-90">
                <div className="bg-muted/30 px-3 py-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-[10px] font-semibold text-foreground">Contabiliza AI</p>
                  </div>
                </div>
                <div className="px-3 py-3 space-y-2.5">
                  <ChatBubble message="Qual foi meu lucro em fevereiro?" time="10:15" />
                  <ChatBubble isBot message="📊 Resumo de Fevereiro:\n\n💰 Receitas: R$ 32.400\n💸 Despesas: R$ 19.800\n✅ Lucro: R$ 12.600\n\nO maior gasto foi com Anúncios (R$ 8.200). Quer ver o detalhamento por categoria?" time="10:15" />
                  <ChatBubble message="Sim, por favor" time="10:16" />
                  <ChatBubble isBot message="📋 Top categorias de despesa:\n1. Anúncios — R$ 8.200\n2. Equipe — R$ 5.400\n3. Ferramentas — R$ 3.100\n4. Outros — R$ 3.100" time="10:16" />
                </div>
              </PhoneMockup>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Relatórios Personalizados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Precisa saber o lucro do mês? O gasto com anúncios? Peça pelo chat e receba na hora. A IA entrega resumos financeiros direto na conversa.
              </p>
            </div>
          </div>

          {/* Feature 5 — Integrações */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Integração com Plataformas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conecte suas vendas e seus custos de tráfego em um só lugar de forma inteligente. Meta Ads, Google Ads, Hotmart, Kiwify e muito mais.
              </p>
            </div>
            <div className="flex justify-center">
              <IntegrationsMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 5: PARA QUEM É ===== */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Para quem é o <span className="text-primary">Contabiliza AI</span>?
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Criado para quem precisa de agilidade e não tem tempo para tarefas engessadas.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Lightbulb, title: "Infoprodutores", desc: "Controle vendas digitais, comissões e custos de tráfego em um só lugar." },
            { icon: Megaphone, title: "Donos de Agências", desc: "Gerencie o financeiro de múltiplos clientes e projetos simultaneamente." },
            { icon: Wrench, title: "Prestadores de Serviço", desc: "Organize receitas por projeto e acompanhe pagamentos de clientes." },
            { icon: GraduationCap, title: "Profissionais Liberais", desc: "Controle honorários, despesas e tenha relatórios prontos para o contador." },
          ].map((item) => (
            <div key={item.title} className="glass-card rounded-2xl p-6 text-center space-y-3 hover:shadow-lg transition-all">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SEÇÃO 6: PLANOS E PREÇOS ===== */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Planos e Preços</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Escolha o formato ideal para o momento da sua empresa. Teste por 30 dias grátis em qualquer opção e cancele quando quiser.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <PricingCard
              title="Plano Mensal"
              price="R$ 197"
              period="mês"
              description="Ideal para quem quer liberdade e pagamento mês a mês."
            />
            <PricingCard
              title="Plano Trimestral"
              price="R$ 147"
              period="mês"
              description="Perfeito para sentir o impacto real em um ciclo de 90 dias."
            />
            <PricingCard
              title="Plano Anual"
              price="R$ 79"
              period="mês"
              description="A opção mais inteligente e econômica para o ano todo."
              highlighted
              badge="Melhor Escolha"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 glass-surface">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Contabiliza AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ContabilizaAI. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
