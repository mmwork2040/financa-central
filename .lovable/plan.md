

## Plano: Corrigir duplicidade de vendas digitais

### Problema

O `webhook-receiver` não verifica se uma venda já existe antes de inserir na tabela `vendas_digitais`. Se a plataforma reenvia o mesmo webhook (retry, evento duplicado, etc.), o sistema cria registros duplicados — inclusive com lançamentos financeiros duplicados.

### Solução

**`supabase/functions/webhook-receiver/index.ts`** — Adicionar verificação de duplicidade antes de inserir:

1. Antes de inserir em `vendas_digitais`, verificar se já existe um registro com mesma combinação de `empresa_id + plataforma + valor_liquido + data_venda + produto + cliente`
2. Se já existir, retornar sucesso sem criar duplicata (idempotência)
3. Logar no `logs_integracoes` que foi um webhook duplicado ignorado

### Arquivo afetado
- `supabase/functions/webhook-receiver/index.ts` — adicionar check de duplicidade antes do insert

