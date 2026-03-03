
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useValuesVisibility, maskValue } from "@/contexts/ValuesVisibilityContext";

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  isCurrency?: boolean;
}

export const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  isCurrency = false,
}: SummaryCardProps) => {
  const { visible } = useValuesVisibility();
  const displayValue = isCurrency ? maskValue(value, visible) : value;

  return (
    <Card className="group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{title}</CardTitle>
        <div className="rounded-full bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
          <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className={`text-lg sm:text-2xl font-bold ${iconColor} truncate`}>{displayValue}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{description}</p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
