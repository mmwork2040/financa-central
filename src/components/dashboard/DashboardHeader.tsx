
import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  onNewTransactionClick?: () => void;
  icon?: LucideIcon;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  onNewTransactionClick,
  icon: Icon = Plus 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">Visualize e gerencie suas informações financeiras.</p>
      </div>
      {onNewTransactionClick && (
        <Button onClick={onNewTransactionClick}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      )}
    </div>
  );
};

export default DashboardHeader;
