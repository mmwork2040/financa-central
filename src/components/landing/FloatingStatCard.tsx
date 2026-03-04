import React from "react";

interface FloatingStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  delay?: string;
}

const FloatingStatCard = ({ icon, label, value, className = "", delay = "0s" }: FloatingStatCardProps) => {
  return (
    <div
      className={`glass-card rounded-2xl px-4 py-3 shadow-xl animate-float ${className}`}
      style={{
        animationDelay: delay,
        background: "radial-gradient(ellipse at 50% 0%, hsla(25, 95%, 53%, 0.06) 0%, transparent 70%), rgba(255,255,255,0.85)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default FloatingStatCard;
