

## Plano: Resgate de Investimentos

### Contexto
Investimentos no sistema são lançamentos do tipo `investimento` com status `pago/recebido`. O "Saldo Investido" é a soma acumulada desses lançamentos. Atualmente não existe nenhuma funcionalidade de resgate. O resgate deve transferir valor do saldo investido para uma conta bancária, criando os lançamentos adequados.

### O que será feito

**1. Criar componente `ResgateInvestimentoDialog`**
- Novo arquivo: `src/components/contas-bancarias/ResgateInvestimentoDialog.tsx`
- Dialog com campos:
  - **Valor do resgate** (CurrencyInput, obrigatório, validação contra saldo investido disponível)
  - **Conta destino** (Select com contas bancárias do usuário)
  - **Descrição** (opcional, default: "Resgate de investimento")
- Ao confirmar:
  1. Buscar saldo investido atual (soma de lancamentos tipo=investimento, status pago/recebido)
  2. Validar que valor <= saldo investido
  3. Criar lançamento tipo `receita`, status `recebido`, origem `resgate_investimento`, com conta_bancaria_id do destino
  4. Criar lançamento tipo `investimento`, status `pago`, valor negativo ou criar com origem `resgate_investimento` para rastrear a saída do investimento (usar valor positivo com origem especial para identificar resgates)
  5. Atualizar `saldo_atual` da conta destino (+valor)
  6. Registrar movimentação via `logMovimentacao`

**Lógica de lançamentos do resgate:**
- Lançamento 1 (saída do investimento): tipo=`investimento`, valor negativo no cálculo ou criar um lançamento de "estorno" — melhor abordagem: criar lançamento tipo=`receita`, origem=`resgate_investimento`, que credita a conta bancária
- Para reduzir o saldo investido: criar lançamento tipo=`investimento`, valor com sinal negativo não é suportado. Alternativa: usar um campo `origem=resgate_investimento` e ajustar o cálculo de saldo investido para subtrair resgates.

**Abordagem escolhida:** Criar 2 lançamentos:
1. **Receita** (entrada na conta): tipo=`receita`, status=`recebido`, origem=`resgate_investimento`, conta_bancaria_id=destino
2. **Investimento negativo** (saída do investimento): tipo=`investimento`, status=`pago`, origem=`resgate_investimento`, valor com sinal positivo mas rastreado pela origem

Na verdade, a forma mais limpa: criar apenas 1 lançamento tipo=`receita`, origem=`resgate_investimento`. E ajustar o cálculo do `saldoInvestido` no `useDashboardData` para subtrair lançamentos de receita com origem=`resgate_investimento`.

**2. Ajustar cálculo de Saldo Investido (`src/hooks/useDashboardData.tsx`)**
- Buscar também lançamentos com `origem = 'resgate_investimento'` e tipo `receita`
- `saldoInvestido = totalInvestimentos - totalResgates`

**3. Integrar botão de Resgate na página de Contas Bancárias (`src/pages/ContasBancarias.tsx`)**
- Adicionar botão "Resgatar" (ícone `TrendingDown` ou `ArrowDownToLine`) ao lado dos botões existentes (Histórico, Extrato, Recalcular, Transferir)
- Visível quando `canAlterar` é true
- Abre o `ResgateInvestimentoDialog`

**4. Integrar botão de Resgate no Dashboard**
- No card de "Saldo Investido" (tanto empresarial quanto pessoal), adicionar um botão/link discreto "Resgatar" para acesso rápido, ou manter apenas na página de Contas Bancárias para simplicidade.

### Arquivos a criar/editar
| Arquivo | Ação |
|---|---|
| `src/components/contas-bancarias/ResgateInvestimentoDialog.tsx` | Criar |
| `src/pages/ContasBancarias.tsx` | Editar - adicionar botão e dialog |
| `src/hooks/useDashboardData.tsx` | Editar - ajustar cálculo saldoInvestido |
| `src/components/dashboard/PatrimonioChart.tsx` | Editar - ajustar cálculo se necessário |

### Fluxo do usuário
1. Usuário acessa Contas Bancárias
2. Clica em "Resgatar" 
3. Informa valor, seleciona conta destino
4. Sistema valida saldo investido disponível
5. Cria lançamento de receita com origem `resgate_investimento`
6. Atualiza saldo da conta destino
7. Registra movimentação no histórico
8. Dashboard reflete a redução no "Saldo Investido" e aumento no saldo bancário

