import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

type Direction = "up" | "left" | "right" | "scale";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}

const transformMap: Record<Direction, string> = {
  up: "translateY(40px)",
  left: "translateX(-40px)",
  right: "translateX(40px)",
  scale: "scale(0.92)",
};

const ScrollReveal = ({ children, direction = "up", delay = 0, className }: ScrollRevealProps) => {
  const ref = useScrollReveal(0.15);

  return (
    <div
      ref={ref}
      className={cn("scroll-reveal", className)}
      style={{
        transform: transformMap[direction],
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
