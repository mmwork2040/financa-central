
import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { UserCog } from "lucide-react";
import { UsersProvider } from "@/contexts/UsersContext";
import { UsersContainer } from "@/components/users/UsersContainer";
import { useAuth } from "@/contexts/AuthContext";

const Users = () => {
  const { canPerformAction } = useAuth();
  const canIncluir = canPerformAction("users", "pode_incluir");

  return (
    <div className="space-y-6">
      <UsersProvider>
        <PageHeader 
          title="Usuários"
          description="Gerencie os usuários do sistema."
          buttonLabel="Novo Usuário"
          onButtonClick={() => document.dispatchEvent(new CustomEvent('open-user-modal'))}
          icon={UserCog}
          showButton={canIncluir}
        />
        <UsersContainer />
      </UsersProvider>
    </div>
  );
};

export default Users;
