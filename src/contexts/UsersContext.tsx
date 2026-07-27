
import React, { createContext, useContext, ReactNode } from "react";
import { useUsers, User, FormData } from "@/hooks/useUsers";

interface UsersContextType {
  users: User[];
  fetchUsers: () => Promise<void>;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  saveUser: (formData: FormData, selectedId: string | null) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  revokeUser: (userId: string, empresaId: string) => Promise<boolean>;
  isSuperAdmin: boolean;
  filteredUsers: User[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  getPermissaoLabel: (permissao: string) => string;
  getPermissaoClass: (permissao: string) => string;
}

const defaultContext: UsersContextType = {
  users: [],
  fetchUsers: async () => {},
  loading: true,
  saving: false,
  deleting: false,
  saveUser: async () => false,
  deleteUser: async () => false,
  revokeUser: async () => false,
  isSuperAdmin: false,
  filteredUsers: [],
  searchQuery: "",
  setSearchQuery: () => {},
  statusFilter: "todos",
  setStatusFilter: () => {},
  getPermissaoLabel: () => "",
  getPermissaoClass: () => "",
};

const UsersContext = createContext<UsersContextType>(defaultContext);

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider = ({ children }: UsersProviderProps) => {
  const { users, loading, saving, deleting, saveUser, deleteUser, revokeUser, isSuperAdmin, fetchUsers } = useUsers();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Hide super admins from non-super-admin users
  const visibleUsers = isSuperAdmin ? users : users.filter(u => !u.is_super_admin);

  const filteredUsers = visibleUsers.filter(user => 
    user.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissaoLabel = (permissao: string): string => {
    switch (permissao) {
      case "admin":
        return "Administrador";
      case "editor":
        return "Editor";
      case "leitura":
        return "Leitura";
      default:
        return "Desconhecido";
    }
  };

  const getPermissaoClass = (permissao: string): string => {
    switch (permissao) {
      case "admin":
        return "admin";
      case "editor":
        return "editor";
      case "leitura":
        return "leitura";
      default:
        return "";
    }
  };

  const value = {
    users,
    fetchUsers,
    loading,
    saving,
    deleting,
    saveUser,
    deleteUser,
    revokeUser,
    isSuperAdmin,
    filteredUsers,
    searchQuery,
    setSearchQuery,
    getPermissaoLabel,
    getPermissaoClass
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

export const useUsersContext = (): UsersContextType => {
  return useContext(UsersContext);
};
