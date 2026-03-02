
import { supabase } from "@/integrations/supabase/client";
import { Fornecedor } from "@/types/fornecedor.types";

export const fetchFornecedores = async () => {
  try {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome');

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    throw error;
  }
};

export const saveFornecedor = async (fornecedor: Fornecedor, empresaId?: string | null) => {
  try {
    if (!fornecedor.nome) throw new Error("Nome do fornecedor é obrigatório");

    if (fornecedor.id) {
      const { error } = await (supabase as any)
        .from('fornecedores')
        .update({
          nome: fornecedor.nome,
          cpf_cnpj: fornecedor.cpf_cnpj,
          telefone: fornecedor.telefone,
          email: fornecedor.email,
          endereco: fornecedor.endereco,
          cep: fornecedor.cep || null,
          rua: fornecedor.rua || null,
          numero: fornecedor.numero || null,
          complemento: fornecedor.complemento || null,
          bairro: fornecedor.bairro || null,
          cidade: fornecedor.cidade || null,
          estado: fornecedor.estado || null,
          ativo: fornecedor.ativo,
        })
        .eq('id', fornecedor.id);

      if (error) throw error;
      return { success: true, message: "Fornecedor atualizado com sucesso!" };
    } else {
      const { error } = await (supabase as any)
        .from('fornecedores')
        .insert({
          nome: fornecedor.nome,
          cpf_cnpj: fornecedor.cpf_cnpj,
          telefone: fornecedor.telefone,
          email: fornecedor.email,
          endereco: fornecedor.endereco,
          cep: fornecedor.cep || null,
          rua: fornecedor.rua || null,
          numero: fornecedor.numero || null,
          complemento: fornecedor.complemento || null,
          bairro: fornecedor.bairro || null,
          cidade: fornecedor.cidade || null,
          estado: fornecedor.estado || null,
          ativo: fornecedor.ativo,
          empresa_id: empresaId,
        });

      if (error) {
        if (error.code === '23505') throw new Error("Já existe um fornecedor com este nome.");
        throw error;
      }
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
