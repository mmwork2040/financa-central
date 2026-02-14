-- =============================================
-- MIGRAÇÃO: Multi-tenant + Segurança Completa
-- Execute este SQL no Cloud View > Run SQL
-- =============================================

-- 1. CRIAR TABELA DE EMPRESAS (TENANTS)
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  email text,
  telefone text,
  endereco text,
  logo_url text,
  cor_primaria text DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 2. CRIAR ENUM E TABELA DE ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'usuario', 'leitura');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'leitura',
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, empresa_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. ADICIONAR empresa_id EM TODAS AS TABELAS
ALTER TABLE public.perfis ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;
ALTER TABLE public.categorias ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.fornecedores ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.contas_bancarias ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.formas_pagamento ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.lancamentos ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 4. FUNÇÕES SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_empresa(_user_id uuid, _empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND empresa_id = _empresa_id
  )
$$;

-- 5. DROP TODAS AS POLICIES EXISTENTES
DROP POLICY IF EXISTS "Categorias atualizáveis por autenticados" ON public.categorias;
DROP POLICY IF EXISTS "Categorias deletáveis por autenticados" ON public.categorias;
DROP POLICY IF EXISTS "Categorias inseríveis por autenticados" ON public.categorias;
DROP POLICY IF EXISTS "Categorias visíveis para autenticados" ON public.categorias;

DROP POLICY IF EXISTS "Clientes atualizáveis por autenticados" ON public.clientes;
DROP POLICY IF EXISTS "Clientes deletáveis por autenticados" ON public.clientes;
DROP POLICY IF EXISTS "Clientes inseríveis por autenticados" ON public.clientes;
DROP POLICY IF EXISTS "Clientes visíveis para autenticados" ON public.clientes;

DROP POLICY IF EXISTS "Contas atualizáveis por autenticados" ON public.contas_bancarias;
DROP POLICY IF EXISTS "Contas deletáveis por autenticados" ON public.contas_bancarias;
DROP POLICY IF EXISTS "Contas inseríveis por autenticados" ON public.contas_bancarias;
DROP POLICY IF EXISTS "Contas visíveis para autenticados" ON public.contas_bancarias;

DROP POLICY IF EXISTS "Formas pagamento atualizáveis por autenticados" ON public.formas_pagamento;
DROP POLICY IF EXISTS "Formas pagamento deletáveis por autenticados" ON public.formas_pagamento;
DROP POLICY IF EXISTS "Formas pagamento inseríveis por autenticados" ON public.formas_pagamento;
DROP POLICY IF EXISTS "Formas pagamento visíveis para autenticados" ON public.formas_pagamento;

DROP POLICY IF EXISTS "Fornecedores atualizáveis por autenticados" ON public.fornecedores;
DROP POLICY IF EXISTS "Fornecedores deletáveis por autenticados" ON public.fornecedores;
DROP POLICY IF EXISTS "Fornecedores inseríveis por autenticados" ON public.fornecedores;
DROP POLICY IF EXISTS "Fornecedores visíveis para autenticados" ON public.fornecedores;

DROP POLICY IF EXISTS "Lancamentos atualizáveis por autenticados" ON public.lancamentos;
DROP POLICY IF EXISTS "Lancamentos deletáveis por autenticados" ON public.lancamentos;
DROP POLICY IF EXISTS "Lancamentos inseríveis por autenticados" ON public.lancamentos;
DROP POLICY IF EXISTS "Lancamentos visíveis para autenticados" ON public.lancamentos;

DROP POLICY IF EXISTS "Perfis são visíveis para usuários autenticados" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.perfis;

DROP POLICY IF EXISTS "Permissoes atualizáveis por autenticados" ON public.permissoes;
DROP POLICY IF EXISTS "Permissoes deletáveis por autenticados" ON public.permissoes;
DROP POLICY IF EXISTS "Permissoes inseríveis por autenticados" ON public.permissoes;
DROP POLICY IF EXISTS "Permissoes visíveis para autenticados" ON public.permissoes;

-- 6. NOVAS RLS POLICIES - EMPRESAS
CREATE POLICY "empresas_select" ON public.empresas FOR SELECT TO authenticated
  USING (public.user_belongs_to_empresa(auth.uid(), id));

CREATE POLICY "empresas_update" ON public.empresas FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_empresa(auth.uid(), id)
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "empresas_insert" ON public.empresas FOR INSERT TO authenticated
  WITH CHECK (true);

