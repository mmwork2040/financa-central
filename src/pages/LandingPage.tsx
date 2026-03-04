import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Wrench,
  GraduationCap,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Users,
  User,
  DollarSign,
  Star,
  Play,
  Sparkles,
  Check,
  Camera,
  FileText,
} from "lucide-react";
import PhoneMockup from "@/components/landing/PhoneMockup";
import ChatBubble from "@/components/landing/ChatBubble";
import DashboardMockup from "@/components/landing/DashboardMockup";
import ContasListMockup from "@/components/landing/ContasListMockup";
import IntegrationsMockup from "@/components/landing/IntegrationsMockup";
import ReportsMockup from "@/components/landing/ReportsMockup";
import PricingCard from "@/components/landing/PricingCard";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FloatingStatCard from "@/components/landing/FloatingStatCard";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 glass-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">Contabiliza AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Entrar</Button>
            <Button onClick={() => navigate("/register")} className="rounded-full px-6">Criar Conta</Button>
          </div>
        </div>
      </nav>

      {/* ===== SEÇÃO 1: HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsla(25, 95%, 53%, 0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, hsla(25, 95%, 53%, 0.05) 0%, transparent 50%)"
        }} />
        {/* Dots decorativos */}
        <div className="absolute top-20 left-[10%] h-3 w-3 rounded-full bg-primary/20 shadow-lg animate-pulse hidden md:block" />
        <div className="absolute top-40 right-[15%] h-2 w-2 rounded-full bg-primary/30 shadow-md animate-pulse hidden md:block" />
        <div className="absolute bottom-32 left-[20%] h-4 w-4 rounded-full bg-primary/10 shadow-lg hidden md:block" />
        <div className="absolute top-60 right-[8%] h-2.5 w-2.5 rounded-full bg-primary/15 shadow-md hidden md:block" />

        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-center">
            {/* Texto */}
            <div className="space-y-6 text-center md:text-left">
              <Badge className="rounded-full px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 text-xs font-semibold tracking-wide">
                <Zap className="h-3 w-3 mr-1.5" />
                Nº1 EM GESTÃO FINANCEIRA COM IA
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                Seu departamento financeiro a uma{" "}
                <span className="text-primary relative">
                  mensagem de distância
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto md:mx-0 leading-relaxed">
                Conheça sua nova plataforma de gestão financeira para sua empresa, acelerada por inteligência artificial.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
                <Button size="lg" onClick={() => navigate("/register")} className="text-base px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Testar por 30 dias grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 rounded-full" onClick={() => navigate("/demo")}>
                  <Play className="mr-2 h-4 w-4" />
                  Ver Demo
                </Button>
              </div>
            </div>

            {/* Phone mockup com floating cards */}
            <div className="flex justify-center relative">
              {/* Floating stat cards */}
              <FloatingStatCard
                icon={<TrendingUp className="h-4 w-4 text-primary" />}
                label="Receitas do mês"
                value="R$ 24.500"
                className="absolute -left-4 top-8 md:-left-12 lg:-left-16 z-10 hidden md:block"
                delay="0s"
              />
              <FloatingStatCard
                icon={<Target className="h-4 w-4 text-primary" />}
                label="Precisão da IA"
                value="95%"
                className="absolute -right-4 top-24 md:-right-8 lg:-right-12 z-10 hidden md:block"
                delay="0.5s"
              />
              <FloatingStatCard
                icon={<DollarSign className="h-4 w-4 text-primary" />}
                label="Saldo atual"
                value="R$ 10.300"
                className="absolute -left-2 bottom-16 md:-left-6 lg:-left-10 z-10 hidden md:block"
                delay="1s"
              />

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
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 60% 80% at 50% 50%, hsla(25, 95%, 53%, 0.04) 0%, transparent 60%)"
        }} />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-8">
              {/* Grupo "antes" */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Planilha riscada */}
                <div className="relative glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{
                    background: "radial-gradient(ellipse at 50% 0%, hsla(0, 84%, 60%, 0.08) 0%, transparent 70%)"
                  }} />
                  <Table2 className="h-7 w-7 sm:h-10 sm:w-10 text-muted-foreground/30" />
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 drop-shadow-sm" />
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 sm:mt-2 font-medium">Planilhas</p>
                </div>

                {/* Calculadora riscada */}
                <div className="relative glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{
                    background: "radial-gradient(ellipse at 50% 0%, hsla(0, 84%, 60%, 0.08) 0%, transparent 70%)"
                  }} />
                  <Calculator className="h-7 w-7 sm:h-10 sm:w-10 text-muted-foreground/30" />
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 drop-shadow-sm" />
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 sm:mt-2 font-medium text-center">Cálculos<br className="sm:hidden" /> manuais</p>
                </div>
              </div>

              {/* Seta animada */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 px-1 sm:px-2 shrink-0">
                <div className="h-px w-6 sm:w-10 bg-gradient-to-r from-destructive/40 to-primary/60" />
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
                <div className="h-px w-6 sm:w-10 bg-gradient-to-r from-destructive/40 to-primary/60" />
              </div>

              {/* IA solução */}
              <div className="relative glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5 group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-primary/20">
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity" style={{
                  background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.1) 0%, transparent 70%)"
                }} />
                <Sparkles className="h-7 w-7 sm:h-10 sm:w-10 text-primary" />
                <div className="h-4 w-4 sm:h-5 sm:w-5 bg-primary rounded-full flex items-center justify-center absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 shadow-md">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                </div>
                <p className="text-[9px] sm:text-[10px] text-primary mt-1.5 sm:mt-2 font-semibold">IA Financeira</p>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Chega de planilhas ou sistemas <span className="text-primary relative inline-block">ineficientes<svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none"><path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" /></svg></span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              O tempo que você perde tentando conciliar números, caçando recibos e preenchendo células complexas é o tempo que você deveria investir em{" "}
              <span className="text-foreground font-semibold">vender mais e escalar o seu negócio</span>.
              A burocracia não pode ser um obstáculo para o seu crescimento.
            </p>

            {/* Stats bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 max-w-2xl mx-auto pt-4">
              {[
                { icon: Clock, value: "+85%", label: "Economia de tempo" },
                { icon: Target, value: "98%", label: "Precisão nos dados" },
                { icon: Zap, value: "1 min", label: "Por lançamento" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-4 text-center hover:-translate-y-1 transition-all duration-300" style={{
                  background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 70%), rgba(255,255,255,0.72)"
                }}>
                  <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 3: COMO FUNCIONA — TRILHA VISUAL ===== */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
        <div className="text-center mb-16 lg:mb-20">
          <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px] mb-4">Passo a passo</Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Tudo com o auxílio de <span className="text-primary relative inline-block">inteligência artificial<svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none"><path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" /></svg></span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">Veja como é simples em 4 passos.</p>
        </div>

        {/* Timeline trail */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-border/30" />

          {/* Step 1 */}
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 lg:gap-16 mb-16 md:mb-20 pl-16 md:pl-0">
            <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">1</div>
            <div className="md:w-1/2 md:text-right md:pr-12 space-y-2">
              <div className="inline-flex items-center gap-2 text-primary">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-lg font-extrabold tracking-tight text-foreground">Acesse o chat</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Abra o chat pelo celular ou computador. A IA está pronta para te ajudar, 24 horas por dia.</p>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <div className="glass-card rounded-2xl p-3 max-w-xs shadow-lg">
                <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">Contabiliza AI</span>
                    <span className="ml-auto h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="rounded-lg bg-background/80 p-2 text-[10px] text-muted-foreground">👋 Olá! Sou sua IA financeira. Como posso ajudar?</div>
                  <div className="flex gap-1.5">
                    <div className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] text-primary font-medium">💰 Lançar despesa</div>
                    <div className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] text-primary font-medium">📊 Relatório</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col md:flex-row-reverse items-start md:items-center gap-6 md:gap-12 lg:gap-16 mb-16 md:mb-20 pl-16 md:pl-0">
            <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">2</div>
            <div className="md:w-1/2 md:text-left md:pl-12 space-y-2">
              <div className="inline-flex items-center gap-2 text-primary">
                <UserPlus className="h-5 w-5" />
                <h3 className="text-lg font-extrabold tracking-tight text-foreground">Cadastre-se em segundos</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Crie sua conta com e-mail ou telefone. Sem burocracia, sem configurações complexas.</p>
            </div>
            <div className="md:w-1/2 md:pr-12 md:flex md:justify-end">
              <div className="glass-card rounded-2xl p-3 max-w-xs shadow-lg">
                <div className="rounded-xl bg-muted/50 p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold text-foreground text-center">Criar conta</p>
                  <div className="space-y-1.5">
                    <div className="rounded-lg bg-background/80 border border-border/40 px-2 py-1.5 text-[9px] text-muted-foreground">Nome completo</div>
                    <div className="rounded-lg bg-background/80 border border-border/40 px-2 py-1.5 text-[9px] text-muted-foreground">E-mail</div>
                    <div className="rounded-lg bg-background/80 border border-border/40 px-2 py-1.5 text-[9px] text-muted-foreground">Senha</div>
                  </div>
                  <div className="rounded-lg bg-primary text-primary-foreground text-center text-[9px] font-semibold py-1.5">Começar grátis →</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 lg:gap-16 mb-16 md:mb-20 pl-16 md:pl-0">
            <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">3</div>
            <div className="md:w-1/2 md:text-right md:pr-12 space-y-2">
              <div className="inline-flex items-center gap-2 text-primary">
                <Mic className="h-5 w-5" />
                <h3 className="text-lg font-extrabold tracking-tight text-foreground">Faça lançamentos</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Envie <span className="text-primary font-semibold border-b-2 border-primary/30">texto</span>, <span className="text-primary font-semibold border-b-2 border-primary/30">áudio</span> ou <span className="text-primary font-semibold border-b-2 border-primary/30">foto</span> do recibo. A IA interpreta e lança automaticamente.</p>
            </div>
            <div className="md:w-1/2 md:pl-12">
              <div className="glass-card rounded-2xl p-3 max-w-xs shadow-lg">
                <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-2">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Mic className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="w-[2px] rounded-full bg-primary/60" style={{ height: `${Math.random() * 10 + 4}px` }} />
                      ))}
                    </div>
                    <span className="text-[8px] text-muted-foreground ml-auto">0:08</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-2">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Camera className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-medium text-foreground">recibo.jpg</p>
                      <p className="text-[7px] text-muted-foreground">📎 245 KB</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-background/80 p-2 text-[9px] text-foreground">
                    ✅ <span className="font-semibold">R$ 350,00</span> registrado como Despesa → Materiais
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex flex-col md:flex-row-reverse items-start md:items-center gap-6 md:gap-12 lg:gap-16 pl-16 md:pl-0">
            <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">4</div>
            <div className="md:w-1/2 md:text-left md:pl-12 space-y-2">
              <div className="inline-flex items-center gap-2 text-primary">
                <FileBarChart className="h-5 w-5" />
                <h3 className="text-lg font-extrabold tracking-tight text-foreground">Peça relatórios</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Solicite DRE, fluxo de caixa ou qualquer relatório. A IA gera e envia na hora.</p>
            </div>
            <div className="md:w-1/2 md:pr-12 md:flex md:justify-end">
              <div className="glass-card rounded-2xl p-3 max-w-xs shadow-lg">
                <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                  <p className="text-[9px] font-semibold text-foreground">📊 Resumo — Março 2026</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px]">
                      <span className="text-muted-foreground">Receitas</span>
                      <span className="text-green-600 font-semibold">R$ 24.500</span>
                    </div>
                    <div className="flex justify-between text-[8px]">
                      <span className="text-muted-foreground">Despesas</span>
                      <span className="text-red-500 font-semibold">R$ 14.200</span>
                    </div>
                    <div className="h-px bg-border/50 my-1" />
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-foreground">Lucro</span>
                      <span className="text-primary">R$ 10.300</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-8 pt-1">
                    {[60, 45, 75, 50, 80, 65, 70].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-primary/30" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* End dot */}
          <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 -bottom-2 h-3 w-3 rounded-full bg-primary/30 ring-4 ring-background" />
        </div>
      </section>

      {/* ===== SEÇÃO 4: FUNCIONALIDADES ===== */}
      <section className="border-y border-border/40">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Um sistema completo, <span className="text-primary relative inline-block">sem a complexidade<svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none"><path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" /></svg></span> de um sistema tradicional
            </h2>
          </div>

          {/* Feature 1 — Lançamentos */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
            <div className="space-y-4">
              <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">Lançamentos</Badge>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Lançamento de Receitas e Despesas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Registre entradas e saídas em segundos, conversando com a IA. Envie um <span className="text-primary font-semibold border-b-2 border-primary/30">áudio</span>, uma <span className="text-primary font-semibold border-b-2 border-primary/30">foto</span> do recibo ou simplesmente <span className="text-primary font-semibold border-b-2 border-primary/30">digite</span> — a IA cuida do resto.
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
                  {/* Audio message bubble */}
                  <div className="flex gap-2 justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                          <Mic className="h-3 w-3" />
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                            <div key={i} className="w-[2px] rounded-full bg-primary-foreground/70" style={{ height: `${Math.random() * 10 + 4}px` }} />
                          ))}
                        </div>
                        <span className="text-[9px] text-primary-foreground/70">0:08</span>
                      </div>
                      <span className="text-[9px] block mt-0.5 text-primary-foreground/70">14:22</span>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <ChatBubble isBot message="Entendi! Você pagou R$ 350,00 ao fornecedor ABC pela entrega de materiais. Confirmo o lançamento?" time="14:22" />
                  {/* Photo attachment bubble */}
                  <div className="flex gap-2 justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-2 py-2">
                      <div className="rounded-lg bg-primary-foreground/10 p-2 flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-md bg-primary-foreground/15 flex items-center justify-center">
                          <Camera className="h-4 w-4 text-primary-foreground/80" />
                        </div>
                        <div>
                          <p className="text-[9px] font-medium">recibo_compra.jpg</p>
                          <p className="text-[8px] text-primary-foreground/60">📎 Imagem • 245 KB</p>
                        </div>
                      </div>
                      <span className="text-[9px] block text-primary-foreground/70">14:23</span>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <ChatBubble isBot message="✅ Foto analisada! Despesa de R$ 350,00 registrada. Categoria: Materiais." time="14:23" />
                </div>
                {/* Input bar with attachment icons */}
                <div className="px-3 pb-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/40 px-3 py-1.5">
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 text-[9px] text-muted-foreground">Mensagem, áudio ou foto...</span>
                    <Mic className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>

          {/* Feature 2 — Fluxo de Caixa com imagem real */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
            <div className="order-2 md:order-1 flex justify-center">
              <DashboardMockup />
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">Dashboard</Badge>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Fluxo de Caixa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize a saúde financeira do seu negócio com clareza e previsibilidade. Dashboard completo com gráficos, resumos e indicadores em tempo real.
              </p>
            </div>
          </div>

          {/* Feature 3 — Controle de Contas */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
            <div className="space-y-4">
              <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">Contas</Badge>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Controle de Contas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Saiba exatamente o que foi pago, o que está pendente e não perca nenhum vencimento. Status visuais para acompanhar tudo rapidamente.
              </p>
            </div>
            <div className="flex justify-center">
              <ContasListMockup />
            </div>
          </div>

          {/* Feature 4 — Relatórios */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
            <div className="order-2 md:order-1 flex justify-center">
              <PhoneMockup className="scale-90">
                <ReportsMockup />
              </PhoneMockup>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">Relatórios</Badge>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Relatórios Personalizados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Precisa saber o lucro do mês? O gasto com anúncios? Peça pelo chat e receba na hora. A IA entrega resumos financeiros direto na conversa.
              </p>
            </div>
          </div>

          {/* Feature 5 — Integrações */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-4">
              <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">Integrações</Badge>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Integração com Plataformas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conecte suas vendas e seus custos de tráfego em um só lugar de forma inteligente. Meta Ads, Google Ads, Hotmart, Kiwify e muito mais.
              </p>
            </div>
            <div className="flex justify-center">
              <IntegrationsMockup />
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 5: PARA QUEM É ===== */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Para quem é o <span className="text-primary relative inline-block">Contabiliza AI<svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none"><path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" /></svg></span>?
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
            Criado para quem precisa de agilidade e não tem tempo para tarefas engessadas.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { emoji: "🚀", title: "Infoprodutores", desc: "Controle vendas digitais, comissões e custos de tráfego em um só lugar." },
            { emoji: "📢", title: "Donos de Agências", desc: "Gerencie o financeiro de múltiplos clientes e projetos simultaneamente." },
            { emoji: "🛠️", title: "Prestadores de Serviço", desc: "Organize receitas por projeto e acompanhe pagamentos de clientes." },
            { emoji: "🎓", title: "Profissionais Liberais", desc: "Controle honorários, despesas e tenha relatórios prontos para o contador." },
          ].map((item) => (
            <div key={item.title} className="glass-card rounded-2xl p-6 lg:p-7 text-center space-y-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 70%)"
              }} />
              <div className="text-4xl mx-auto relative z-10">{item.emoji}</div>
              <h3 className="text-base font-semibold text-foreground relative z-10">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ===== SEÇÃO 6: PLANOS E PREÇOS ===== */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Planos e Preços</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Escolha o formato ideal para o momento da sua empresa. Teste por 30 dias grátis em qualquer opção e cancele quando quiser.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto mt-12 items-stretch px-2">
            <PricingCard
              title="Plano Mensal"
              price="R$ 197"
              period="mês"
              description="Ideal para quem quer liberdade e pagamento mês a mês."
            />
            <PricingCard
              title="Plano Anual"
              price="R$ 97"
              period="mês"
              description="A opção mais inteligente e econômica para o ano todo."
              highlighted
              badge="Melhor Escolha"
            />
            <PricingCard
              title="Plano Trimestral"
              price="R$ 147"
              period="mês"
              description="Perfeito para sentir o impacto real em um ciclo de 90 dias."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 glass-surface">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold text-foreground">Contabiliza AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/login")} className="hover:text-foreground transition-colors">Entrar</button>
              <button onClick={() => navigate("/register")} className="hover:text-foreground transition-colors">Criar Conta</button>
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
