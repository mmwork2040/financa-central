

## Plano: Corrigir lançamentos não funcionando em nova empresa

### Diagnóstico

O erro `"invalid input syntax for type uuid: ''"` indica que `empresaId` está como string vazia `""` no momento do insert. Isso acontece porque:

1. Ao criar uma nova empresa e recarregar a página, o `fetchUserRoles` no `AuthContext` pode retornar antes do perfil estar atualizado, resultando em `empresaId` vazio ou inconsistente.
2. O `handleSave` em `LancamentosContext` usa `empresaId` diretamente sem validar se é um UUID válido.

### Mudanças

#### 1. `src/contexts/LancamentosContext.tsx`
- No `handleSave`, adicionar validação antes do insert: se `empresaId` for falsy ou string vazia, bloquear a operação com toast de erro ("Empresa não selecionada").
- Aplicar a mesma validação nos dois caminhos de insert (parcelado e único/recorrente).

#### 2. `src/contexts/AuthContext.tsx`
- No `fetchUserRoles`, garantir que `setEmpresaId` nunca receba string vazia — se `activeEmpresaId` for falsy, definir como `null`.
- No `fetchUserProfile`, se `data.empresa_id` for string vazia, tratar como `null`.

#### 3. `supabase/functions/create-empresa/index.ts`
- Verificar que o `update` no perfil realmente grava o novo `empresa_id` — a function parece correta, mas vale garantir que o `userId` está correto e o update não falha silenciosamente.

### Arquivos afetados
- `src/contexts/LancamentosContext.tsx` — validação de `empresaId` antes de inserir
- `src/contexts/AuthContext.tsx` — proteção contra `empresaId` vazio

