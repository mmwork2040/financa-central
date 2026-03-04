import React from "react";
import { Wifi, Battery, Signal } from "lucide-react";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

const PhoneMockup = ({ children, className = "" }: PhoneMockupProps) => {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 280, maxWidth: "100%" }}>
      {/* Glow effect */}
      <div className="absolute -inset-4 rounded-[3rem] opacity-30 blur-2xl pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 30%, hsla(187, 92%, 41%, 0.25) 0%, transparent 70%)"
      }} />
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-foreground/20 bg-background shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/20 rounded-b-2xl z-10" />
        
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-7 pb-1 text-[10px] text-muted-foreground">
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-3 w-3" />
          </div>
        </div>
        
        {/* Content */}
        <div className="min-h-[420px] max-h-[480px] overflow-hidden">
          {children}
        </div>
        
        {/* Home indicator */}
        <div className="flex justify-center py-2">
          <div className="w-28 h-1 rounded-full bg-foreground/20" />
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
