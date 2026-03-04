import React from "react";
import { Users, DollarSign, Star, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "+500", label: "Empresas ativas" },
  { icon: DollarSign, value: "R$ 50M", label: "Gerenciados na plataforma" },
  { icon: Star, value: "4.9", label: "Avaliação dos clientes" },
  { icon: TrendingUp, value: "12x", label: "Mais rápido que planilhas" },
];

const SocialProofSection = () => {
  return (
    <section className="relative border-y border-border/40 overflow-hidden">
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, hsla(25, 95%, 53%, 0.06) 0%, transparent 60%)"
      }} />
      <div className="container mx-auto px-4 py-16 relative">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase">Resultados reais</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
            Números que comprovam a eficiência
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-6 text-center hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.08) 0%, transparent 70%)"
              }} />
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-3 relative z-10" />
              <p className="text-3xl font-extrabold text-foreground relative z-10">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1 relative z-10">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
