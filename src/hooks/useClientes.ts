
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
}

export const initialCliente: Cliente = {
  id: "",
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  ativo: true,
};

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { empresaId } = useAuth();

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) {
        throw error;
      }

      setClientes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
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
      if (!cliente.nome) {
        throw new Error("Nome do cliente é obrigatório");
      }

      if (cliente.id) {
        // Update
        const { error } = await supabase
          .from('clientes')
          .update({
            nome: cliente.nome,
            cpf_cnpj: cliente.cpf_cnpj || null,
            telefone: cliente.telefone || null,
            email: cliente.email || null,
            endereco: cliente.endereco || null,
            ativo: cliente.ativo,
          })
          .eq('id', cliente.id);

        if (error) throw error;
        toast({ title: "Cliente atualizado com sucesso!" });
      } else {
        // Insert
        const { error } = await supabase
          .from('clientes')
          .insert({
            nome: cliente.nome,
            cpf_cnpj: cliente.cpf_cnpj || null,
            telefone: cliente.telefone || null,
            email: cliente.email || null,
            endereco: cliente.endereco || null,
            ativo: cliente.ativo,
            empresa_id: empresaId,
          });

        if (error) throw error;
        toast({ title: "Cliente cadastrado com sucesso!" });
      }
      
      await fetchClientes();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cliente",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCliente = async (clienteId: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (error) throw error;
      
      toast({ title: "Cliente excluído com sucesso!" });
      await fetchClientes();
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      });
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
