import React, { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import HeroChatAnimation from "@/components/landing/HeroChatAnimation";
import DashboardMockup from "@/components/landing/DashboardMockup";
import ContasListMockup from "@/components/landing/ContasListMockup";
import IntegrationsMockup from "@/components/landing/IntegrationsMockup";
import ReportsMockup from "@/components/landing/ReportsMockup";
import PricingCard from "@/components/landing/PricingCard";
import PersonalDashboardMockup from "@/components/landing/PersonalDashboardMockup";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FloatingStatCard from "@/components/landing/FloatingStatCard";
import ScrollReveal from "@/components/common/ScrollReveal";

const LandingPage = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<"mensal" | "anual">("anual");

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
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button onClick={() => navigate("/register")} className="rounded-full px-6">
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>

      {/* ===== SEÇÃO 1: HERO ===== */}
      <section className="relative overflow-x-clip">
        {/* Background decorativo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, hsla(25, 95%, 53%, 0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, hsla(25, 95%, 53%, 0.05) 0%, transparent 50%)",
          }}
        />
        {/* Dots decorativos */}
        <div className="absolute top-20 left-[10%] h-3 w-3 rounded-full bg-primary/20 shadow-lg animate-pulse hidden md:block" />
        <div className="absolute top-40 right-[15%] h-2 w-2 rounded-full bg-primary/30 shadow-md animate-pulse hidden md:block" />
        <div className="absolute bottom-32 left-[20%] h-4 w-4 rounded-full bg-primary/10 shadow-lg hidden md:block" />
        <div className="absolute top-60 right-[8%] h-2.5 w-2.5 rounded-full bg-primary/15 shadow-md hidden md:block" />

        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-center">
            {/* Texto */}
            <ScrollReveal direction="up">
              <div className="space-y-6 text-center md:text-left">
                <Badge className="rounded-full px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 text-xs font-semibold tracking-wide">
                  <Zap className="h-3 w-3 mr-1.5" />
                  Nº1 EM GESTÃO FINANCEIRA COM IA
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
                  O controle financeiro do seu negócio e da sua vida a uma{" "}
                  <span className="text-primary relative">
                    mensagem de distância
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                      <path
                        d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.3"
                      />
                    </svg>
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto md:mx-0 leading-relaxed">
                  Conheça sua nova plataforma de gestão financeira para sua empresa, acelerada por inteligência
                  artificial.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
                  <Button
                    size="lg"
                    onClick={() => navigate("/register")}
                    className="text-base px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    Testar por 30 dias grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 rounded-full"
                    onClick={() => navigate("/demo")}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Ver Demo
                  </Button>
                </div>
              </div>
            </ScrollReveal>

            {/* Phone mockup com floating cards */}
            <ScrollReveal direction="right" delay={200}>
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
                  <HeroChatAnimation />
                </PhoneMockup>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 2: PARE DE PERDER TEMPO ===== */}
      <section className="relative border-y border-border/40 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 50%, hsla(25, 95%, 53%, 0.04) 0%, transparent 60%)",
          }}
        />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="max-w-5xl mx-auto">
            {/* Headline curta */}
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px] mb-4">
                  Automação inteligente
                </Badge>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  A IA cuida da{" "}
                  <span className="text-primary relative inline-block">
                    burocracia
                    <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                      <path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </span>
                  , você cuida de vender
                </h2>
                <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
                  Notas fiscais, relatórios e categorização — tudo automático.
                </p>
              </div>
            </ScrollReveal>

            {/* 3 Pilares — visual-first, mockup grande */}
            <div className="grid md:grid-cols-3 gap-5 lg:gap-6 mb-16">
              {/* Card 1: Notas Fiscais */}
              <ScrollReveal direction="up" delay={0}>
                <div className="glass-card rounded-2xl p-5 h-full hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden border border-border/50 hover:border-primary/20">
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.10) 0%, transparent 70%)" }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">📄</div>
                      <h3 className="text-sm font-bold text-foreground">Notas Fiscais no automático</h3>
                    </div>
                    <div className="glass-card rounded-xl p-3 space-y-2.5">
                      {[
                        { nf: "NF-e #4.281", cli: "João M.", val: "R$ 497", status: "Emitida ✓", sc: "bg-green-500/10 text-green-600" },
                        { nf: "NF-e #4.282", cli: "Ana S.", val: "R$ 1.290", status: "Emitida ✓", sc: "bg-green-500/10 text-green-600" },
                        { nf: "NF-e #4.283", cli: "Pedro R.", val: "R$ 797", status: "Emitida ✓", sc: "bg-green-500/10 text-green-600" },
                        { nf: "NF-e #4.284", cli: "Carla T.", val: "R$ 2.100", status: "Emitindo...", sc: "bg-primary/10 text-primary animate-pulse" },
                      ].map((row, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-semibold text-foreground">{row.nf}</p>
                              <p className="text-[9px] text-muted-foreground">{row.cli} · {row.val}</p>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${row.sc}`}>{row.status}</span>
                          </div>
                          {i < 3 && <div className="h-px bg-border/40 mt-2.5" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Card 2: Relatórios */}
              <ScrollReveal direction="up" delay={100}>
                <div className="glass-card rounded-2xl p-5 h-full hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden border border-border/50 hover:border-primary/20">
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.10) 0%, transparent 70%)" }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">📊</div>
                      <h3 className="text-sm font-bold text-foreground">Relatórios prontos</h3>
                    </div>
                    <div className="glass-card rounded-xl p-3">
                      <div className="flex items-end gap-1 h-20 justify-center mb-3">
                        {[28, 42, 35, 58, 48, 65, 72, 60, 82, 70, 78, 90].map((h, i) => (
                          <div key={i} className="flex-1">
                            <div
                              className="w-full rounded-sm min-w-[6px]"
                              style={{
                                height: `${h}%`,
                                background: i === 11 ? "hsl(var(--primary))" : i >= 8 ? "hsla(25, 95%, 53%, 0.6)" : "hsla(25, 95%, 53%, 0.18)",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-muted-foreground mb-3">
                        <span>Jan</span><span>Abr</span><span>Jul</span><span>Out</span><span>Dez</span>
                      </div>
                      <div className="h-px bg-border/40 mb-2.5" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] font-bold text-green-600">R$ 84k</p>
                          <p className="text-[8px] text-muted-foreground">Receita</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-destructive">R$ 31k</p>
                          <p className="text-[8px] text-muted-foreground">Despesa</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-primary">R$ 53k</p>
                          <p className="text-[8px] text-muted-foreground">Lucro</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Card 3: Controle com IA */}
              <ScrollReveal direction="up" delay={200}>
                <div className="glass-card rounded-2xl p-5 h-full hover:-translate-y-2 transition-all duration-300 hover:shadow-xl group relative overflow-hidden border border-border/50 hover:border-primary/20">
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.10) 0%, transparent 70%)" }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🤖</div>
                      <h3 className="text-sm font-bold text-foreground">IA categoriza tudo</h3>
                    </div>
                    <div className="glass-card rounded-xl p-3 space-y-2">
                      {[
                        { cat: "Tráfego Pago", plat: "Meta Ads", val: "- R$ 3.450", color: "text-destructive", icon: "🎯" },
                        { cat: "Venda Digital", plat: "Hotmart", val: "+ R$ 12.800", color: "text-green-600", icon: "🛒" },
                        { cat: "Fornecedor", plat: "Adobe CC", val: "- R$ 290", color: "text-destructive", icon: "🏢" },
                        { cat: "Venda Digital", plat: "Kiwify", val: "+ R$ 4.700", color: "text-green-600", icon: "🛒" },
                        { cat: "Pró-labore", plat: "Transferência", val: "- R$ 5.000", color: "text-destructive", icon: "👤" },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{item.icon}</span>
                              <div>
                                <p className="text-[10px] font-semibold text-foreground">{item.cat}</p>
                                <p className="text-[8px] text-muted-foreground">{item.plat}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] font-bold ${item.color}`}>{item.val}</span>
                              <Sparkles className="h-2.5 w-2.5 text-primary/40" />
                            </div>
                          </div>
                          {i < 4 && <div className="h-px bg-border/40 mt-2" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-center text-primary/60 font-medium mt-2">✨ Categorizado pela IA</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
            </div>

            {/* Economia de tempo e dinheiro */}
            <ScrollReveal direction="up" delay={100}>
              <div className="glass-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: "radial-gradient(ellipse at 30% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, hsla(25, 95%, 53%, 0.04) 0%, transparent 50%)",
                  }}
                />
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-foreground">
                      Quanto custa <span className="text-primary">não automatizar</span>?
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                      Faça as contas: o tempo que você gasta com burocracia financeira é tempo (e dinheiro) que nunca volta.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { emoji: "⏱️", value: "+20h", sub: "/ mês economizadas", desc: "Horas que você gastava preenchendo planilhas, emitindo notas e conferindo extratos." },
                      { emoji: "💰", value: "R$ 2.500", sub: "/ mês em economia", desc: "Custo médio de um assistente financeiro que você não precisará contratar." },
                      { emoji: "🎯", value: "Zero", sub: "erros manuais", desc: "A IA categoriza e concilia automaticamente, eliminando falhas humanas." },
                      { emoji: "📈", value: "+40%", sub: "mais foco em vendas", desc: "Tempo livre que volta para estratégia, tráfego e crescimento real." },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="glass-card rounded-2xl p-5 text-center hover:-translate-y-1 transition-all duration-300"
                      >
                        <span className="text-2xl block mb-2">{stat.emoji}</span>
                        <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                        <p className="text-xs font-semibold text-primary">{stat.sub}</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{stat.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-8">
                    <Button onClick={() => navigate("/register")} size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                      Começar meu teste grátis de 30 dias
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 3: COMO FUNCIONA — TRILHA VISUAL ===== */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
        <ScrollReveal direction="up">
          <div className="text-center mb-16 lg:mb-20">
            <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px] mb-4">
              Passo a passo
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Tudo com o auxílio de{" "}
              <span className="text-primary relative inline-block">
                inteligência artificial
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                </svg>
              </span>
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">Veja como é simples em 4 passos.</p>
          </div>
        </ScrollReveal>

        {/* Timeline trail */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-border/30" />

          {/* Step 1 */}
          <ScrollReveal direction="left">
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 lg:gap-16 mb-16 md:mb-20 pl-16 md:pl-0">
              <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">
                1
              </div>
              <div className="md:w-1/2 md:text-right md:pr-12 space-y-2">
                <div className="inline-flex items-center gap-2 text-primary">
                  <MessageSquare className="h-5 w-5" />
                  <h3 className="text-lg font-extrabold tracking-tight text-foreground">Acesse o chat</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Abra o chat pelo celular ou computador. A IA está pronta para te ajudar, 24 horas por dia.
                </p>
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
                    <div className="rounded-lg bg-background/80 p-2 text-[10px] text-muted-foreground">
                      👋 Olá! Sou sua IA financeira. Como posso ajudar?
                    </div>
                    <div className="flex gap-1.5">
                      <div className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] text-primary font-medium">
                        💰 Lançar despesa
                      </div>
                      <div className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] text-primary font-medium">
                        📊 Relatório
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 2 */}
          <ScrollReveal direction="right" delay={100}>
            <div className="relative flex flex-col md:flex-row-reverse items-start md:items-center gap-6 md:gap-12 lg:gap-16 mb-16 md:mb-20 pl-16 md:pl-0">
              <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">
                2
              </div>
              <div className="md:w-1/2 md:text-left md:pl-12 space-y-2">
                <div className="inline-flex items-center gap-2 text-primary">
                  <UserPlus className="h-5 w-5" />
                  <h3 className="text-lg font-extrabold tracking-tight text-foreground">Cadastre-se em segundos</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Crie sua conta com e-mail ou telefone. Sem burocracia, sem configurações complexas.
                </p>
              </div>
              <div className="md:w-1/2 md:pr-12 md:flex md:justify-end">
                <div className="glass-card rounded-2xl p-3 max-w-xs shadow-lg">
                  <div className="rounded-xl bg-muted/50 p-4 space-y-2.5">
                    <p className="text-[11px] font-semibold text-foreground text-center">Criar conta</p>
                    <div className="space-y-1.5">
                      <div className="rounded-lg bg-background/80 border border-border/40 px-2 py-1.5 text-[9px] text-muted-foreground">
                        Nome completo
                      </div>
                      <div className="rounded-lg bg-background/80 border border-border/40 px-2 py-1.5 text-[9px] text-muted-foreground">
                        E-mail
                      </div>
                      <div className="rounded-lg bg-background/80 border border-border/40 px-2 py-1.5 text-[9px] text-muted-foreground">
                        Senha
                      </div>
                    </div>
                    <div className="rounded-lg bg-primary text-primary-foreground text-center text-[9px] font-semibold py-1.5">
                      Começar grátis →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Step 3 */}
          <ScrollReveal direction="left" delay={200}>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 lg:gap-16 mb-16 md:mb-20 pl-16 md:pl-0">
              <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">
                3
              </div>
              <div className="md:w-1/2 md:text-right md:pr-12 space-y-2">
                <div className="inline-flex items-center gap-2 text-primary">
                  <Mic className="h-5 w-5" />
                  <h3 className="text-lg font-extrabold tracking-tight text-foreground">Faça lançamentos</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Envie <span className="text-primary font-semibold border-b-2 border-primary/30">texto</span>,{" "}
                  <span className="text-primary font-semibold border-b-2 border-primary/30">áudio</span> ou{" "}
                  <span className="text-primary font-semibold border-b-2 border-primary/30">foto</span> do recibo. A IA
                  interpreta e lança automaticamente.
                </p>
              </div>
              <div className="md:w-1/2 md:pl-12">
                <div className="glass-card rounded-2xl p-3 max-w-xs shadow-lg">
                  <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-2">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Mic className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div
                            key={i}
                            className="w-[2px] rounded-full bg-primary/60"
                            style={{ height: `${Math.random() * 10 + 4}px` }}
                          />
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
          </ScrollReveal>

          {/* Step 4 */}
          <ScrollReveal direction="right" delay={300}>
            <div className="relative flex flex-col md:flex-row-reverse items-start md:items-center gap-6 md:gap-12 lg:gap-16 pl-16 md:pl-0">
              <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg z-10 ring-4 ring-background">
                4
              </div>
              <div className="md:w-1/2 md:text-left md:pl-12 space-y-2">
                <div className="inline-flex items-center gap-2 text-primary">
                  <FileBarChart className="h-5 w-5" />
                  <h3 className="text-lg font-extrabold tracking-tight text-foreground">Peça relatórios</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Solicite DRE, fluxo de caixa ou qualquer relatório. A IA gera e envia na hora.
                </p>
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
          </ScrollReveal>

          {/* End dot */}
          <div className="absolute left-3.5 md:left-1/2 md:-translate-x-1/2 -bottom-2 h-3 w-3 rounded-full bg-primary/30 ring-4 ring-background" />
        </div>
      </section>

      {/* ===== SEÇÃO 4: FUNCIONALIDADES ===== */}
      <section className="border-y border-border/40">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal direction="up">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  Um sistema completo,{" "}
                  <span className="text-primary relative inline-block">
                    sem a complexidade
                    <svg
                      className="absolute -bottom-1.5 left-0 w-full"
                      viewBox="0 0 200 8"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.3"
                      />
                    </svg>
                  </span>{" "}
                  de um sistema tradicional
                </h2>
              </div>
            </ScrollReveal>

            {/* Feature 1 — Lançamentos */}
            <ScrollReveal direction="left">
              <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
                <div className="space-y-4">
                  <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">
                    Lançamentos
                  </Badge>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                    Lançamento de Receitas e Despesas
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Registre entradas e saídas em segundos, conversando com a IA. Envie um{" "}
                    <span className="text-primary font-semibold border-b-2 border-primary/30">áudio</span>, uma{" "}
                    <span className="text-primary font-semibold border-b-2 border-primary/30">foto</span> do recibo ou
                    simplesmente <span className="text-primary font-semibold border-b-2 border-primary/30">digite</span>{" "}
                    — a IA cuida do resto.
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
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                <div
                                  key={i}
                                  className="w-[2px] rounded-full bg-primary-foreground/70"
                                  style={{ height: `${Math.random() * 10 + 4}px` }}
                                />
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
                      <ChatBubble
                        isBot
                        message="Entendi! Você pagou R$ 350,00 ao fornecedor ABC pela entrega de materiais. Confirmo o lançamento?"
                        time="14:22"
                      />
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
                      <ChatBubble
                        isBot
                        message="✅ Foto analisada! Despesa de R$ 350,00 registrada. Categoria: Materiais."
                        time="14:23"
                      />
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
            </ScrollReveal>

            {/* Feature 2 — Fluxo de Caixa */}
            <ScrollReveal direction="right" delay={100}>
              <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
                <div className="order-2 md:order-1 flex justify-center">
                  <DashboardMockup />
                </div>
                <div className="order-1 md:order-2 space-y-4">
                  <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">
                    Dashboard
                  </Badge>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Fluxo de Caixa</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Visualize a saúde financeira do seu negócio com clareza e previsibilidade. Dashboard completo com
                    gráficos, resumos e indicadores em tempo real.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 3 — Controle de Contas */}
            <ScrollReveal direction="left" delay={100}>
              <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
                <div className="space-y-4">
                  <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">
                    Contas
                  </Badge>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Controle de Contas</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Saiba exatamente o que foi pago, o que está pendente e não perca nenhum vencimento. Status visuais
                    para acompanhar tudo rapidamente.
                  </p>
                </div>
                <div className="flex justify-center">
                  <ContasListMockup />
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 4 — Relatórios */}
            <ScrollReveal direction="right" delay={100}>
              <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
                <div className="order-2 md:order-1 flex justify-center">
                  <PhoneMockup className="scale-90">
                    <ReportsMockup />
                  </PhoneMockup>
                </div>
                <div className="order-1 md:order-2 space-y-4">
                  <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">
                    Relatórios
                  </Badge>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Relatórios Personalizados</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Precisa saber o lucro do mês? O gasto com anúncios? Peça pelo chat e receba na hora. A IA entrega
                    resumos financeiros direto na conversa.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 5 — Integrações */}
            <ScrollReveal direction="left" delay={100}>
              <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div className="space-y-4">
                  <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">
                    Integrações
                  </Badge>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Integração com Plataformas</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Conecte suas vendas e seus custos de tráfego em um só lugar de forma inteligente. Meta Ads, Google
                    Ads, Hotmart, Kiwify e muito mais.
                  </p>
                </div>
                <div className="flex justify-center">
                  <IntegrationsMockup />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 5: PARA QUEM É ===== */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
        <ScrollReveal direction="up">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Para quem é o{" "}
              <span className="text-primary relative inline-block">
                Contabiliza AI
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                </svg>
              </span>
              ?
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Criado para quem precisa de agilidade e não tem tempo para tarefas engessadas.
            </p>
          </div>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              emoji: "🚀",
              title: "Infoprodutores",
              desc: "Controle vendas digitais, comissões e custos de tráfego em um só lugar.",
            },
            {
              emoji: "📢",
              title: "Donos de Agências",
              desc: "Gerencie o financeiro de múltiplos clientes e projetos simultaneamente.",
            },
            {
              emoji: "🛠️",
              title: "Prestadores de Serviço",
              desc: "Organize receitas por projeto e acompanhe pagamentos de clientes.",
            },
            {
              emoji: "🎓",
              title: "Profissionais Liberais",
              desc: "Controle honorários, despesas e tenha relatórios prontos para o contador.",
            },
          ].map((item, index) => (
            <ScrollReveal key={item.title} direction="up" delay={index * 80}>
              <div className="glass-card rounded-2xl p-6 lg:p-7 text-center space-y-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col justify-between h-full">
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 70%)",
                  }}
                />
                <div className="text-4xl mx-auto relative z-10">{item.emoji}</div>
                <h3 className="text-base font-semibold text-foreground relative z-10">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ===== SEÇÃO 6: GESTÃO PESSOAL ===== */}
      <section className="relative border-t border-border/40">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, hsla(25, 95%, 53%, 0.06) 0%, transparent 60%)"
        }} />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24 relative">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="space-y-5">
                <Badge className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[11px]">
                  Incluso em todos os planos
                </Badge>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Como não existe CNPJ forte sem CPF forte, em todos os planos você terá o{" "}
                  <span className="text-primary relative inline-block">
                    Contabiliza AI Pessoal
                    <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                      <path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                    </svg>
                  </span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Controle suas finanças pessoais em paralelo: organize receitas e despesas do CPF, acompanhe faturas dos seus cartões de crédito, acumule milhas e tenha visão total do seu patrimônio — tudo no mesmo sistema, a uma mensagem de distância.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Receitas e Despesas Pessoais", "Faturas de Cartões", "Patrimônio e Investimentos", "Tudo via Chat com IA"].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                      <Check className="h-3 w-3" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={150}>
              <PersonalDashboardMockup />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 7: PLANOS E PREÇOS ===== */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
          <ScrollReveal direction="up">
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                💳 Escolha o plano ideal para o momento do seu{" "}
                <span className="text-primary relative inline-block">
                  negócio
                  <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                    <path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
              </h2>
            </div>
          </ScrollReveal>

          {/* Toggle Mensal / Anual */}
          <ScrollReveal direction="up" delay={50}>
            <div className="flex items-center justify-center gap-2 mt-8 mb-12">
              <button
                onClick={() => setBillingPeriod("mensal")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "mensal"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod("anual")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "anual"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                Anual
                <Badge className="ml-2 bg-green-500/90 text-white text-[10px] px-1.5 py-0 rounded-full border-0">Economia</Badge>
              </button>
            </div>
          </ScrollReveal>

          {/* 3 cards principais */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch px-2">
            <ScrollReveal direction="up" delay={0}>
              <PricingCard
                emoji="🟢"
                title="Plano Start"
                description="Para quem está dando os primeiros passos no digital e quer estruturar a base do jeito certo, sem misturar as contas."
                monthlyPrice={79}
                annualPrice={790}
                billingPeriod={billingPeriod}
                features={[
                  "Até 100 lançamentos/mês",
                  "Até 50 Notas Fiscais/mês",
                  "Gestão Dupla: CPF + CNPJ",
                  "Integração: Vendas e Meta Ads",
                ]}
                buttonLabel="Começar meu teste grátis"
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <PricingCard
                emoji="🚀"
                title="Plano Growth"
                description="Para negócios em aceleração e infoprodutores que precisam de automação financeira para focar em escalar suas campanhas."
                monthlyPrice={129}
                annualPrice={1290}
                billingPeriod={billingPeriod}
                highlighted
                badge="Mais Popular"
                features={[
                  "Até 500 lançamentos/mês",
                  "Até 250 Notas Fiscais/mês",
                  "Gestão Dupla: CPF + CNPJ",
                  "Integração: Vendas e Meta Ads",
                ]}
                buttonLabel="Escalar com o Growth"
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <PricingCard
                emoji="💎"
                title="Plano Pro"
                description="Para operações robustas e marcas já consolidadas no mercado que exigem alta capacidade de processamento."
                monthlyPrice={229}
                annualPrice={2290}
                billingPeriod={billingPeriod}
                features={[
                  "Lançamentos Ilimitados",
                  "Até 1.500 Notas Fiscais/mês",
                  "Gestão Dupla: CPF + CNPJ",
                  "Integração: Vendas e Meta Ads",
                ]}
                buttonLabel="Dominar com o Pro"
              />
            </ScrollReveal>
          </div>

          {/* Enterprise — banner sutil abaixo */}
          <ScrollReveal direction="up" delay={300}>
            <div className="max-w-5xl mx-auto mt-10 px-2">
              <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 border border-border/60">
                <div className="text-3xl shrink-0">🏢</div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold text-foreground mb-1">Enterprise / Alto Volume</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sua operação emite mais de 1.500 Notas Fiscais por mês ou sua equipe precisa de acesso via API? Nós montamos uma infraestrutura dedicada para o seu tamanho.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full px-6 shrink-0"
                  onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Falar com um Especialista
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== SEÇÃO 8: FAQ ===== */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-24">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                ❓ Perguntas{" "}
                <span className="text-primary relative inline-block">
                  Frequentes
                  <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                    <path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: 'O que o sistema considera como "lançamento" (transação)?',
                  a: 'Cada movimentação financeira registrada no sistema é um lançamento. Isso inclui as vendas que entram pelas plataformas (Hotmart, Kiwify, etc.), os pagamentos de anúncios no Meta Ads, o pagamento de um fornecedor e as suas despesas pessoais (já que você controla CNPJ e CPF no mesmo lugar). Se o seu volume aumentar no meio do mês, você pode fazer o upgrade de plano a qualquer momento com apenas um clique.',
                },
                {
                  q: 'Como funciona essa gestão de CNPJ e CPF juntos? Vai misturar tudo?',
                  a: 'Pelo contrário, vai separar do jeito certo! O lema "Não existe CNPJ forte com CPF fraco" significa que você terá as duas visões consolidadas na mesma conta, mas organizadas de forma independente. Você saberá exatamente o que é dinheiro da empresa e o que é o seu pró-labore ou despesa pessoal, acabando com a confusão na hora de fechar o mês.',
                },
                {
                  q: 'Gasto muito com Meta Ads no cartão de crédito. O Contabiliza AI me ajuda com isso?',
                  a: 'Com certeza. O sistema faz a conciliação inteligente das faturas dos seus cartões de crédito PJ cruzando com os seus gastos em anúncios. Inclusive, ao organizar essas faturas de alto volume de tráfego aliado à sua visão de pessoa física (CPF), fica muito mais fácil ter previsibilidade para gerenciar os pontos e as milhas aéreas geradas pelos gastos da empresa, transformando esse custo em benefício real.',
                },
                {
                  q: 'O Contabiliza AI substitui o meu contador?',
                  a: 'Não. Nós somos o melhor amigo do seu contador. O Contabiliza AI organiza a bagunça diária, emite as notas fiscais no automático e categoriza suas despesas com Inteligência Artificial. No final do mês, seu contador recebe tudo mastigado, em formato de relatório ou exportação, evitando multas e dores de cabeça com a Receita Federal.',
                },
                {
                  q: 'E se eu ultrapassar o limite de notas fiscais do meu plano? Minhas vendas vão parar?',
                  a: 'De forma alguma! Suas notas continuarão sendo emitidas normalmente. Quando você atingir 100% do limite do seu plano, o sistema enviará um aviso amigável sugerindo o upgrade para a próxima categoria, garantindo que sua operação (e seus lançamentos) nunca travem por questões de sistema.',
                },
                {
                  q: 'É seguro conectar minhas contas e plataformas?',
                  a: 'Totalmente. O Contabiliza AI utiliza integrações oficiais (APIs) e leitura de dados bancários com criptografia de ponta. A nossa Inteligência Artificial apenas lê e categoriza os dados para facilitar a sua vida, sem permissão para realizar transferências ou movimentações não autorizadas.',
                },
              ].map((item, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 60}>
                  <AccordionItem value={`faq-${i}`} className="glass-card rounded-2xl border border-border/60 px-5 overflow-hidden">
                    <AccordionTrigger className="text-sm font-semibold text-foreground text-left py-4 hover:no-underline gap-3">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                </ScrollReveal>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <ScrollReveal direction="up">
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
                <button onClick={() => navigate("/login")} className="hover:text-foreground transition-colors">
                  Entrar
                </button>
                <button onClick={() => navigate("/register")} className="hover:text-foreground transition-colors">
                  Criar Conta
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} ContabilizaAI. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </ScrollReveal>
    </div>
  );
};

export default LandingPage;
