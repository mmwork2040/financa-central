
import React from "react";
import { LancamentosProvider } from "@/contexts/LancamentosContext";
import { LancamentosContainer } from "@/components/lancamentos/LancamentosContainer";
import { ValuesVisibilityProvider } from "@/contexts/ValuesVisibilityContext";

const Lancamentos = () => {
  return (
    <div className="space-y-6">
      <LancamentosProvider>
        <ValuesVisibilityProvider>
          <LancamentosContainer />
        </ValuesVisibilityProvider>
      </LancamentosProvider>
    </div>
  );
};

export default Lancamentos;
