

## Plano: Corrigir recorrências — cada mês deve ter seu próprio registro

### Problema atual

Quando uma despesa recorrente é paga em março, ela aparece como "paga" em abril também, porque o código busca lançamentos recorrentes de meses anteriores e os mistura na visualização do mês atual (linhas 256-279 do `LancamentosContext`). Isso está errado: cada mês deve ter seu próprio registro independente.

### Solução

**1. Auto-gerar próxima ocorrência ao dar baixa (`LancamentosContext.tsx`)**
- Em `handleStatus`, quando um lançamento recorrente (sem `total_parcelas`) é marcado como "pago" ou "recebido", inserir automaticamente um novo registro para o próximo mês com status "pendente"
- Verificar antes se já não existe um registro para o próximo período (evitar duplicatas)
- Respeitar `recorrencia_tipo` (mensal, semanal, etc.) e `recorrencia_fim`

**2. Remover merge de recorrentes antigos (`LancamentosContext.tsx`)**
- Eliminar a Query 2 (linhas 257-279) que busca recorrentes de meses anteriores e os mistura
- Cada mês mostrará apenas os registros que realmente existem para aquele período
- Isso garante que ao mudar de mês no Dashboard, cada mês mostra seus próprios dados

**3. Chamar `generate-recurring` no carregamento do Dashboard (`useDashboardData.tsx`)**
- Invocar a edge function `generate-recurring` silenciosamente ao carregar o Dashboard (como já é feito com `process-digital-receipts`)
- Isso cobre casos onde o usuário não acessou o sistema e perdeu a geração automática

### Arquivos afetados
- `src/contexts/LancamentosContext.tsx` — auto-gerar próxima ocorrência + remover merge de antigos
- `src/hooks/useDashboardData.tsx` — chamar `generate-recurring` no carregamento
- `supabase/functions/generate-recurring/index.ts` — ajustar para gerar também para recorrentes com status "recebido" (não só "pago")

