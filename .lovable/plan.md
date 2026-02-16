

## Adicionar tipo "Investimento" nas Categorias

### Objetivo
Permitir que o usuario crie categorias do tipo "investimento", alem dos tipos existentes "receita" e "despesa".

### Alteracoes necessarias

#### 1. Banco de dados
- Nenhuma migracao necessaria. A coluna `tipo` na tabela `categorias` e do tipo `text`, entao ja aceita qualquer valor, incluindo "investimento".

#### 2. Hook `useCategorias.tsx`
- Atualizar o tipo `Categoria` para incluir `"investimento"` no union type: `tipo: "receita" | "despesa" | "investimento"`.
- Atualizar a funcao `validatedCategorias` que hoje forca tudo que nao e "receita" a ser "despesa" -- agora precisa reconhecer "investimento" tambem.
- Atualizar o tipo do `handleSelectChange` para aceitar `"investimento"`.

#### 3. Formulario `CategoriaForm.tsx`
- Adicionar `<SelectItem value="investimento">Investimento</SelectItem>` no select de tipo.
- Atualizar a tipagem do `handleSelectChange` para incluir `"investimento"`.

#### 4. Tabela `CategoriasTable.tsx`
- Adicionar estilizacao para o badge "investimento" (ex: azul/roxo).
- Atualizar o texto exibido para mostrar "Investimento" quando `tipo === "investimento"`.

#### 5. Pagina `Categorias.tsx`
- Atualizar os exports CSV/PDF para formatar corretamente o tipo "investimento".
- Atualizar o resumo do PDF para contar categorias de investimento.

#### 6. Contexto `LancamentosContext.tsx`
- Atualizar o tipo `Lancamento` para aceitar `"investimento"` no campo `tipo`.
- Atualizar o tipo `FiltrosType` para incluir `"investimento"`.

#### 7. Select de Categoria nos Lancamentos (`CategoriaSelect.tsx`)
- Atualizar a tipagem do prop `tipo` para incluir `"investimento"`.
- Adicionar opcao "Investimento" no QuickAddDialog.

#### 8. Componentes de Lancamentos (TipoSelect, filtros, etc.)
- Adicionar opcao "Investimento" no select de tipo dos lancamentos.
- Atualizar badges e formatacoes de tipo nos componentes de listagem.

#### 9. Dashboard e Relatorios
- Ajustar `useDashboardData.tsx` e componentes de relatorio para considerar investimentos nos calculos e graficos.

### Secao tecnica

Arquivos a modificar:
- `src/hooks/useCategorias.tsx` -- tipo union + validacao
- `src/components/categorias/CategoriaForm.tsx` -- select option
- `src/components/categorias/CategoriasTable.tsx` -- badge styling
- `src/pages/Categorias.tsx` -- export CSV/PDF
- `src/contexts/LancamentosContext.tsx` -- tipos
- `src/components/lancamentos/form/CategoriaSelect.tsx` -- prop type + quick add
- `src/components/lancamentos/form/TipoSelect.tsx` -- opcao investimento
- `src/hooks/useDashboardData.tsx` -- calculos
- `src/hooks/useRelatoriosData.tsx` -- dados de relatorio

