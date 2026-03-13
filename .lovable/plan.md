

## Problema

O `PricingCard` trata `annualPrice` como o valor **total anual** e divide por 12 para mostrar o preço mensal equivalente. Mas na realidade, `annualPrice` já representa o valor **por mês** no plano anual (ex: R$ 49/mês), não o total do ano.

Isso causa:
- **Plano Start anual**: mostra R$ 4,08/mês (49/12) quando deveria mostrar R$ 49,00/mês
- **Plano Growth anual**: mostra R$ 8,08/mês (97/12) quando deveria mostrar R$ 97,00/mês
- **Plano Pro anual**: mostra R$ 24,75/mês (297/12) quando deveria mostrar R$ 297,00/mês

## Correção

**Arquivo: `src/components/landing/PricingCard.tsx`**

1. Remover a divisão por 12 na linha 42 — `annualPrice` já é o valor mensal:
   - `currentPrice = billingPeriod === "anual" && annualPrice ? annualPrice : monthlyPrice`

2. Atualizar o texto "cobrado anualmente" (linha 91) para mostrar o total correto (`annualPrice * 12`):
   - Ex: "R$ 588,00 cobrado anualmente"

3. Atualizar o texto alternativo no modo mensal (linha 96) para mostrar `annualPrice` diretamente em vez de `altPrice / 12`:
   - Ex: "ou R$ 49,00/mês no plano anual"

Nenhuma alteração necessária nos valores passados pela `LandingPage.tsx` — os valores `49`, `97`, `297` já estão corretos como preço mensal.

