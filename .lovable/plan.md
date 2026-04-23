

## Plano: Manter lançamentos vencidos como pendentes nos cálculos

### Problema
Quando um lançamento ultrapassa a data de vencimento, a Edge Function `check-overdue-lancamentos` muda o status de `pendente` → `vencido`. Como os filtros do Dashboard, Resumo, Relatórios e projeções verificam apenas `status === 'pendente'` (ou `'aberto'`), o item desaparece dos totais de "Receitas/Despesas Previstas", "Contas a Pagar", projeções de fluxo de caixa e indicadores de saúde — fazendo parecer que sumiu do sistema.

### Solução
Tratar `vencido` (e `atrasado`) como um sub-estado de "pendente" em todos os cálculos. O status continua sendo gravado para destacar visualmente o atraso (badge vermelho, notificações), mas passa a ser **incluído** em qualquer agregação de pendências. Só sai do cálculo quando o usuário marca como pago/recebido, cancela/ignora ou exclui.

### Arquivos a alterar

1. **`src/components/lancamentos/LancamentosSummary.tsx`**
   - Trocar `l.status === "pendente"` por `["pendente","aberto","vencido","atrasado"].includes(l.status)` nos cards "Receitas Previstas" e "Despesas Previstas" (valor + contagem).

2. **`src/hooks/useDashboardData.tsx`**
   - Substituir todas as ocorrências de `(l.status === 'pendente' || l.status === 'aberto')` por um helper `isPendingLike(status)` que também aceita `'vencido'` e `'atrasado'`. Aplica-se a:
     - `receitasPrevistas` / `despesasPrevistas`
     - `proximasContas` e `emAtraso`
     - `receitasPendList`
     - As duas queries Supabase `.in('status', ['pendente','aberto'])` → adicionar `'vencido'` e `'atrasado'`
     - `compromissosFuturos` e `receitasPendentesHealth`

3. **`src/hooks/useRelatoriosData.tsx`**
   - Nos blocos de `recPrev`/`despPrev` e nos agregados mensais (`receitasPrevistas`/`despesasPrevistas`), aceitar também `vencido`/`atrasado`.

4. **`src/components/dashboard/DashboardDetailDialog.tsx`**
   - Atualizar os filtros de `ReceitaPendenteContent` e `ContasPagarContent` para incluir `vencido`/`atrasado` na lista de pendentes (o cálculo de `emAtraso` continua usando a data, sem mudança).

5. **`src/components/dashboard/DashboardTrendLineChart.tsx`**
   - Expandir `isPendente` para incluir `vencido`/`atrasado`, garantindo que apareçam nas projeções.

6. **`src/utils/cashFlowProjection.ts`**
   - O arquivo recebe `lancamentosFuturos` como parâmetro; ajustar o consumidor (`useDashboardData`) para também buscar `vencido`/`atrasado` (já coberto no item 2). Sem mudança de assinatura.

7. **`supabase/functions/check-overdue-lancamentos/index.ts`**
   - Manter o comportamento atual (marcar como `vencido` + criar notificação), pois é útil para destaque visual. Apenas garantir que a query continue identificando os já marcados como `vencido` para não duplicar notificações: alterar o filtro `.in("status", ["pendente","aberto"])` mantendo-se igual (vencido só é setado uma vez por item) — **nenhuma mudança necessária aqui** após confirmação.

### Observações técnicas
- Será criado um helper compartilhado `src/utils/lancamentoStatus.ts` exportando:
  ```ts
  export const PENDING_STATUSES = ['pendente','aberto','vencido','atrasado'] as const;
  export const isPending = (s?: string) => PENDING_STATUSES.includes((s ?? '') as any);
  export const EXECUTED_STATUSES = ['pago','recebido'] as const;
  export const isExecuted = (s?: string) => EXECUTED_STATUSES.includes((s ?? '') as any);
  ```
- Todos os arquivos acima passarão a importar e usar `isPending`/`isExecuted` — eliminando duplicação e prevenindo regressões futuras.
- Status de exclusão lógica (`cancelado`, `ignorado`) continuam fora dos pendentes, conforme solicitado.

### Resultado esperado
Despesas/receitas que passaram da data de vencimento continuam aparecendo em "Despesas Previstas", "Contas a Pagar", "Em Atraso", projeções de fluxo de caixa e indicadores de saúde — até que o usuário as marque como pagas, ignore ou exclua. O badge "vencido" continua sendo exibido na tabela como alerta visual.

