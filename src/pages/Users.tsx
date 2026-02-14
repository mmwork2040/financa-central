
import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { UsersProvider } from "@/contexts/UsersContext";
import { UsersContainer } from "@/components/users/UsersContainer";

const Users = () => {
  return (
    <div className="space-y-6">
      <UsersProvider>
        <PageHeader 
          title="Usuários"
          description="Gerencie os usuários do sistema."
          buttonLabel="Novo Usuário"
          onButtonClick={() => document.dispatchEvent(new CustomEvent('open-user-modal'))}
        />
        <UsersContainer />
      </UsersProvider>
    </div>
  );
};

export default Users;
