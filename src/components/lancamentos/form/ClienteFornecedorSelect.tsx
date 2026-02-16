
import { Cliente, Fornecedor } from "@/contexts/LancamentosContext";
import { GenericSelect } from "./GenericSelect";

interface ClienteFornecedorSelectProps {
  tipo: "despesa" | "receita" | "investimento";
  clienteId: string | null;
  fornecedorId: string | null;
  onClienteChange: (value: string) => void;
  onFornecedorChange: (value: string) => void;
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  onRefreshClientes?: () => void;
  onRefreshFornecedores?: () => void;
}

export const ClienteFornecedorSelect = ({ 
  tipo, 
  clienteId, 
  fornecedorId,
  onClienteChange,
  onFornecedorChange,
  clientes,
  fornecedores,
  onRefreshClientes,
  onRefreshFornecedores,
}: ClienteFornecedorSelectProps) => {
  if (tipo === "receita") {
    return (
      <GenericSelect
        label="Cliente"
        value={clienteId}
        onChange={onClienteChange}
        options={clientes}
        noneOptionValue="no-client"
        placeholder="Selecione o cliente"
        quickAdd={onRefreshClientes ? {
          title: "Cliente",
          table: "clientes",
          fields: [
            { name: "nome", label: "Nome", required: true },
            { name: "cpf_cnpj", label: "CPF/CNPJ", required: false },
            { name: "telefone", label: "Telefone", required: false },
            { name: "email", label: "Email", required: false },
          ],
          onSuccess: onRefreshClientes,
        } : undefined}
      />
    );
  } else {
    return (
      <GenericSelect
        label="Fornecedor"
        value={fornecedorId}
        onChange={onFornecedorChange}
        options={fornecedores}
        noneOptionValue="no-supplier"
        placeholder="Selecione o fornecedor"
        quickAdd={onRefreshFornecedores ? {
          title: "Fornecedor",
          table: "fornecedores",
          fields: [
            { name: "nome", label: "Nome", required: true },
            { name: "cpf_cnpj", label: "CPF/CNPJ", required: false },
            { name: "telefone", label: "Telefone", required: false },
            { name: "email", label: "Email", required: false },
          ],
          onSuccess: onRefreshFornecedores,
        } : undefined}
      />
    );
  }
};
