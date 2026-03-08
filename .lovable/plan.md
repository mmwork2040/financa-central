

## Plano: Mostrar Forma de Pagamento na tabela e adicionar filtro

### Mudanças

**1. `src/contexts/LancamentosContext.tsx`**
- Adicionar `forma_pagamento:formas_pagamento(id, descricao)` ao select da query de lançamentos (linha 234-240)
- Adicionar `forma_pagamento_id` ao tipo `FiltrosType` (linha 94-105)
- Adicionar filtro `if (filtros.forma_pagamento_id) query = query.eq("forma_pagamento_id", ...)` (após linha 274)
- Atualizar tipo `Lancamento` para incluir `forma_pagamento?: { id: string; descricao: string }` nos joins

**2. `src/components/lancamentos/LancamentosTable.tsx`**
- Desktop: adicionar coluna "Forma Pgto" no header (após "Categoria") e exibir `lancamento.forma_pagamento?.descricao || '-'` na célula
- Mobile: mostrar forma de pagamento nas informações do card

**3. `src/components/lancamentos/LancamentosFilterDialog.tsx`**
- Adicionar select de "Forma de Pagamento" nos filtros avançados, usando a lista `formasPagamento` já disponível no contexto

**4. `src/components/lancamentos/LancamentosContainer.tsx`**
- Incluir `forma_pagamento` na busca textual do `filteredLancamentos`

