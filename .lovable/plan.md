## Problema identificado

**Causa 1 — Categoria não filtra por tipo:**
- `ImportarDocumentos.tsx` carrega categorias com `select("id, nome")` (sem o campo `tipo`)
- `EditImportItemDialog` recebe `EntityOption[]` e renderiza todas as categorias sem filtrar
- Ao trocar Receita ↔ Despesa ↔ Investimento, o select continua mostrando a mesma lista (e mantém uma categoria do tipo errado selecionada)

**Causa 2 — Faltam Projeto e Tag:**
- Dialog não expõe seleção de projeto (campo `projeto_id` existe em `lancamentos`)
- Não existe campo "tag" no schema — assumindo que se refere a **projeto**

## Correções

### 1. Filtrar categorias por tipo no dialog
- Estender `EntityOption` (ou criar `CategoriaOption = { id, nome, tipo }`) e ajustar `ImportarDocumentos.tsx` para buscar `id, nome, tipo`
- No `EditImportItemDialog`, derivar `categoriasFiltradas = categorias.filter(c => c.tipo === form.tipo_sugerido)` (mapeando `investimento` corretamente)
- Ao trocar `tipo_sugerido`, resetar `categoria_id` se a categoria atual não pertencer ao novo tipo (mantendo `categoria_sugerida` como texto para permitir auto-match ou criação)
- O auto-match case-insensitive existente também deve respeitar o tipo

### 2. Adicionar seleção de Projeto
- Adicionar `projeto_id?: string | null` ao tipo `EditableItem`
- Adicionar prop `projetos: EntityOption[]` ao dialog
- Em `ImportarDocumentos.tsx`, carregar projetos (`select("id, nome").eq("empresa_id", empresaId).eq("status", "ativo")`) e passar ao dialog
- Renderizar um `<Select>` opcional "Projeto" no dialog (com opção "Sem projeto")
- Propagar `projeto_id` no `onSave` e usar na criação do lançamento final (ajustar o ponto de inserção em `lancamentos` para incluir `projeto_id`)

### 3. Sem mudanças de tag
- Não há entidade "tag" no projeto. Se quiser uma classificação extra, precisa especificar (nova tabela `tags` + `lancamento_tags`, ou um campo `tags text[]` em `lancamentos`)

## Arquivos afetados
- `src/components/importacao/EditImportItemDialog.tsx` — filtro de categoria por tipo, reset ao trocar tipo, campo Projeto
- `src/pages/ImportarDocumentos.tsx` — buscar `tipo` das categorias, buscar lista de projetos, passar ao dialog, gravar `projeto_id` ao confirmar importação

## Pergunta antes de implementar
Você quer que eu trate "tag" como sinônimo de **Projeto** (apenas adicionar Projeto), ou quer que eu **crie um sistema novo de tags** (tabela + vinculação aos lançamentos)?