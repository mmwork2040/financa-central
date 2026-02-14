
import { Cliente, Fornecedor } from "@/contexts/LancamentosContext";
import { GenericSelect } from "./GenericSelect";

interface ClienteFornecedorSelectProps {
  tipo: "despesa" | "receita";
  clienteId: string | null;
  fornecedorId: string | null;
  onClienteChange: (value: string) => void;
  onFornecedorChange: (value: string) => void;
  clientes: Cliente[];
  fornecedores: Fornecedor[];
}

export const ClienteFornecedorSelect = ({ 
  tipo, 
  clienteId, 
  fornecedorId,
  onClienteChange,
  onFornecedorChange,
  clientes,
  fornecedores
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
      />
    );
  }
};
