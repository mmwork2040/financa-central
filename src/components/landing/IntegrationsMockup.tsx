import React from "react";
import { BarChart3 } from "lucide-react";

const platforms = [
  { name: "Meta Ads", color: "bg-blue-500", glow: "shadow-blue-500/30" },
  { name: "Google Ads", color: "bg-green-500", glow: "shadow-green-500/30" },
  { name: "Hotmart", color: "bg-orange-500", glow: "shadow-orange-500/30" },
  { name: "Kiwify", color: "bg-purple-500", glow: "shadow-purple-500/30" },
  { name: "Shopify", color: "bg-emerald-500", glow: "shadow-emerald-500/30" },
  { name: "Stripe", color: "bg-indigo-500", glow: "shadow-indigo-500/30" },
];

const IntegrationsMockup = () => {
  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 70%)"
      }} />
      <p className="text-xs font-semibold text-foreground mb-4 text-center relative z-10">Plataformas Conectadas</p>
      <div className="flex justify-center mb-5 relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center shadow-lg shadow-primary/20">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 relative z-10">
        {platforms.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-1.5 rounded-xl bg-background/60 border border-border/50 p-3 hover:-translate-y-0.5 transition-all">
            <div className={`h-10 w-10 rounded-xl ${p.color} flex items-center justify-center text-white text-xs font-bold shadow-lg ${p.glow}`}>
              {p.name.charAt(0)}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsMockup;
