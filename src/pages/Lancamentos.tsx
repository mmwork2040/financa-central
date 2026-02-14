
import React from "react";
import { LancamentosProvider } from "@/contexts/LancamentosContext";
import { LancamentosContainer } from "@/components/lancamentos/LancamentosContainer";

const Lancamentos = () => {
  return (
    <div className="space-y-6">
      <LancamentosProvider>
        <LancamentosContainer />
      </LancamentosProvider>
    </div>
  );
};

export default Lancamentos;
