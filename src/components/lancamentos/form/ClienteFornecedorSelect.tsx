
import { Cliente, Fornecedor } from "@/contexts/LancamentosContext";
import { GenericSelect } from "./GenericSelect";
import { QuickAddClienteModal } from "./QuickAddClienteModal";
import { QuickAddFornecedorModal } from "./QuickAddFornecedorModal";

interface ClienteFornecedorSelectProps {
  tipo: "despesa" | "receita" | "investimento" | "resgate" | "rentabilidade";
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
        customQuickAdd={onRefreshClientes ? <QuickAddClienteModal onSuccess={onRefreshClientes} /> : undefined}
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
        customQuickAdd={onRefreshFornecedores ? <QuickAddFornecedorModal onSuccess={onRefreshFornecedores} /> : undefined}
      />
    );
  }
};
