

## Plano: Corrigir Caixa Previsto mostrando investimentos indevidamente

### Diagnóstico

No `useDashboardData.tsx`, o cálculo do Caixa Previsto está correto — ele só soma receitas e despesas pendentes. Porém, a lista `itensPendentes` (que alimenta o dialog de detalhes) inclui **todos** os lançamentos pendentes, inclusive os de tipo `investimento`. Isso faz com que investimentos apareçam na lista de itens do Caixa Previsto sem contribuir para o valor, confundindo o usuário.

Além disso, se o usuário criou lançamentos de investimento com status pendente, eles aparecem no breakdown do dialog mas não deveriam estar ali, já que investimento não é receita nem despesa.

### Mudança

**`src/hooks/useDashboardData.tsx`** (linhas 215-230):
- Filtrar `pendSemTransf` para excluir `tipo === 'investimento'` antes de montar `itensPendentes`, `receitasPendentesAcumuladas` e `despesasPendentesAcumuladas`.
- Isso garante que investimentos pendentes não apareçam no breakdown do Caixa Previsto.

Alteração específica na linha 215:
```typescript
const pendSemTransf = pendentesAteMonthEnd?.filter(
  l => (l as any).origem !== 'transferencia' && l.tipo !== 'investimento'
) || [];
```

### Arquivo afetado
- `src/hooks/useDashboardData.tsx` — 1 linha alterada

