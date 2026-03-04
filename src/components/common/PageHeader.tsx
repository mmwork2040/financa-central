
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
  /** Word(s) to highlight with primary color + underline emphasis */
  emphasis?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  buttonLabel, 
  onButtonClick,
  showButton = true,
  icon: Icon,
  emphasis,
}) => {
  const renderTitle = () => {
    if (!emphasis) return title;
    const idx = title.toLowerCase().indexOf(emphasis.toLowerCase());
    if (idx === -1) return title;
    const before = title.slice(0, idx);
    const match = title.slice(idx, idx + emphasis.length);
    const after = title.slice(idx + emphasis.length);
    return (
      <>
        {before}
        <span className="text-primary relative">
          {match}
          <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
            <path d="M2 5C40 1 80 1 100 4C120 7 160 3 198 5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
          </svg>
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {Icon && (
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">{renderTitle()}</h1>
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
