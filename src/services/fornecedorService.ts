
import { supabase } from "@/integrations/supabase/client";
import { Fornecedor } from "@/types/fornecedor.types";
import { useToast } from "@/hooks/use-toast";

export const fetchFornecedores = async () => {
  try {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    throw error;
  }
};

export const saveFornecedor = async (fornecedor: Fornecedor) => {
  try {
    if (!fornecedor.nome) {
      throw new Error("Nome do fornecedor é obrigatório");
    }

    if (fornecedor.id) {
      // Update
      const { error } = await supabase
        .from('fornecedores')
        .update({
          nome: fornecedor.nome,
          cpf_cnpj: fornecedor.cpf_cnpj,
          telefone: fornecedor.telefone,
          email: fornecedor.email,
          endereco: fornecedor.endereco,
          ativo: fornecedor.ativo,
        })
        .eq('id', fornecedor.id);

      if (error) throw error;
      return { success: true, message: "Fornecedor atualizado com sucesso!" };
    } else {
      // Insert
      const { error } = await supabase
        .from('fornecedores')
        .insert({
          nome: fornecedor.nome,
          cpf_cnpj: fornecedor.cpf_cnpj,
          telefone: fornecedor.telefone,
          email: fornecedor.email,
          endereco: fornecedor.endereco,
          ativo: fornecedor.ativo,
        });

      if (error) throw error;
      return { success: true, message: "Fornecedor cadastrado com sucesso!" };
    }
  } catch (error: any) {
    throw error;
  }
};

export const deleteFornecedor = async (id: string) => {
  try {
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return { success: true, message: "Fornecedor excluído com sucesso!" };
  } catch (error: any) {
    throw error;
  }
};
