
import React, { useState, useEffect } from "react";
import { UsersList } from "@/components/users/UsersList";
import { UserForm } from "@/components/users/UserForm";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { User } from "@/types/user.types";
import { useUsersContext } from "@/contexts/UsersContext";
import { UsersSearch } from "@/components/users/UsersSearch";
import { exportToCSV, exportToPDF } from "@/components/users/UsersExport";
import { useAuth } from "@/contexts/AuthContext";
import { PendingExitRequests } from "@/components/solicitacoes/PendingExitRequests";
import { MyExitRequests } from "@/components/solicitacoes/MyExitRequests";
import { useSolicitacoesSaida } from "@/hooks/useSolicitacoesSaida";

export const UsersContainer = () => {
  const { user: authUser, empresaId } = useAuth();
  const currentUserId = authUser?.id;
  const { 
    filteredUsers, 
    loading, 
    saving, 
    deleting, 
    saveUser, 
    deleteUser,
    revokeUser,
    isSuperAdmin,
    getPermissaoLabel,
    getPermissaoClass
  } = useUsersContext();
  
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openRevokeModal, setOpenRevokeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenNewUserModal = () => {
      handleOpenModal();
    };
    
    document.addEventListener('open-user-modal', handleOpenNewUserModal);
    
    return () => {
      document.removeEventListener('open-user-modal', handleOpenNewUserModal);
    };
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setSelectedId(user.id);
    } else {
      setSelectedUser(null);
      setSelectedId(null);
    }
    setOpenModal(true);
  };

  const handleOpenDeleteModal = (id: string) => {
    setSelectedId(id);
    setOpenDeleteModal(true);
  };

  const handleOpenRevokeModal = (userId: string, empresaId: string) => {
    setSelectedId(userId);
    setSelectedEmpresaId(empresaId);
    setOpenRevokeModal(true);
  };

  const handleSave = async (formData: any) => {
    const success = await saveUser(formData, selectedId);
    if (success) {
      setOpenModal(false);
      setSelectedUser(null);
      setSelectedId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    
    const success = await deleteUser(selectedId);
    if (success) {
      setOpenDeleteModal(false);
      setSelectedId(null);
    }
  };

  const handleRevoke = async () => {
    if (!selectedId || !selectedEmpresaId) return;
    
    const success = await revokeUser(selectedId, selectedEmpresaId);
    if (success) {
      setOpenRevokeModal(false);
      setSelectedId(null);
      setSelectedEmpresaId(null);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV(filteredUsers, getPermissaoLabel);
    } else {
      exportToPDF(filteredUsers, getPermissaoLabel, getPermissaoClass);
    }
  };

  const {
    myRequests,
    pendingRequests,
    isAdmin: isExitAdmin,
    approveRequest,
    rejectRequest,
    cancelRequest,
    actionLoading: exitLoading,
  } = useSolicitacoesSaida();

  return (
    <>
      {/* Pending Exit Requests for admins */}
      {isExitAdmin && pendingRequests.length > 0 && (
        <PendingExitRequests
          requests={pendingRequests}
          onApprove={approveRequest}
          onReject={rejectRequest}
          onCancel={cancelRequest}
          loading={exitLoading}
        />
      )}

      {/* My Exit Requests */}
      {myRequests.length > 0 && (
        <MyExitRequests
          requests={myRequests}
          onCancel={cancelRequest}
          loading={exitLoading}
          currentEmpresaId={empresaId || undefined}
        />
      )}

      <UsersSearch onExport={handleExport} />
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <UsersList 
          users={filteredUsers} 
          onEdit={handleOpenModal} 
          onDelete={handleOpenDeleteModal}
          onRevoke={handleOpenRevokeModal}
          isSuperAdmin={isSuperAdmin}
          currentUserId={currentUserId}
        />
      )}
      
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Total de registros: {filteredUsers.length}
        </p>
      </div>

      {/* User Form Modal */}
      <UserForm
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleSave}
        selectedUser={selectedUser}
        loading={saving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUserDialog
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Revoke Access Confirmation Modal */}
      <DeleteUserDialog
        isOpen={openRevokeModal}
        onClose={() => setOpenRevokeModal(false)}
        onConfirm={handleRevoke}
        loading={deleting}
        title="Revogar Acesso"
        description="Tem certeza que deseja revogar o acesso deste usuário à empresa? Ele perderá acesso a todos os dados desta empresa."
        confirmLabel="Revogar"
      />
    </>
  );
};
