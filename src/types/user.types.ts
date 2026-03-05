
export interface User {
  id: string;
  nome: string;
  email: string;
  permissao: string;
  created_at: string;
  empresa_id?: string | null;
  empresa_nome?: string | null;
  is_super_admin?: boolean;
  assinatura_status?: string;
}

export type FormData = {
  nome: string;
  email: string;
  senha?: string;
  permissao: string;
};
