

## Plano: Meses de Caixa com Projeção Fiel (Recorrências + Parcelas)

### Problema Atual
O cálculo de "Meses de Caixa" usa apenas a média histórica de despesas pagas nos últimos 3 meses (`caixa / mediaMensalDespesas`). Isso ignora despesas e receitas futuras já previstas — parcelas, recorrências e lançamentos pendentes.

### Nova Lógica

Em vez de dividir caixa pela média histórica, simular mês a mês o fluxo de caixa futuro considerando:

1. **Lançamentos reais futuros** — buscar todos os lançamentos com `data_vencimento` futura e status pendente/aberto (inclui parcelas já criadas no banco)
2. **Recorrências sem parcelas** — buscar lançamentos com `recorrente = true` e sem `total_parcelas`, projetar virtualmente para cada mês futuro até `recorrencia_fim` (ou até 12 meses se indefinido)
3. **Simulação mês a mês**: começar com `caixaAtual`, somar receitas e subtrair despesas de cada mês. Contar quantos meses o caixa permanece positivo = "meses de caixa"

### Arquivos a Editar

**`src/hooks/useDashboardData.tsx`** — Reescrever o bloco de cálculo de `mesesDeCaixa` (linhas 198-211):
- Buscar todos os lançamentos futuros pendentes (sem limite de mês)
- Buscar lançamentos recorrentes ativos (sem `total_parcelas`)
- Criar função `calcularFluxoMensal(mes)` que soma lançamentos reais + projeções de recorrências para aquele mês
- Iterar até 12 meses no futuro: `runningCaixa += receitasMes - despesasMes`. Quando `runningCaixa <= 0`, parar e retornar o número de meses

**`src/components/relatorios/CaixaView.tsx`** — Mesma lógica para o cálculo de `mesesDeCaixa` (linhas 30-44) e para a projeção do gráfico (linhas 46-73):
- Usar a mesma abordagem de simulação mês a mês com recorrências virtuais
- O gráfico de projeção já itera mês a mês, mas não inclui recorrências — adicionar projeção de recorrências em cada mês

### Detalhes da Projeção de Recorrências

Para cada lançamento com `recorrente = true` e `total_parcelas = null`:
- Verificar se o mês sendo calculado está entre `data_vencimento` (início) e `recorrencia_fim` (fim, ou +12 meses se null)
- Se sim, adicionar `valor` como despesa ou receita projetada naquele mês
- Verificar se já existe um lançamento real naquele mês com mesma descrição para evitar duplicidade

