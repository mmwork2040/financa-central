

## Plano: Gerar lançamentos futuros para recorrentes e parcelados existentes

### Problema

Lançamentos recorrentes (sem `total_parcelas`) que já foram pagos/recebidos só geram a próxima ocorrência ao mudar o status. Se o usuário não acessou o sistema por meses, os meses intermediários ficam vazios. Além disso, lançamentos parcelados já existentes podem não ter todas as parcelas criadas para meses futuros.

### Solução

Expandir a edge function `generate-recurring` para cobrir **dois cenários**:

**1. Recorrentes sem parcelas** — Iterar desde a última ocorrência paga/recebida até 12 meses à frente, gerando todas as ocorrências faltantes com status `pendente`. Se o lançamento mais recente foi cancelado, parar de gerar (o cancelamento interrompe a cadeia).

**2. Cancelamento interrompe a cadeia** — Quando o usuário cancela um lançamento recorrente no `LancamentosContext`, também cancelar todos os lançamentos futuros pendentes da mesma cadeia (mesma descrição + recorrente + valor).

### Mudanças

**`supabase/functions/generate-recurring/index.ts`**
- Remover o limite de 30 dias. Gerar até 12 meses à frente
- Para cada recorrente pago/recebido, iterar em loop gerando múltiplas ocorrências futuras (não apenas a próxima)
- Agrupar por `descricao + valor` para encontrar a data mais recente e gerar a partir dela
- Verificar se existe algum lançamento cancelado na cadeia — se sim, não gerar mais

**`src/contexts/LancamentosContext.tsx`**
- No `handleStatus`, quando status = `cancelado` e o lançamento é recorrente: deletar/cancelar todos os lançamentos futuros pendentes com mesma descrição + valor + recorrente
- Chamar `generate-recurring` ao carregar o contexto de lançamentos (no `fetchLancamentos`) para garantir que os meses futuros estejam populados

### Arquivos afetados
- `supabase/functions/generate-recurring/index.ts`
- `src/contexts/LancamentosContext.tsx`

