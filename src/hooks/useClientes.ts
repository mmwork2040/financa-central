
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Cliente {
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
  origem?: string;
}

export const initialCliente: Cliente = {
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

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { empresaId } = useAuth();

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const saveCliente = async (cliente: Cliente) => {
    setIsSaving(true);
    try {
      if (!cliente.nome) throw new Error("Nome do cliente é obrigatório");

      if (cliente.id) {
        const { error } = await supabase
          .from('clientes')
          .update({
          nome: cliente.nome,
            cpf_cnpj: cliente.cpf_cnpj || null,
            telefone: cliente.telefone || null,
            email: cliente.email || null,
            endereco: cliente.endereco || null,
            cep: cliente.cep || null,
            rua: cliente.rua || null,
            numero: cliente.numero || null,
            complemento: cliente.complemento || null,
            bairro: cliente.bairro || null,
            cidade: cliente.cidade || null,
            estado: cliente.estado || null,
            ativo: cliente.ativo,
          } as any)
          .eq('id', cliente.id);
        if (error) throw error;
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert({
            nome: cliente.nome,
            cpf_cnpj: cliente.cpf_cnpj || null,
            telefone: cliente.telefone || null,
            email: cliente.email || null,
            endereco: cliente.endereco || null,
            cep: cliente.cep || null,
            rua: cliente.rua || null,
            numero: cliente.numero || null,
            complemento: cliente.complemento || null,
            bairro: cliente.bairro || null,
            cidade: cliente.cidade || null,
            estado: cliente.estado || null,
            ativo: cliente.ativo,
            empresa_id: empresaId,
          } as any);
        if (error) throw error;
        toast.success("Cliente cadastrado com sucesso!");
      }
      
      await fetchClientes();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCliente = async (clienteId: string) => {
    try {
      // Remove pending support requests for this record
      await supabase
        .from('solicitacoes_suporte')
        .delete()
        .eq('registro_id', clienteId)
        .eq('tabela', 'clientes')
        .eq('status', 'pendente');

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);
      if (error) throw error;
      toast.success("Cliente excluído com sucesso!");
      await fetchClientes();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cliente");
      return false;
    }
  };

  return {
    clientes,
    loading,
    isSaving,
    fetchClientes,
    saveCliente,
    deleteCliente
  };
};
