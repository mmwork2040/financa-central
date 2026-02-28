import React from "react";
import { Code2 } from "lucide-react";
import N8nJsonTemplates from "@/components/configuracoes/N8nJsonTemplates";

const N8nTemplates = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10">
            <Code2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">n8n Templates</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Templates JSON para integração com n8n</p>
      </div>
      <N8nJsonTemplates />
    </div>
  );
};

export default N8nTemplates;
