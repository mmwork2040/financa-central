

## Plano: Transformar "Vendas Digitais" em "Vendas" com cadastro manual e exportação

### Resumo
Renomear "Vendas Digitais" para "Vendas", permitir registro manual de vendas com dados completos do cliente, e adicionar exportação para contabilidade.

### Etapa 1 -- Schema: Adicionar colunas na tabela `vendas_digitais`
Adicionar campos para suportar vendas manuais e dados completos do cliente:
- `cliente_telefone` (text, nullable)
- `cliente_email` (text, nullable)  
- `cliente_documento` (text, nullable)
- `cliente_endereco` (text, nullable)
- `observacoes` (text, nullable)
- `origem` (text, default 'manual') -- para distinguir manual vs integracao
- `cliente_id` (uuid, nullable) -- link opcional ao cadastro de clientes

### Etapa 2 -- Renomear referências no frontend
- **Sidebar**: "Vendas Digitais" -> "Vendas"
- **Rota**: manter `/vendas-digitais` por compatibilidade ou criar redirect
- **Página**: atualizar titulo e subtitulo

### Etapa 3 -- Criar formulário de nova venda
Modal/dialog para registrar venda manual com campos:
- Produto, valor bruto, taxa, valor liquido (calculado automaticamente)
- Data da venda, status
- Cliente (select do cadastro existente ou criar novo inline)
- Dados do cliente: nome, telefone, email, documento, endereço
- Observações
- Plataforma como "manual" por padrão

### Etapa 4 -- Criar modal de quick-add cliente
Permitir criar cliente diretamente do formulário de venda (similar ao `QuickAddClienteModal` existente).

### Etapa 5 -- Melhorar listagem de vendas
Expandir os cards para mostrar mais dados: telefone, email, documento do cliente, observações. Adicionar botão "Nova Venda".

### Etapa 6 -- Exportação para contabilidade
Usar o pattern existente (`ExportDropdown` + `exportToCSV`/`exportToPDF`) para exportar vendas com todos os campos relevantes: data, produto, cliente, documento, valor bruto, taxa, valor liquido, status, plataforma, observações.

### Etapa 7 -- Webhook-receiver: preencher novos campos
Atualizar o parser do Hotmart (e outros) para preencher `cliente_email`, `cliente_documento`, `cliente_telefone` quando disponíveis no payload.

### Arquivos afetados
- **Migration SQL**: adicionar colunas em `vendas_digitais`
- `src/components/Sidebar.tsx`: renomear menu
- `src/pages/VendasDigitais.tsx`: refatorar como página "Vendas" completa
- Novo: `src/components/vendas/VendaFormDialog.tsx` -- formulário de nova venda
- Novo: `src/components/vendas/VendasExport.ts` -- lógica de exportação
- `supabase/functions/webhook-receiver/index.ts`: preencher campos extras

