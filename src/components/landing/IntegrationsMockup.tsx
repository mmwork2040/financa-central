import React from "react";
import { BarChart3 } from "lucide-react";

const platforms = [
  { name: "Meta Ads", color: "bg-blue-500" },
  { name: "Google Ads", color: "bg-green-500" },
  { name: "Hotmart", color: "bg-orange-500" },
  { name: "Kiwify", color: "bg-purple-500" },
  { name: "Shopify", color: "bg-emerald-500" },
  { name: "Stripe", color: "bg-indigo-500" },
];

const IntegrationsMockup = () => {
  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-md">
      <p className="text-xs font-semibold text-foreground mb-4 text-center">Plataformas Conectadas</p>
      <div className="flex justify-center mb-5">
        <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {platforms.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-1.5 rounded-xl bg-background/60 border border-border/50 p-3">
            <div className={`h-8 w-8 rounded-lg ${p.color} flex items-center justify-center text-white text-[10px] font-bold`}>
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
