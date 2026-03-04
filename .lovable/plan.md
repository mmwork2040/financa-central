

## Plano: Tratar investimentos como transferências (reserva resgatável)

### Problema raiz

Quando um investimento é marcado como "pago", o sistema debita o saldo da conta bancária (linha 631 do LancamentosContext: `tipo !== "receita"` → delta negativo). Isso reduz o `caixaAtual`. No dashboard, investimentos são excluídos do cálculo do Caixa Previsto, mas o saldo bancário já foi reduzido — sem compensação.

Resultado: Caixa = 67.649 (já descontado o investimento de 32.325), e o Caixa Previsto fica ainda mais negativo porque só considera receitas/despesas pendentes.

### Solução

Tratar investimentos como transferências internas (dinheiro que muda de "bolso" mas continua disponível como reserva). Três pontos de correção:

---

### 1. `src/contexts/LancamentosContext.tsx` — Saldo bancário

**Criar lançamento (linha ~631)**: Investimentos pagos NÃO devem reduzir saldo da conta bancária.
```
// Antes:  delta = tipo === "receita" ? valor : -valor
// Depois: delta = tipo === "receita" ? valor : tipo === "investimento" ? 0 : -valor
```

**Alterar status (linha ~709 e ~721)**: Mesma lógica — investimento tem delta 0 ao entrar/sair de pago.

**Deletar lançamento**: Verificar se ao deletar investimento pago, não reverte saldo indevidamente.

---

### 2. `src/hooks/useDashboardData.tsx` — Caixa Previsto

**Linha 232**: Atualmente `caixaPrevisto = caixaAtual + receitasPendentes - despesasPendentes`. Como investimentos não reduzem mais o saldo, o cálculo fica correto automaticamente.

**Saldo Investido (linha ~255)**: Buscar o total investido de TODOS os períodos (não apenas do mês), pois investimentos são acumulativos. Fazer uma query separada sem filtro de mês.

**Runway/Projeção**: Excluir investimentos das queries de `lancFuturos` e `recorrentes` (linhas 235-245).

---

### 3. `src/utils/cashFlowProjection.ts` — Projeção

Adicionar filtro para ignorar `tipo === 'investimento'` em `calcularFluxoMensal`, tanto nos lançamentos futuros quanto nos recorrentes.

---

### 4. `src/contexts/LancamentosContext.tsx` — Funções auxiliares do n8n

Verificar `n8n-query/index.ts` para a mesma lógica de delta — investimentos com delta 0.

---

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/contexts/LancamentosContext.tsx` | Delta 0 para investimentos em criar, alterar status e deletar |
| `src/hooks/useDashboardData.tsx` | Saldo investido acumulativo (query sem filtro de mês), excluir investimentos da projeção |
| `src/utils/cashFlowProjection.ts` | Ignorar tipo investimento no cálculo mensal |
| `supabase/functions/n8n-query/index.ts` | Delta 0 para investimentos |

