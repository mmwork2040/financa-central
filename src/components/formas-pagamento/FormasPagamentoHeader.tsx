
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FormasPagamentoHeaderProps {
  onNewFormaPagamentoClick: () => void;
}

const FormasPagamentoHeader: React.FC<FormasPagamentoHeaderProps> = ({ 
  onNewFormaPagamentoClick 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold">Formas de Pagamento</h1>
        <p className="text-muted-foreground">Gerencie as formas de pagamento do sistema.</p>
      </div>
      <Button onClick={onNewFormaPagamentoClick}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Forma de Pagamento
      </Button>
    </div>
  );
};

export default FormasPagamentoHeader;
