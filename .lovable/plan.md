

## Plano: Investimento deve sair do saldo bancário (Saldo do Mês = caixa real)

### Entendimento

O usuário quer que:
- **Investimento pago** = dinheiro SAI da conta bancária (como transferência para fundo)
- **Saldo do Mês** = caixa real disponível (soma dos saldos bancários), SEM incluir investimentos
- **Saldo Investido** = reserva resgatável (acumulado de todos os investimentos pagos)
- **Resgate** = criar uma receita para devolver o dinheiro ao caixa

### Mudanças

**1. `src/contexts/LancamentosContext.tsx` — Reverter delta 0**

Investimentos devem debitar o saldo bancário como despesas (o dinheiro sai da conta para o fundo):
- Linha 631: `delta = formData.tipo === "receita" ? formData.valor : -formData.valor` (remover exceção de investimento)
- Linha 709: mesma reversão no "entrando em pago"
- Linha 721: mesma reversão no "saindo de pago"

**2. `src/hooks/useDashboardData.tsx` — Saldo do Mês = caixaAtual**

Trocar o cálculo do `saldoAtual` de `saldoInicialTotal + totalReceitas - totalDespesas` para usar `caixaAtual` (soma real dos saldos bancários). Isso reflete o dinheiro efetivamente disponível.

- Linha 272: `const saldoAtual = caixaAtual;`

Manter as demais correções já implementadas:
- Saldo Investido acumulativo (query sem filtro de mês) ✓
- Investimentos excluídos do Caixa Previsto ✓
- Investimentos excluídos da projeção de runway ✓

**3. Migração SQL — Reverter ajuste manual**

Subtrair os R$ 32.325,87 que foram adicionados manualmente na sessão anterior, pois agora o investimento voltará a debitar o saldo normalmente.

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/contexts/LancamentosContext.tsx` | Reverter delta para -valor em investimentos (3 pontos) |
| `src/hooks/useDashboardData.tsx` | Saldo do Mês = caixaAtual |
| SQL migration | Reverter +32.325,87 no saldo da conta Stone |

