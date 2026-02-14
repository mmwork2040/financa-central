
-- Tabela: perfis
CREATE TABLE public.perfis (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  permissao TEXT NOT NULL DEFAULT 'leitura',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são visíveis para usuários autenticados"
  ON public.perfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.perfis FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome, permissao)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'permissao', 'leitura')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela: categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'despesa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias visíveis para autenticados" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categorias inseríveis por autenticados" ON public.categorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Categorias atualizáveis por autenticados" ON public.categorias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Categorias deletáveis por autenticados" ON public.categorias FOR DELETE TO authenticated USING (true);

-- Tabela: clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes visíveis para autenticados" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clientes inseríveis por autenticados" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Clientes atualizáveis por autenticados" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Clientes deletáveis por autenticados" ON public.clientes FOR DELETE TO authenticated USING (true);

-- Tabela: fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fornecedores visíveis para autenticados" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fornecedores inseríveis por autenticados" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Fornecedores atualizáveis por autenticados" ON public.fornecedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Fornecedores deletáveis por autenticados" ON public.fornecedores FOR DELETE TO authenticated USING (true);

-- Tabela: contas_bancarias
CREATE TABLE public.contas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  saldo_atual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contas visíveis para autenticados" ON public.contas_bancarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Contas inseríveis por autenticados" ON public.contas_bancarias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Contas atualizáveis por autenticados" ON public.contas_bancarias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Contas deletáveis por autenticados" ON public.contas_bancarias FOR DELETE TO authenticated USING (true);

-- Tabela: formas_pagamento
CREATE TABLE public.formas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Formas pagamento visíveis para autenticados" ON public.formas_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Formas pagamento inseríveis por autenticados" ON public.formas_pagamento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Formas pagamento atualizáveis por autenticados" ON public.formas_pagamento FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Formas pagamento deletáveis por autenticados" ON public.formas_pagamento FOR DELETE TO authenticated USING (true);

-- Tabela: lancamentos
CREATE TABLE public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'despesa',
  status TEXT NOT NULL DEFAULT 'pendente',
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id) ON DELETE SET NULL,
  forma_pagamento_id UUID REFERENCES public.formas_pagamento(id) ON DELETE SET NULL,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  parcela_atual INTEGER,
  total_parcelas INTEGER,
  data_pagamento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lancamentos visíveis para autenticados" ON public.lancamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lancamentos inseríveis por autenticados" ON public.lancamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Lancamentos atualizáveis por autenticados" ON public.lancamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Lancamentos deletáveis por autenticados" ON public.lancamentos FOR DELETE TO authenticated USING (true);

-- Tabela: permissoes
CREATE TABLE public.permissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfis_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  tela TEXT NOT NULL,
  pode_incluir BOOLEAN NOT NULL DEFAULT false,
  pode_alterar BOOLEAN NOT NULL DEFAULT false,
  pode_excluir BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permissoes visíveis para autenticados" ON public.permissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permissoes inseríveis por autenticados" ON public.permissoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permissoes atualizáveis por autenticados" ON public.permissoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permissoes deletáveis por autenticados" ON public.permissoes FOR DELETE TO authenticated USING (true);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers de updated_at
CREATE TRIGGER update_perfis_updated_at BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_bancarias_updated_at BEFORE UPDATE ON public.contas_bancarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_formas_pagamento_updated_at BEFORE UPDATE ON public.formas_pagamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON public.lancamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
