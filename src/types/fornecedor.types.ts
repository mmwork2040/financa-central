
export interface Fornecedor {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
}

export const initialFornecedor: Fornecedor = {
  id: "",
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  ativo: true,
};
