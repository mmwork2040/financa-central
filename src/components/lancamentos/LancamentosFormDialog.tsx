
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLancamentosContext } from "@/contexts/LancamentosContext";
import { TipoSelect } from "./form/TipoSelect";
import { DescricaoInput } from "./form/DescricaoInput";
import { ValorInput } from "./form/ValorInput";
import { DatePickerField } from "./form/DatePickerField";
import { StatusSelect } from "./form/StatusSelect";
import { RecorrenciaToggle } from "./form/RecorrenciaToggle";
import { ParcelasInput } from "./form/ParcelasInput";
import { CategoriaSelect } from "./form/CategoriaSelect";
import { ClienteFornecedorSelect } from "./form/ClienteFornecedorSelect";
import { GenericSelect } from "./form/GenericSelect";

export const LancamentosFormDialog = () => {
  const { 
    openModal,
    setOpenModal,
    formData,
    handleInputChange,
    handleSave,
    handleSelectChange,
    categorias,
    clientes,
    fornecedores,
    formasPagamento,
    contasBancarias,
    selectedId
  } = useLancamentosContext();

  const [selectedTipo, setSelectedTipo] = useState<"despesa" | "receita">(formData.tipo || "despesa");
  const [selectedStatus, setSelectedStatus] = useState<"pendente" | "pago" | "recebido" | "cancelado">(formData.status || "pendente");

  useEffect(() => {
    setSelectedTipo(formData.tipo || "despesa");
    setSelectedStatus(formData.status || "pendente");
  }, [formData]);

  const handleTipoChange = (value: string) => {
    const tipoValue = value as "despesa" | "receita";
    setSelectedTipo(tipoValue);
    handleSelectChange('tipo', value);
  };

  const handleStatusChange = (value: string) => {
    const statusValue = value as "pendente" | "pago" | "recebido" | "cancelado";
    setSelectedStatus(statusValue);
    handleSelectChange('status', value);
  };

  // Function to handle date changes
  const handleDateChange = (field: string, date: Date | null) => {
    if (date) {
      const isoDate = date.toISOString().split('T')[0];
      const syntheticEvent = {
        target: {
          name: field,
          value: isoDate
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleInputChange(syntheticEvent);
    }
  };

  // Function to handle recurrence toggle
  const handleRecorrenciaChange = (checked: boolean) => {
    const syntheticEvent = {
      target: {
        name: 'recorrente',
        value: checked
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(syntheticEvent);
  };

  // Function to handle parcelas change
  const handleParcelasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || null;
    const syntheticEvent = {
      target: {
        name: 'total_parcelas',
        value: value
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(syntheticEvent);
  };

  // Function to handle valor change
  const handleValorChange = (value: number) => {
    const syntheticEvent = {
      target: {
        name: 'valor',
        value: value
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(syntheticEvent);
  };

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{selectedId ? "Editar" : "Novo"} Lançamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <TipoSelect value={selectedTipo} onChange={handleTipoChange} />
          <DescricaoInput value={formData.descricao || ""} onChange={handleInputChange} />
          <ValorInput valor={formData.valor} onValorChange={handleValorChange} />
          <DatePickerField 
            label="Data de Vencimento"
            value={formData.data_vencimento} 
            onChange={(date) => handleDateChange('data_vencimento', date)} 
          />
          <StatusSelect value={selectedStatus} onChange={handleStatusChange} tipo={selectedTipo} />
          
          {/* Conditional data_pagamento field */}
          {(selectedStatus === "pago" || selectedStatus === "recebido") && (
            <DatePickerField 
              label={`Data de ${selectedTipo === "receita" ? "Recebimento" : "Pagamento"}`}
              value={formData.data_pagamento} 
              onChange={(date) => handleDateChange('data_pagamento', date)} 
            />
          )}
          
          <RecorrenciaToggle 
            checked={formData.recorrente || false} 
            onCheckedChange={handleRecorrenciaChange} 
          />

          {/* Conditional parcelas field */}
          {formData.recorrente && (
            <ParcelasInput value={formData.total_parcelas} onChange={handleParcelasChange} />
          )}
          
          <CategoriaSelect 
            value={formData.categoria_id} 
            onChange={(value) => handleSelectChange('categoria_id', value)}
            categorias={categorias}
            tipo={selectedTipo}
          />
          
          <ClienteFornecedorSelect 
            tipo={selectedTipo}
            clienteId={formData.cliente_id}
            fornecedorId={formData.fornecedor_id}
            onClienteChange={(value) => handleSelectChange('cliente_id', value)}
            onFornecedorChange={(value) => handleSelectChange('fornecedor_id', value)}
            clientes={clientes}
            fornecedores={fornecedores}
          />
          
          <GenericSelect 
            label="Forma de Pagamento"
            value={formData.forma_pagamento_id} 
            onChange={(value) => handleSelectChange('forma_pagamento_id', value)}
            options={formasPagamento}
            noneOptionValue="no-payment-method"
            nameField="descricao"
            placeholder="Selecione a forma de pagamento"
          />
          
          <GenericSelect 
            label="Conta Bancária"
            value={formData.conta_bancaria_id} 
            onChange={(value) => handleSelectChange('conta_bancaria_id', value)}
            options={contasBancarias}
            noneOptionValue="no-bank-account"
            placeholder="Selecione a conta bancária"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.descricao || !formData.data_vencimento}>
            {selectedId ? "Atualizar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
