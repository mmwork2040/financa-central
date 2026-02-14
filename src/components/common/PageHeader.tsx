
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  buttonLabel, 
  onButtonClick 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onButtonClick}>
        <Plus className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );
};

export default PageHeader;
