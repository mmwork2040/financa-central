

## Plano: Campo de Pesquisa na aba de Lançamentos

Adicionar um campo de busca textual na página de Lançamentos que filtra client-side por descrição, valor, nome do fornecedor, nome do cliente, nome da categoria e nome do projeto.

### Implementação

**1. `src/contexts/LancamentosContext.tsx`**
- Adicionar estado `searchQuery` (string) e `setSearchQuery` ao contexto
- Expor ambos na interface `LancamentosContextType`

**2. `src/components/lancamentos/LancamentosContainer.tsx`**
- Importar `searchQuery` do contexto
- Filtrar `lancamentos` localmente antes de passar para a tabela: busca em `descricao`, `valor` (formatado), `fornecedor.nome`, `cliente.nome`, `categoria.nome`, `projeto.nome`
- Passar os lancamentos filtrados para exibição

**3. `src/components/lancamentos/LancamentosHeader.tsx`**
- Adicionar um `Input` com ícone `Search` na barra de ações, entre os botões existentes e o botão "Novo Lançamento"
- Conectar ao `searchQuery` / `setSearchQuery` do contexto
- Estilo: pill input com ícone, consistente com o design system glass verde

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/LancamentosContext.tsx` | Adicionar `searchQuery` + `setSearchQuery` |
| `src/components/lancamentos/LancamentosHeader.tsx` | Adicionar input de busca |
| `src/components/lancamentos/LancamentosContainer.tsx` | Filtrar lancamentos pelo searchQuery |

### Lógica de filtro
A busca será case-insensitive e verificará se o termo aparece em qualquer um dos campos: descrição, valor formatado (ex: "1.500"), fornecedor, cliente, categoria ou projeto.

