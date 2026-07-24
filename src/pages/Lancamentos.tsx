
import React from "react";
import { LancamentosProvider } from "@/contexts/LancamentosContext";
import { LancamentosContainer } from "@/components/lancamentos/LancamentosContainer";
import { ValuesVisibilityProvider } from "@/contexts/ValuesVisibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import FeatureBlocked from "@/components/common/FeatureBlocked";

const Lancamentos = () => {
  const { isSuperAdmin, assinaturaStatus, isTrialActive } = useAuth();
  const expired =
    !isSuperAdmin &&
    (["vencido", "expired", "cancelled"].includes(assinaturaStatus) ||
      (assinaturaStatus === "trial" && !isTrialActive));

  if (expired) {
    return (
      <FeatureBlocked
        title="Lançamentos indisponíveis"
        description="Seu período de teste expirou ou sua assinatura está inativa. Faça upgrade para continuar registrando lançamentos."
      />
    );
  }

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
