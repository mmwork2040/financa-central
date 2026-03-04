

## Plano: Renomear cards e mostrar totais com detalhe de realizado

### Mudança

No `src/pages/Dashboard.tsx`, Linha 1 (linhas 79-103):

1. **"Você já recebeu" → "Receitas"**: Valor principal = `totalReceitas + receitasPrevistas` (total do mês). Abaixo, texto menor: "R$ X,XX já recebido".
2. **"Você já pagou" → "Despesas"**: Valor principal = `totalDespesas + despesasPrevistas` (total do mês). Abaixo, texto menor: "R$ X,XX já pago".

### Arquivo afetado
- `src/pages/Dashboard.tsx` — apenas as linhas 79-103 dos dois cards da Linha 1.

