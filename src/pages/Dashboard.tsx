
import React from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { LancamentosFormDialog } from "@/components/lancamentos/LancamentosFormDialog";
import { LancamentosProvider, useLancamentosContext } from "@/contexts/LancamentosContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ValuesVisibilityProvider } from "@/contexts/ValuesVisibilityContext";

const DashboardContent = () => {
  const { isAuthenticated, userProfile } = useAuth();
  const { loading, summary, lancamentosRecentes, dataFluxo, fetchDashboardData } = useDashboardData();
  const { handleOpenModal } = useLancamentosContext();

  const handleNewTransactionClick = () => {
    handleOpenModal();
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title={`Olá, ${userProfile?.nome || 'Usuário'}!`}
        onNewTransactionClick={handleNewTransactionClick}
        icon={Plus}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Carregando dados...</p>
        </div>
      ) : (
        <>
          <DashboardSummary 
            summary={summary}
            formatCurrency={formatCurrency}
          />
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <CashFlowChart 
              data={dataFluxo}
              formatCurrency={formatCurrency}
            />
            
            <RecentTransactions 
              lancamentos={lancamentosRecentes}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </div>
        </>
      )}

      <LancamentosFormDialog />
    </div>
  );
};

const Dashboard = () => {
  return (
    <LancamentosProvider>
      <ValuesVisibilityProvider>
        <DashboardContent />
      </ValuesVisibilityProvider>
    </LancamentosProvider>
  );
};

export default Dashboard;
