
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import TransactionForm from "@/components/dashboard/TransactionForm";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency, formatDate } from "@/utils/formatters";

const Dashboard = () => {
  const { isAuthenticated } = useAuth(); // Update to use only what exists in AuthContextType
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { loading, summary, lancamentosRecentes, dataFluxo, fetchDashboardData } = useDashboardData();

  // Handler for opening the new transaction modal
  const handleNewTransactionClick = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Página Inicial"
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
          
          <div className="grid gap-4 md:grid-cols-2">
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

      {/* Transaction form modal */}
      <TransactionForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
