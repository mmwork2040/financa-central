import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Star } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  highlighted?: boolean;
  badge?: string;
}

const features = [
  "Lançamentos ilimitados",
  "Chat com IA",
  "Dashboard completo",
  "Relatórios personalizados",
  "Multi-empresa",
  "Suporte prioritário",
];

const PricingCard = ({ title, price, period, description, highlighted = false, badge }: PricingCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 overflow-hidden group ${
        highlighted
          ? "glass-card border-2 border-primary shadow-xl shadow-primary/10 scale-[1.03] hover:shadow-2xl hover:shadow-primary/20"
          : "glass-card hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      {/* Radial tint for highlighted */}
      {highlighted && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.08) 0%, transparent 60%)"
        }} />
      )}

      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs gap-1.5 rounded-full shadow-lg shadow-primary/30 whitespace-nowrap">
            <Star className="h-3 w-3 fill-current" />{badge}
          </Badge>
        </div>
      )}

      <div className="mb-4 relative z-10">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="mb-5 relative z-10">
        <span className="text-3xl font-extrabold text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground ml-1">/ {period}</span>
      </div>

      <Badge variant="outline" className="w-fit mb-5 text-primary border-primary/30 text-[11px] rounded-full relative z-10">
        30 dias grátis
      </Badge>

      <ul className="space-y-2.5 mb-6 flex-1 relative z-10">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        onClick={() => navigate("/register")}
        className={`w-full relative z-10 rounded-full ${highlighted ? "shadow-lg shadow-primary/20" : ""}`}
        variant={highlighted ? "default" : "outline"}
        size="lg"
      >
        Começar teste grátis
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default PricingCard;
