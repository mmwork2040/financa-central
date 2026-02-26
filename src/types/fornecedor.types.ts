
export interface Fornecedor {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
}

export const initialFornecedor: Fornecedor = {
  id: "",
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  ativo: true,
};
