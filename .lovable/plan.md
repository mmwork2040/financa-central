

## Plano: Integrar Resgate de Investimento no Fluxo de Lançamentos

### Contexto
O resgate de investimento existe apenas como um dialog separado na página de Contas Bancarias. O usuario quer que funcione pelo mesmo fluxo de lancamentos, adicionando "Resgate" como uma opcao no TipoSelect, assim como ja existe "Investimento".

### O que sera feito

**1. Adicionar tipo "resgate" no TipoSelect**
- Arquivo: `src/components/lancamentos/form/TipoSelect.tsx`
- Adicionar `<SelectItem value="resgate">Resgate de Investimento</SelectItem>`

**2. Atualizar LancamentosContext para suportar tipo "resgate"**
- Arquivo: `src/contexts/LancamentosContext.tsx`
- No `handleSave`: quando tipo for `resgate`, salvar como `tipo: "receita"` com `origem: "resgate_investimento"` e status `recebido`
- No delta de saldo: tratar resgate como receita (credita a conta bancaria)
- No `handleStatus`: tratar tipo resgate corretamente

**3. Atualizar LancamentosFormDialog**
- Arquivo: `src/components/lancamentos/LancamentosFormDialog.tsx`
- Quando tipo = "resgate": auto-setar status "recebido", mostrar saldo investido disponivel como informacao, validar que valor nao excede saldo investido
- Ocultar campos desnecessarios (cliente/fornecedor) para resgate

**4. Atualizar PatrimonioChart para considerar resgates**
- Arquivo: `src/components/dashboard/PatrimonioChart.tsx`
- Buscar lancamentos com `origem = 'resgate_investimento'` e subtrair do investido acumulado

**5. Atualizar filtros e labels**
- `LancamentosContext`: incluir "resgate" no tipo de filtro
- `LancamentosTable` / badges: exibir label "Resgate" com cor propria para lancamentos com origem `resgate_investimento`

### Fluxo do usuario
1. Abre "Novo Lancamento"
2. Seleciona tipo "Resgate de Investimento"
3. Informa valor e conta bancaria destino
4. Sistema valida contra saldo investido
5. Cria lancamento tipo=receita, origem=resgate_investimento, status=recebido
6. Credita saldo da conta bancaria
7. Dashboard reflete reducao no Saldo Investido

### Arquivos a editar
| Arquivo | Acao |
|---|---|
| `src/components/lancamentos/form/TipoSelect.tsx` | Adicionar opcao "resgate" |
| `src/contexts/LancamentosContext.tsx` | Tratar resgate no save/status |
| `src/components/lancamentos/LancamentosFormDialog.tsx` | UI para resgate (saldo, validacao) |
| `src/components/dashboard/PatrimonioChart.tsx` | Considerar resgates no calculo |
| `src/components/lancamentos/LancamentosTable.tsx` | Badge/label para resgate |

