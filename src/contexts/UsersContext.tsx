
import React, { createContext, useContext, ReactNode } from "react";
import { useUsers, User, FormData } from "@/hooks/useUsers";

interface UsersContextType {
  users: User[];
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  saveUser: (formData: FormData, selectedId: string | null) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  filteredUsers: User[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getPermissaoLabel: (permissao: string) => string;
  getPermissaoClass: (permissao: string) => string;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider = ({ children }: UsersProviderProps) => {
  const { users, loading, saving, deleting, saveUser, deleteUser } = useUsers();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredUsers = users.filter(user => 
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
    loading,
    saving,
    deleting,
    saveUser,
    deleteUser,
    filteredUsers,
    searchQuery,
    setSearchQuery,
    getPermissaoLabel,
    getPermissaoClass
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

export const useUsersContext = (): UsersContextType => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsersContext must be used within a UsersProvider");
  }
  return context;
};
