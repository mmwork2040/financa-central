

## Plano: Popups de detalhamento para todos os cards do Dashboard

Atualmente, apenas o card "Caixa Previsto" abre um popup ao ser clicado. A ideia é adicionar o mesmo comportamento para os outros 5 cards: **Saldo do mês**, **Receitas**, **Despesas**, **Contas a Pagar**, **Receita Pendente** e **Meses de Caixa**.

### O que cada popup vai mostrar

1. **Saldo do mês** — Lista de cada conta bancária com nome e saldo atual, totalizando no final.
2. **Receitas** — Resumo: total do mês (executado + previsto). Lista dos lançamentos de receita do mês (executados e pendentes), com indicador ✓ ou 🕐.
3. **Despesas** — Resumo: total do mês (executado + previsto). Lista dos lançamentos de despesa do mês (executados e pendentes), com indicador ✓ ou 🕐.
4. **Receita Pendente** — Lista das receitas pendentes do mês com descrição, vencimento e valor.
5. **Contas a Pagar** — Lista das despesas pendentes do mês com descrição, vencimento e valor. Destaque para itens em atraso.
6. **Meses de Caixa** — Explicação da fórmula (runway), caixa atual, média de despesas mensais, e a projeção mês a mês retornada por `simularFluxoCaixa`.

### Mudanças técnicas

#### 1. `src/hooks/useDashboardData.tsx`
- Alterar a query de `contas_bancarias` para incluir `nome` e `saldo_atual` (atualmente só busca `saldo_atual`).
- Expor a lista de contas bancárias (`contasBancarias`) no retorno do hook.
- Expor os dados de projeção (`projectionData`) retornados por `simularFluxoCaixa`.
- Expor a lista de todos os lançamentos do mês filtrados (receitas executadas + pendentes, despesas executadas + pendentes) para os popups de Receitas e Despesas.

#### 2. `src/components/dashboard/DashboardDetailDialog.tsx` (novo)
- Componente genérico de dialog que recebe um `type` e os dados relevantes.
- Renderiza o conteúdo adequado com base no tipo do card clicado.
- Reutiliza o padrão visual do `CaixaPrevistoDialog` existente (ícones, formatação, maskValue).

#### 3. `src/pages/Dashboard.tsx`
- Adicionar estado para controlar qual dialog está aberto (`activeDialog`).
- Substituir os `onClick={() => navigate("/transactions")}` dos 5 cards por `onClick` que abre o dialog correspondente.
- O card "Meses de Caixa" (que hoje não tem onClick) também ganha o comportamento.
- Renderizar o novo `DashboardDetailDialog` passando os dados do hook.

### Arquivos afetados
- `src/hooks/useDashboardData.tsx` — expor contas bancárias, projeção e lançamentos do mês
- `src/components/dashboard/DashboardDetailDialog.tsx` — novo componente
- `src/pages/Dashboard.tsx` — conectar os cards aos dialogs

