import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Star, MessageCircle } from "lucide-react";

interface PricingCardProps {
  title: string;
  emoji: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  buttonLabel: string;
  // Normal plan props
  monthlyPrice?: number;
  annualPrice?: number;
  billingPeriod?: "mensal" | "anual";
  // Enterprise
  isEnterprise?: boolean;
  enterpriseDescription?: string;
  whatsappUrl?: string;
}

const PricingCard = ({
  title,
  emoji,
  description,
  features,
  highlighted = false,
  badge,
  buttonLabel,
  monthlyPrice,
  annualPrice,
  billingPeriod = "anual",
  isEnterprise = false,
  enterpriseDescription,
  whatsappUrl,
}: PricingCardProps) => {
  const navigate = useNavigate();

  const currentPrice = billingPeriod === "anual" ? annualPrice : monthlyPrice;
  const altPrice = billingPeriod === "anual" ? monthlyPrice : annualPrice;
  const altLabel = billingPeriod === "anual" ? "mensal" : "anual";

  const handleClick = () => {
    if (isEnterprise && whatsappUrl) {
      window.open(whatsappUrl, "_blank");
    } else {
      navigate("/register");
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 group h-full ${
        highlighted
          ? "glass-card border-2 border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20 hover:shadow-2xl hover:shadow-primary/20"
          : "glass-card hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      {highlighted && (
        <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{
          background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.08) 0%, transparent 60%)"
        }} />
      )}

      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold gap-1.5 rounded-full shadow-lg shadow-primary/30 whitespace-nowrap border-2 border-background">
            <Star className="h-3 w-3 fill-current" />
            {badge}
          </Badge>
        </div>
      )}

      <div className="mb-4 relative z-10">
        <div className="text-2xl mb-1">{emoji}</div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>

      {!isEnterprise && currentPrice != null && (
        <div className="mb-5 relative z-10">
          <span className="text-3xl font-extrabold text-foreground">
            R$ {currentPrice?.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-muted-foreground ml-1">/ mês</span>
          {altPrice != null && (
            <p className="text-xs text-muted-foreground mt-1">
              ou R$ {altPrice?.toFixed(2).replace('.', ',')} no plano {altLabel}
            </p>
          )}
        </div>
      )}

      {!isEnterprise && (
        <Badge variant="outline" className="w-fit mb-5 text-primary border-primary/30 text-[11px] rounded-full relative z-10">
          30 dias grátis
        </Badge>
      )}

      {isEnterprise && enterpriseDescription && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1 relative z-10">
          {enterpriseDescription}
        </p>
      )}

      {!isEnterprise && (
        <ul className="space-y-2.5 mb-6 flex-1 relative z-10">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={handleClick}
        className={`w-full relative z-10 rounded-full ${highlighted ? "shadow-lg shadow-primary/20" : ""}`}
        variant={highlighted ? "default" : "outline"}
        size="lg"
      >
        {isEnterprise && <MessageCircle className="mr-2 h-4 w-4" />}
        {buttonLabel}
        {!isEnterprise && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
};

export default PricingCard;
