

## Exclusão de dados de teste da Hotmart

Foram identificados os seguintes registros de teste no banco:

### Vendas Digitais (6 registros)
| Produto | Cliente | Valor | Data |
|---------|---------|-------|------|
| Curso Teste | Teste Hotmart | R$9.900 | 21/02/2026 |
| Curso Teste | Teste Hotmart | R$9.900 | 21/02/2026 |
| Curso Marketing | Maria Silva | R$15.000 | 27/11/2017 |
| Curso Marketing | Maria Silva | R$15.000 | 27/11/2017 |
| Produto test postback2 | Teste Comprador | R$1.500 | 27/11/2017 |
| Produto test postback2 | Teste Comprador | R$1.500 | 27/11/2017 |

### Lançamentos vinculados (3 registros)
- Hotmart - Curso Teste (R$9.900)
- Hotmart - Curso Marketing (R$15.000)
- Hotmart - Produto test postback2 (R$1.500)

## Plano

1. **Excluir lançamentos de teste** -- DELETE dos 3 lançamentos com origem `integracao` referentes a esses produtos
2. **Excluir vendas digitais de teste** -- DELETE dos 6 registros de vendas digitais identificados acima (IDs específicos)
3. **Verificar recebimentos_digitais** -- Checar e excluir eventuais registros na tabela `recebimentos_digitais` vinculados a essas vendas

Nenhuma alteração de schema necessária, apenas exclusão de dados via ferramenta de insert/data.

