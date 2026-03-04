

## Plano: Corrigir duplicação de lançamentos recorrentes

### Problema identificado

A edge function `generate-recurring` está criando lançamentos duplicados porque:

1. **Chamadas concorrentes**: A função é invocada tanto no `fetchLancamentos` (toda navegação de mês) quanto ao marcar como pago — ambas fire-and-forget. Múltiplas execuções simultâneas não veem os registros que a outra está inserindo.
2. **Agrupamento fraco**: A chave de cadeia `descricao + valor + tipo` não diferencia lançamentos recorrentes distintos com mesma descrição/valor (ex: se o usuário tem duas despesas "AI - Claude" com valores diferentes que foram editadas para ter o mesmo valor).

### Solução

**1. `supabase/functions/generate-recurring/index.ts`** — Prevenir duplicatas:

- Antes de inserir, fazer uma verificação direta no banco (`SELECT`) para a combinação exata de `descricao + valor + tipo + data_vencimento + empresa_id + recorrente=true` em vez de confiar apenas no array em memória
- Adicionar um `upsert`-like approach: verificar existência no banco antes de cada insert
- Alternativa mais simples e eficaz: adicionar a coluna `recorrencia_tipo` à chave de agrupamento e verificar existência com query no banco em vez de array local

**2. `src/contexts/LancamentosContext.tsx`** — Evitar chamadas concorrentes:

- Remover a chamada em `fetchLancamentos` (linha 214) — a geração só deve ocorrer ao marcar como pago/recebido (linha 746)
- Na chamada do handleStatus, usar `await` em vez de fire-and-forget para garantir que termina antes do refetch
- Adicionar debounce/flag para evitar chamadas duplicadas

**3. Limpeza de duplicatas existentes** — Criar uma migration SQL para remover lançamentos duplicados já criados:
- Agrupar por `empresa_id, descricao, valor, tipo, data_vencimento, recorrente` onde `status = 'pendente'`
- Manter apenas 1 registro por grupo, deletar os extras

### Arquivos afetados
- `supabase/functions/generate-recurring/index.ts`
- `src/contexts/LancamentosContext.tsx`
- Migration SQL para limpar duplicatas existentes

