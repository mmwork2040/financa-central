

## Adicionar Projetos ao Sistema Financeiro

### Objetivo
Permitir que o usuario crie projetos e associe lancamentos (receitas e despesas) a projetos especificos, possibilitando acompanhar o financeiro por projeto.

### Funcionalidades
- CRUD completo de projetos (nome, descricao, status ativo/concluido/cancelado, orcamento previsto)
- Associar lancamentos a projetos (campo opcional)
- Pagina dedicada para listar projetos com resumo financeiro (total receitas, despesas, saldo)
- Filtro por projeto na tela de lancamentos

### Alteracoes necessarias

#### 1. Banco de dados -- nova tabela `projetos`

Criar tabela `projetos` com:
- `id` (uuid, PK)
- `nome` (text, NOT NULL)
- `descricao` (text, nullable)
- `status` (text, default 'ativo') -- ativo, concluido, cancelado
- `orcamento` (numeric, default 0)
- `empresa_id` (uuid, NOT NULL)
- `created_at`, `updated_at` (timestamps)

Politicas RLS identicas as demais tabelas tenant-scoped (SELECT/INSERT/UPDATE/DELETE usando `get_user_empresa_id`).

Adicionar coluna `projeto_id` (uuid, nullable) na tabela `lancamentos` para associar lancamentos a projetos.

#### 2. Pagina de Projetos (`src/pages/Projetos.tsx`)

Nova pagina com:
- Header com titulo, botao "Novo Projeto"
- Tabela/cards listando projetos com nome, status, orcamento, total receitas, total despesas, saldo
- Modal de criacao/edicao de projeto
- Dialog de confirmacao de exclusao

#### 3. Hook `src/hooks/useProjetos.ts`

Hook para CRUD de projetos via Supabase, seguindo o padrao dos outros hooks (useCategorias, useFornecedores, etc).

#### 4. Formulario de Lancamentos

Adicionar select de "Projeto" no `LancamentosFormDialog.tsx` usando o componente `GenericSelect`, permitindo associar um lancamento a um projeto (campo opcional).

Atualizar `LancamentosContext.tsx`:
- Adicionar `projeto_id` ao tipo `Lancamento` e `LancamentoFormData`
- Adicionar `projeto_id` ao `FiltrosType`
- Buscar e expor lista de projetos
- Incluir `projeto_id` nos filtros da query

#### 5. Navegacao e Rotas

- Adicionar rota `/projetos` no `App.tsx` (protegida por permissao)
- Adicionar item "Projetos" no menu lateral (`Sidebar.tsx`) com icone `Briefcase`
- Adicionar `projetos` ao mapa de permissoes em `usePermissoes.ts`

#### 6. Tabela de Lancamentos

Exibir nome do projeto na tabela de lancamentos (join com tabela `projetos`).

### Secao tecnica

**Migracao SQL:**
```sql
CREATE TABLE public.projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'ativo',
  orcamento numeric NOT NULL DEFAULT 0,
  empresa_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projetos_select" ON public.projetos FOR SELECT USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "projetos_insert" ON public.projetos FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "projetos_update" ON public.projetos FOR UPDATE USING (empresa_id = get_user_empresa_id(auth.uid()));
CREATE POLICY "projetos_delete" ON public.projetos FOR DELETE USING (empresa_id = get_user_empresa_id(auth.uid()));

CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.lancamentos ADD COLUMN projeto_id uuid REFERENCES public.projetos(id) ON DELETE SET NULL;
```

**Arquivos a criar:**
- `src/pages/Projetos.tsx` -- pagina principal
- `src/hooks/useProjetos.ts` -- hook CRUD
- `src/components/projetos/ProjetoForm.tsx` -- formulario
- `src/components/projetos/ProjetosTable.tsx` -- tabela
- `src/components/projetos/ProjetoDeleteDialog.tsx` -- dialog exclusao

**Arquivos a modificar:**
- `src/App.tsx` -- nova rota `/projetos`
- `src/components/Sidebar.tsx` -- item de menu "Projetos"
- `src/hooks/usePermissoes.ts` -- adicionar `/projetos` ao mapa de rotas
- `src/contexts/LancamentosContext.tsx` -- tipo Lancamento + formData + filtros + fetch projetos + projeto_id
- `src/components/lancamentos/LancamentosFormDialog.tsx` -- select de projeto
- `src/components/lancamentos/LancamentosFilterDialog.tsx` -- filtro por projeto
- `src/components/lancamentos/LancamentosTable.tsx` -- coluna projeto

