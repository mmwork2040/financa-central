import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ConfiguracaoFiscal from "@/components/configuracoes/ConfiguracaoFiscal";

interface FiscalOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
}

const FiscalOnboardingDialog = ({ open, onOpenChange, empresaId }: FiscalOnboardingDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Configuração Fiscal</DialogTitle>
          <DialogDescription className="sr-only">
            Configure os dados fiscais da sua empresa para emitir notas fiscais.
          </DialogDescription>
        </DialogHeader>
        <ConfiguracaoFiscal
          empresaId={empresaId}
          isWizard
          onComplete={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FiscalOnboardingDialog;
