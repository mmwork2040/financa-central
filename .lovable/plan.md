## Objetivo

Tornar a detecção de duplicidade na importação mais precisa, exigindo múltiplos indicadores e respeitando que pagamentos repetidos do mesmo cliente em datas diferentes são legítimos.

## Regras de detecção

Comparações só acontecem entre lançamentos do **mesmo `tipo`** (receita só com receita, despesa só com despesa, investimento só com investimento). Isso elimina o caso de uma receita ser marcada como duplicada de uma despesa.

### Indicadores avaliados

1. `mesmoTipo` — pré-requisito obrigatório, não conta como ponto
2. `valorExato` — diferença ≤ 1% ou ≤ R$ 0,01
3. `mesmaData` — **mesmo dia exato** (não janela de dias)
4. `dataProxima` — diferença entre 1 e 3 dias (mais fraco que `mesmaData`)
5. `mesmoCpfCnpj` — CPF/CNPJ extraído da descrição/observações bate com o do cliente/fornecedor existente
6. `mesmaPessoa` — nome normalizado do cliente/fornecedor bate
7. `descricaoSemelhante` — overlap de tokens ≥ 0.6

### Regra de decisão

A **data** é decisiva, conforme pedido:

- Se **não** houver `mesmaData` **nem** `dataProxima` → **nunca** é duplicata (pagamentos repetidos do mesmo cliente em datas diferentes são legítimos).
- Se `mesmoCpfCnpj` **E** (`mesmaData` ou `valorExato`) → duplicata.
- Caso contrário, exige **≥ 3 indicadores** entre: `valorExato`, `mesmaData`, `mesmoCpfCnpj`, `mesmaPessoa`, `descricaoSemelhante`. `dataProxima` conta como meio indicador (substitui `mesmaData` quando precisar combinar com outros).

Exemplos:
- Mesma pessoa + mesma data + valor exato → duplicata
- Mesmo CPF + mesma data → duplicata
- Mesmo valor + descrição parecida, datas diferentes → **não** é duplicata
- Mesmo cliente, mesmo valor, datas diferentes (10/03 e 25/03) → **não** é duplicata (pagamentos recorrentes legítimos)

O motivo exibido lista todos os indicadores que bateram, ex.: "Mesmo CPF/CNPJ + mesma data + valor exato".

## Arquivos afetados

- `src/pages/ImportarDocumentos.tsx`
  - `loadExistingLancamentos`: incluir joins com `clientes` e `fornecedores` para trazer `nome` normalizado e `cpf_cnpj`.
  - `findDuplicates`: reescrever com os indicadores e a regra acima; extrair CPF/CNPJ do item importado via regex sobre descrição/observações; filtrar por `tipo` antes de comparar.

Nenhuma alteração em schema, RLS ou outros componentes.
