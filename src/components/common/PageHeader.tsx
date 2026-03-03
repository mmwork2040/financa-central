
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
  icon?: LucideIcon;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  buttonLabel, 
  onButtonClick,
  showButton = true,
  icon: Icon,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {Icon && (
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      </div>
      {showButton && buttonLabel && onButtonClick && (
        <Button size="sm" onClick={onButtonClick}>
          <Plus className="mr-1.5 h-4 w-4" />
          {buttonLabel}
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
