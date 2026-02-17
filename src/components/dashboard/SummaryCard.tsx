
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${iconColor}`}>{displayValue}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