-- 7. NOVAS RLS POLICIES - USER_ROLES
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "user_roles_insert_self" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_roles_insert_admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = public.get_user_empresa_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (
    empresa_id = public.get_user_empresa_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (
    empresa_id = public.get_user_empresa_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

-- 8. NOVAS RLS POLICIES - PERFIS
CREATE POLICY "perfis_select" ON public.perfis FOR SELECT TO authenticated
  USING (
    empresa_id = public.get_user_empresa_id(auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "perfis_insert" ON public.perfis FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "perfis_update_self" ON public.perfis FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "perfis_update_admin" ON public.perfis FOR UPDATE TO authenticated
  USING (
    empresa_id = public.get_user_empresa_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "perfis_delete_admin" ON public.perfis FOR DELETE TO authenticated
  USING (
    empresa_id = public.get_user_empresa_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
    AND id != auth.uid()
  );

-- 9. TABELAS DE DADOS - ISOLAMENTO POR TENANT
-- CATEGORIAS
CREATE POLICY "categorias_select" ON public.categorias FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "categorias_insert" ON public.categorias FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "categorias_update" ON public.categorias FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "categorias_delete" ON public.categorias FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- CLIENTES
CREATE POLICY "clientes_select" ON public.clientes FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "clientes_delete" ON public.clientes FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- FORNECEDORES
CREATE POLICY "fornecedores_select" ON public.fornecedores FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "fornecedores_insert" ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "fornecedores_update" ON public.fornecedores FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "fornecedores_delete" ON public.fornecedores FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- CONTAS_BANCARIAS
CREATE POLICY "contas_bancarias_select" ON public.contas_bancarias FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "contas_bancarias_insert" ON public.contas_bancarias FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "contas_bancarias_update" ON public.contas_bancarias FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "contas_bancarias_delete" ON public.contas_bancarias FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- FORMAS_PAGAMENTO
CREATE POLICY "formas_pagamento_select" ON public.formas_pagamento FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "formas_pagamento_insert" ON public.formas_pagamento FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "formas_pagamento_update" ON public.formas_pagamento FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "formas_pagamento_delete" ON public.formas_pagamento FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- LANCAMENTOS
CREATE POLICY "lancamentos_select" ON public.lancamentos FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "lancamentos_insert" ON public.lancamentos FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "lancamentos_update" ON public.lancamentos FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));
CREATE POLICY "lancamentos_delete" ON public.lancamentos FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id(auth.uid()));

-- PERMISSOES
CREATE POLICY "permissoes_select" ON public.permissoes FOR SELECT TO authenticated
  USING (
    perfis_id IN (SELECT id FROM public.perfis WHERE empresa_id = public.get_user_empresa_id(auth.uid()))
  );
CREATE POLICY "permissoes_insert" ON public.permissoes FOR INSERT TO authenticated
  WITH CHECK (
    perfis_id IN (SELECT id FROM public.perfis WHERE empresa_id = public.get_user_empresa_id(auth.uid()))
    AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "permissoes_update" ON public.permissoes FOR UPDATE TO authenticated
  USING (
    perfis_id IN (SELECT id FROM public.perfis WHERE empresa_id = public.get_user_empresa_id(auth.uid()))
    AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "permissoes_delete" ON public.permissoes FOR DELETE TO authenticated
  USING (
    perfis_id IN (SELECT id FROM public.perfis WHERE empresa_id = public.get_user_empresa_id(auth.uid()))
    AND public.has_role(auth.uid(), 'admin')
  );

-- 10. ATUALIZAR TRIGGER handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.perfis (id, email, nome, permissao)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'leitura'
  );
  RETURN NEW;
END;
$function$;

-- 11. TRIGGER updated_at para empresas
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. ÍNDICES para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_empresa_id ON public.user_roles(empresa_id);
CREATE INDEX idx_perfis_empresa_id ON public.perfis(empresa_id);
CREATE INDEX idx_categorias_empresa_id ON public.categorias(empresa_id);
CREATE INDEX idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX idx_fornecedores_empresa_id ON public.fornecedores(empresa_id);
CREATE INDEX idx_contas_bancarias_empresa_id ON public.contas_bancarias(empresa_id);
CREATE INDEX idx_formas_pagamento_empresa_id ON public.formas_pagamento(empresa_id);
CREATE INDEX idx_lancamentos_empresa_id ON public.lancamentos(empresa_id);
