

## Plano: Reestruturar Tipos de Lançamento com Sub-tipos de Investimento e Reajuste Manual

### Contexto
Atualmente o TipoSelect exibe 5 opções (Despesa, Receita, Investimento, Resgate, Rentabilidade). O usuario quer simplificar para 3 tipos principais (Despesa, Receita, Investimento), e ao selecionar "Investimento", um segundo seletor aparece com as sub-operacoes: Novo Investimento, Rentabilidade, Resgate e **Reajuste** (nova funcionalidade para edição manual do saldo investido).

### O que sera feito

**1. Refatorar TipoSelect para 3 opcoes + sub-tipo de investimento**
- `TipoSelect.tsx`: Mostrar apenas Despesa, Receita, Investimento
- Criar novo componente `InvestimentoSubtipoSelect.tsx` com opcoes: Novo Investimento, Rentabilidade, Resgate, Reajuste
- No `LancamentosFormDialog.tsx`: quando tipo = "investimento", exibir o seletor de sub-tipo. O sub-tipo controla o comportamento (resgate, rentabilidade, reajuste, ou investimento padrao)

**2. Novo sub-tipo "Reajuste"**
- Permite o usuario corrigir manualmente o saldo investido (para cima ou para baixo)
- Sera salvo como `tipo: "receita"` ou `tipo: "despesa"` (conforme valor positivo/negativo) com `origem: "reajuste_investimento"`
- No formulario: campo de valor com label "Valor do reajuste" e descricao auto-preenchida "Reajuste manual de investimento"
- O delta do reajuste afeta o calculo de saldo investido no dashboard

**3. Atualizar LancamentosFormDialog**
- Estado local `subtipoInvestimento`: "novo" | "rentabilidade" | "resgate" | "reajuste"
- Quando tipo = "investimento" e subtipo = "novo": comportamento atual de investimento
- Quando subtipo = "resgate": comportamento atual (salva como receita, origem=resgate_investimento)
- Quando subtipo = "rentabilidade": comportamento atual (salva como receita, origem=rentabilidade_investimento)
- Quando subtipo = "reajuste": salva como receita (reajuste positivo) ou despesa (reajuste negativo) com origem=reajuste_investimento. Permite valor negativo para reduzir saldo investido

**4. Atualizar LancamentosContext handleSave**
- Tratar novo sub-tipo "reajuste": definir origem="reajuste_investimento" e ajustar tipo conforme sinal do valor
- Tratar handleEdit para mapear origem "reajuste_investimento" de volta ao sub-tipo correto

**5. Atualizar useDashboardData para considerar reajustes**
- Incluir lancamentos com `origem: "reajuste_investimento"` no calculo do saldo investido (positivos somam, negativos subtraem)

**6. Atualizar badges na LancamentosTable**
- Adicionar badge para "Reajuste" (origem=reajuste_investimento)
- Manter badges existentes para resgate e rentabilidade
- Exibir sub-tipo correto no badge quando tipo base for investimento/receita com origem especial

### Arquivos a criar/editar

| Arquivo | Acao |
|---|---|
| `src/components/lancamentos/form/TipoSelect.tsx` | Reduzir para 3 opcoes |
| `src/components/lancamentos/form/InvestimentoSubtipoSelect.tsx` | Criar — seletor de sub-operacao |
| `src/components/lancamentos/LancamentosFormDialog.tsx` | Adicionar estado subtipo, logica condicional |
| `src/contexts/LancamentosContext.tsx` | Tratar "reajuste" no save/edit, atualizar tipos |
| `src/components/lancamentos/LancamentosTable.tsx` | Badge para reajuste |
| `src/hooks/useDashboardData.tsx` | Incluir reajustes no calculo de saldo investido |
| `src/components/dashboard/PatrimonioChart.tsx` | Considerar reajustes no calculo |

### Fluxo do usuario
1. Novo Lancamento → seleciona "Investimento"
2. Aparece sub-seletor: Novo Investimento / Rentabilidade / Resgate / Reajuste
3. Preenche valor e demais campos (simplificados conforme sub-tipo)
4. Salva — sistema registra com origem adequada e atualiza saldos
5. Na tabela, badge indica o sub-tipo especifico (Investimento, Resgate, Rentabilidade, Reajuste)

