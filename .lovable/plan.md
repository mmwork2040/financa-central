

## Plano: Unificar Operações de Investimento e Garantir Reversibilidade

### Problema Atual
1. O `ResgateInvestimentoDialog` em Contas Bancárias cria lançamentos diretamente via Supabase, **sem reverter o saldo da conta ao excluir/editar** o lançamento correspondente na tela de Lançamentos.
2. O `handleDelete` do `LancamentosContext` **não reverte o saldo da conta bancária** quando exclui um lançamento que já foi pago/recebido — isso vale para qualquer tipo, incluindo resgates e investimentos.
3. Não existe um registro visual de "Rentabilidade" como tipo de operação no sistema.
4. O usuário não consegue editar um resgate feito via Contas Bancárias (pois não há link claro para o lançamento gerado).

### O que será feito

**1. Reverter saldo ao excluir lançamento (`LancamentosContext.tsx`)**
- No `handleDelete`, antes de deletar, verificar se o lançamento estava `pago/recebido` e tinha `conta_bancaria_id`.
- Se sim, reverter o delta no saldo da conta e registrar movimentação de estorno.
- Isso garante que exclusão de resgates, investimentos, receitas e despesas já pagos reverta corretamente o saldo.

**2. Reverter saldo ao editar lançamento com mudança de valor/conta (`LancamentosContext.tsx`)**
- No `handleSave` (modo edição), se o lançamento anterior estava pago/recebido, reverter o delta antigo e aplicar o novo delta (se continuar pago/recebido).
- Isso permite "corrigir" qualquer operação.

**3. Adicionar tipo "Rentabilidade" ao fluxo de lançamentos**
- Em `TipoSelect.tsx`: adicionar opção "Rentabilidade" (value: `rentabilidade`).
- No `LancamentosContext.tsx`: tratar `rentabilidade` como `tipo: "receita"`, `origem: "rentabilidade_investimento"`, `status: "recebido"`. O delta credita a conta bancária sem afetar o saldo investido.
- No `LancamentosTable.tsx`: badge verde-escuro para rentabilidade.
- No `useDashboardData.tsx`: excluir lançamentos com `origem: "rentabilidade_investimento"` do cálculo de saldo investido (já que é receita, não afeta, mas deve ser claramente rastreado).

**4. Unificar operações — remover lógica duplicada do `ResgateInvestimentoDialog`**
- O dialog de resgate em Contas Bancárias continuará existindo como atalho, mas internamente usará a mesma lógica do `LancamentosContext` (ou será simplificado para apenas abrir o formulário de lançamento com tipo "resgate" pré-selecionado).
- Alternativa mais simples: manter o dialog mas garantir que ele cria lançamentos idênticos aos do fluxo principal, e que a exclusão/edição desses lançamentos na tela de Lançamentos funcione corretamente (ponto 1 e 2 já garantem isso).

**5. Exibir operações de investimento na página de Contas Bancárias**
- No `HistoricoMovimentacoesDialog.tsx`: adicionar tipos `investimento` e `rentabilidade` ao `tipoConfig` para exibir corretamente no histórico de movimentações.

### Arquivos a editar

| Arquivo | Ação |
|---|---|
| `src/contexts/LancamentosContext.tsx` | Reverter saldo no delete e no edit; tratar tipo "rentabilidade" |
| `src/components/lancamentos/form/TipoSelect.tsx` | Adicionar "Rentabilidade" |
| `src/components/lancamentos/LancamentosFormDialog.tsx` | Tratar tipo "rentabilidade" (similar a resgate) |
| `src/components/lancamentos/LancamentosTable.tsx` | Badge para rentabilidade |
| `src/components/contas-bancarias/HistoricoMovimentacoesDialog.tsx` | Adicionar tipos investimento/rentabilidade |
| `src/hooks/useDashboardData.tsx` | Excluir rentabilidade do saldo investido (se necessário) |

### Fluxo de reversibilidade
- **Excluir lançamento pago/recebido** → saldo da conta é revertido automaticamente + log de estorno
- **Editar valor/conta de lançamento pago** → saldo antigo revertido, novo aplicado
- **Mudar status para cancelado/pendente** → já funciona (handleStatus reverte delta)

