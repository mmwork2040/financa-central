
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  nome: string;
  email: string;
  permissao: string;
  created_at: string;
}

interface UsersListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export const UsersList = ({ users, onEdit, onDelete }: UsersListProps) => {
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
        return "bg-red-100 text-red-800";
      case "editor":
        return "bg-blue-100 text-blue-800";
      case "leitura":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Permissão</TableHead>
            <TableHead>Data de Cadastro</TableHead>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.nome}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissaoClass(user.permissao)}`}>
                  {getPermissaoLabel(user.permissao)}
                </span>
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex justify-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(user)}
                    className="h-8 w-8 text-blue-500 hover:text-blue-600"
                  >
                    <span className="sr-only">Editar</span>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(user.id)} 
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <span className="sr-only">Excluir</span>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
