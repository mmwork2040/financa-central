
import React, { useState, useEffect } from "react";
import { UsersList } from "@/components/users/UsersList";
import { UserForm } from "@/components/users/UserForm";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { User } from "@/types/user.types";
import { useUsersContext } from "@/contexts/UsersContext";
import { UsersSearch } from "@/components/users/UsersSearch";
import { exportToCSV, exportToPDF } from "@/components/users/UsersExport";

export const UsersContainer = () => {
  const { 
    filteredUsers, 
    loading, 
    saving, 
    deleting, 
    saveUser, 
    deleteUser,
    getPermissaoLabel,
    getPermissaoClass
  } = useUsersContext();
  
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV(filteredUsers, getPermissaoLabel);
    } else {
      exportToPDF(filteredUsers, getPermissaoLabel, getPermissaoClass);
    }
  };

  return (
    <>
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
    </>
  );
};
