import React from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import dashImage from "@/assets/landing-dash-example.webp";
import dashImage2 from "@/assets/landing-dash-001.webp";

const DashboardMockup = () => {
  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Main dashboard image */}
      <div className="glass-card rounded-2xl p-2 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 70%)"
        }} />
        <img 
          src={dashImage} 
          alt="Dashboard do Contabiliza AI mostrando fluxo de caixa" 
          className="w-full rounded-xl"
          loading="lazy"
        />
        {/* Tooltip flutuante */}
        <div className="absolute top-4 right-4 glass-card rounded-xl px-3 py-2 shadow-lg text-xs">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="font-semibold text-foreground">+23%</span>
            <span className="text-muted-foreground">vs mês anterior</span>
          </div>
        </div>
      </div>
      
      {/* Secondary image */}
      <div className="glass-card rounded-2xl p-2 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <img 
          src={dashImage2} 
          alt="Visão detalhada do dashboard financeiro" 
          className="w-full rounded-xl"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default DashboardMockup;
