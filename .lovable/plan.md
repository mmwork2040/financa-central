

## Problema

A listagem de usuários busca da tabela `perfis` e depende da RLS `perfis_select` que filtra por `perfis.empresa_id = get_user_empresa_id(auth.uid())`. Porém, `perfis.empresa_id` representa a **empresa ativa atual** do usuário, não a empresa à qual ele pertence. Se um usuário troca para a empresa B, ele desaparece da lista da empresa A e aparece na lista da empresa B.

A fonte correta de pertencimento é a tabela `user_roles`, que registra explicitamente quais empresas cada usuário pode acessar.

## Correção

**Arquivo: `src/services/userService.ts` — função `fetchUsersData`**

Para usuários não-super-admin:
1. Primeiro buscar os `user_id`s da tabela `user_roles` filtrados pela empresa ativa do usuário (`empresaId`)
2. Usar esses IDs para filtrar os perfis com `.in('id', userIds)`
3. Isso garante que apenas usuários com vínculo real à empresa apareçam na lista

Para super admin: manter o comportamento atual (ver todos).

**Mudanças necessárias:**

1. **`fetchUsersData`** — receber `empresaId` como parâmetro e, para não-super-admin, buscar `user_roles` da empresa e filtrar perfis pelos IDs encontrados
2. **`useUsers.ts`** — passar `empresaId` para `fetchUsersData`

Nenhuma alteração de banco de dados é necessária — a tabela `user_roles` já tem os dados corretos e as políticas RLS já filtram por empresa.

