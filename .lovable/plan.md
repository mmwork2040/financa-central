## Plano de Correção

### 1. Valor de venda Hotmart = comissão real recebida

**Problema:** `parseHotmart` em `supabase/functions/webhook-receiver/index.ts` lê `purchase.commission.value`, que normalmente não existe no payload real da Hotmart. O payload traz `purchase.commissions: [{ source, value, currency_value }]` com fontes como `PRODUCER`, `CO_PRODUCER`, `AFFILIATE`, `MARKETPLACE`. Sem isso, `valorComissao` cai no fallback do valor bruto e o lançamento é criado com o preço cheio do produto.

**Correção:**
- Em `parseHotmart`, calcular `valorComissao` somando os itens de `purchase.commissions` cuja `source` seja do dono da conta (`PRODUCER` + `CO_PRODUCER` quando aplicável; `AFFILIATE` quando a venda é de afiliado). Estratégia segura: somar `PRODUCER` + `CO_PRODUCER`; se zero, usar `AFFILIATE`; se ainda zero, manter o fallback atual.
- `taxa` = `valor_bruto - valor_comissao` quando a comissão for resolvida pela lista.
- O bloco de criação do lançamento (linhas 616–627) já usa `valor_comissao` quando > 0; nenhuma mudança adicional necessária além do parser.
- Adicionar um pequeno log com a fonte usada para auditoria.

### 2. Visualização do certificado digital enviado

**Problema:** Em `src/components/configuracoes/ConfiguracaoFiscal.tsx` (bucket privado `certificados`, caminho fixo `{empresaId}/certificado.pfx`), o usuário só vê "Certificado digital enviado", sem confirmação do arquivo correto.

**Correção (apenas frontend):**
- Após o upload e no load inicial, buscar metadados via `supabase.storage.from('certificados').list(empresaId)` para obter `name`, `updated_at` e `metadata.size` do arquivo.
- Exibir no card verde: nome do arquivo, tamanho (KB) e data/hora de upload em pt-BR (DD/MM/AAAA HH:mm).
- Botão "Baixar para conferir" gerando `createSignedUrl(path, 60)` e abrindo em nova aba — assim o usuário valida que subiu o `.pfx` certo (CNPJ/razão social) abrindo localmente.
- Mensagens de erro amigáveis caso o arquivo não exista mais.

### 3. Dados completos do cliente Hotmart + emissão de NF

**Problema:** O parser só salva `name`, `email`, `phone`, `document`. Endereço e demais campos são ignorados, então o cliente criado no sistema fica incompleto e a emissão de NF via Spedy falha por falta de endereço.

**Correção no `webhook-receiver`:**
- Estender `SaleData` com objeto `cliente_endereco_struct` contendo `cep, rua, numero, complemento, bairro, cidade, estado, pais` extraído de `buyer.address` (Hotmart envia `address`, `address_number`, `address_comp`, `neighborhood`, `city`, `state`, `zipcode`, `country`).
- Concatenar uma string legível em `cliente_endereco` (campo já existente em `vendas_digitais`).
- No bloco de auto-cadastro de cliente (linhas 544–563):
  - Buscar cliente também por `cpf_cnpj` (documento) quando disponível, para evitar duplicidade.
  - No `INSERT`, gravar `telefone`, `cpf_cnpj`, `endereco` (string) e os campos estruturados (`cep, rua, numero, complemento, bairro, cidade, estado`) — colunas já existem na tabela `clientes`.
  - Quando o cliente já existir, fazer `UPDATE` apenas dos campos atualmente vazios (não sobrescrever dados editados pelo usuário).
- Replicar o mesmo enriquecimento para os outros parsers que já trazem endereço (Kiwify/Hubla) quando o payload disponibilizar — escopo principal: Hotmart.

**Emissão de NF na página de Notas Fiscais:**
- `NotasFiscais.tsx` hoje filtra `invoice_status IS NOT NULL`, ou seja, só lista vendas que já têm tentativa de emissão. Vendas vindas do webhook entram com `invoice_status = 'PENDING_EMISSION'` (default da coluna), então já aparecem — confirmar o filtro continua válido após as mudanças.
- Garantir que `EmitirNotaManualDialog` permita selecionar qualquer venda com `cliente_id` preenchido e endereço válido. Adicionar aviso no card da venda quando faltar CPF/CNPJ ou endereço, com link para editar o cliente — assim o usuário sabe o que falta antes de chamar `spedy-emit`.
- Nenhuma mudança no `spedy-emit` é necessária; ele já lê o cliente associado.

### Detalhes técnicos

- Arquivos alterados:
  - `supabase/functions/webhook-receiver/index.ts` (parser Hotmart + auto-cadastro cliente)
  - `src/components/configuracoes/ConfiguracaoFiscal.tsx` (metadados + signed URL)
  - `src/pages/NotasFiscais.tsx` e/ou `src/components/notas-fiscais/EmitirNotaManualDialog.tsx` (avisos de campos faltantes)
- Sem mudanças de schema: todas as colunas necessárias (`cliente_endereco`, `cep`, `rua`, `numero`, etc.) já existem.
- RLS: nenhum impacto; bucket `certificados` continua privado, acesso via signed URL temporária.

### Validação após implementação
1. Reenviar webhook de teste Hotmart com `commissions[]` → conferir `vendas_digitais.valor_comissao` e `lancamentos.valor` iguais à comissão.
2. Subir um `.pfx` em ConfiguracaoFiscal → ver nome/data/tamanho e baixar via botão.
3. Webhook Hotmart com endereço → conferir cliente criado com CPF, telefone, endereço completo e venda visível em Notas Fiscais para emissão.
