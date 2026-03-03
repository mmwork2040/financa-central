
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg?: string;
  isCurrency?: boolean;
}

export const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBg = "bg-primary/10",
  isCurrency = false,
}: SummaryCardProps) => {
  const { visible } = useValuesVisibility();
  const displayValue = isCurrency ? maskValue(value, visible) : value;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center justify-center h-10 w-10 rounded-full ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</span>
        </div>
        <div className={`text-lg sm:text-2xl font-bold ${iconColor} truncate`}>{displayValue}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">{description}</p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
