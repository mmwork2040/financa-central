

## Plano: Reorganizar layout dos cards do Dashboard

### Layout proposto (3 linhas)

```text
Linha 1: [Você já recebeu] [Você já pagou]                    (2 cols, mobile: 2 cols)
Linha 2: [Receitas Pendentes] [Contas a Pagar]                (2 cols, mobile: 2 cols)
Linha 3: [Saldo do mês] [Caixa Previsto] [Meses de Caixa]    (3 cols, mobile: stack 1 col)
```

### Mudanças

**`src/pages/Dashboard.tsx`** — Substituir o grid único de 5 colunas por 3 grids separados:

1. **Linha 1** (`grid-cols-2`): "Você já recebeu" (verde) + "Você já pagou" (vermelho) — sem alterações visuais
2. **Linha 2** (`grid-cols-2`): "Receitas Pendentes" (amber/laranja) + "Contas a Pagar" (amber com destaque de atraso) — diferenciar cores entre os dois cards
3. **Linha 3** (`grid-cols-1 sm:grid-cols-3`): "Saldo do mês" (com investido embutido), "Caixa Previsto", "Meses de Caixa" — empilham em 1 coluna no mobile, 3 colunas no desktop

Remove a seção separada de "Caixa Cards" que hoje mostra Caixa Previsto e Meses de Caixa em 2 colunas (linhas ~147-175), integrando esses cards na linha 3.

