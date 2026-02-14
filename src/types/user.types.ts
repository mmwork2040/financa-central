
export interface User {
  id: string;
  nome: string;
  email: string;
  permissao: string;
  created_at: string;
}

export type FormData = {
  nome: string;
  email: string;
  senha?: string;
  permissao: string;
};
