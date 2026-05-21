
## Objetivo

Aumentar a qualidade dos lançamentos importados por IA tratando 5 regras adicionais.

## Mudanças

### 1. Normalização de "Transferência PIX" → PIX

**Edge function `process-document-import` (SYSTEM_PROMPT)**
- Adicionar regra explícita: variações como "Transferência PIX", "TRANSF PIX", "PIX TRANSF", "PIX RECEBIDO/ENVIADO", "Pix" devem ser sempre normalizadas para `forma_pagamento: "PIX"`.
- Categoria "Transferência PIX" deixa de ser sugerida (vira só forma de pagamento; categoria é derivada do contexto real da transação).

**Frontend (`ImportarDocumentos.tsx` e `EditImportItemDialog.tsx`)**
- Função utilitária `normalizeFormaPagamento(raw)` que mapeia variações de PIX, TED, DOC, "Transferência bancária" etc. para o nome canônico cadastrado, antes do auto-match com `formas_pagamento`.

### 2. Conta bancária do upload

**UI da página `ImportarDocumentos`**
- Novo seletor "Conta bancária do(s) documento(s)" no topo da área de upload, carregado de `contas_bancarias` da empresa.
- Padrão: conta marcada como `principal = true`.
- Persistido no estado da sessão de upload (aplica-se a todos os arquivos enviados naquela leva).

**Edge function**
- Novo campo opcional `conta_bancaria_nome` no item extraído. Quando a IA reconhecer no documento o nome/banco/agência/conta correspondente a uma das contas da empresa (lista enviada pelo cliente no payload), retornar esse nome.
- Adicionar ao SYSTEM_PROMPT instrução para reconhecer cabeçalhos de extratos/comprovantes contendo banco + agência/conta e mapear para uma das contas conhecidas.

**Frontend — payload e salvamento**
- Enviar à edge function a lista resumida `contasBancarias: [{id, nome, banco, agencia, conta}]`.
- Match: se IA retornou `conta_bancaria_nome` e bater com alguma conta, usar essa; caso contrário, usar a conta selecionada manualmente.
- Adicionar `conta_bancaria_id` ao payload de `lancamentos` no insert (linha ~745 em `ImportarDocumentos.tsx`).
- Mostrar a conta resolvida no card de cada item e no `EditImportItemDialog` (novo campo Select "Conta bancária").

### 3. Transferência entre contas da própria empresa

**Edge function**
- Novo valor para `tipo_sugerido`: `"transferencia"` (além de receita/despesa).
- Regras no prompt: identificar quando contraparte do PIX/TED for outra conta da própria empresa (lista enviada no payload, comparando por nome/CNPJ/banco) — marcar como transferência interna.
- Campo extra `conta_destino_nome` para a contraparte.

**Frontend**
- No `EditImportItemDialog`, quando `tipo_sugerido === "transferencia"`:
  - Esconder Cliente/Fornecedor e Categoria.
  - Mostrar dois selects: "Conta origem" e "Conta destino" (ambos de `contas_bancarias`).
- No `saveSelected` (linha ~726 em `ImportarDocumentos.tsx`), branch para transferência:
  - Cria **dois lançamentos** espelhados via `recorrencia_grupo_id` compartilhado:
    - Despesa na conta origem (status `pago`, data_pagamento = data).
    - Receita na conta destino (status `recebido`, data_pagamento = data).
  - Categoria auto-criada/reutilizada "Transferência entre contas" (uma para receita, outra para despesa).
  - `forma_pagamento` mantida (PIX/TED).

### 4. Data já é data de pagamento (documento histórico)

- No salvamento de lançamentos (linha ~749 em `ImportarDocumentos.tsx`):
  - `data_vencimento = data_pagamento = item.data` (ou hoje, fallback).
  - `status = "pago"` (despesa/investimento) ou `"recebido"` (receita) — alinhado à memória existente de automação de status.
- No `EditImportItemDialog`: o campo "Data" passa a rotular como "Data da transação" e uma nota indica "será usada como vencimento e pagamento".

### 5. Descrição original do documento

**Edge function**
- Ajustar prompt para que `descricao` seja **literal** o texto da transação (campo "Histórico" do extrato, "Descrição" do comprovante PIX, mensagem do PIX, etc.), truncado em 255 caracteres. Sem reescritas/embelezamento.
- Quando o documento não tem descrição própria (ex.: cupom só com itens), usar fallback curto baseado no fornecedor/cliente + ação ("Compra em X", "Recebimento de Y").

**Frontend (`EditImportItemDialog.tsx`)**
- Remover o auto-fill atual que monta "Recebimento de R$X - Fulano" quando `descricao` está vazia (linhas 65–78). Manter só o fallback mínimo (ação + entidade) e sem o valor.

## Detalhes técnicos

- Schema: nenhuma migração nova. Reutiliza `lancamentos.conta_bancaria_id` (já existe) e `recorrencia_grupo_id` para agrupar par de transferência.
- Categoria "Transferência entre contas" criada on-the-fly por `findOrCreateCategoria` (já existente) com `tipo` correto de cada lado.
- Cache de `contas_bancarias` carregado junto com fornecedores/clientes/categorias atuais no `useEffect` de bootstrap da página.
- Payload da edge function ganha duas chaves novas: `contasBancarias` e `empresaNome` (para reconhecer contraparte da própria empresa em transferências).

## Fora de escopo

- Não altera fluxo de vendas digitais.
- Não muda como `movimentacoes_conta` é gerada (continua via trigger existente de lançamentos).
