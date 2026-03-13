

## Plano

Remover as linhas que exibem "R$ X cobrado anualmente" e "ou R$ X/mês no plano anual" no `PricingCard.tsx` (linhas ~89-97).

**Arquivo:** `src/components/landing/PricingCard.tsx`

- Remover o bloco que mostra o total anual quando `billingPeriod === "anual"`
- Remover o bloco que mostra a sugestão de preço anual quando `billingPeriod === "mensal"`

Resultado: o card mostrará apenas "R$ XX,XX / mês" sem detalhes adicionais de cobrança.

