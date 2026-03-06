

## Plano: Acelerar Transição de Contas

### Problema Identificado

A troca de empresa faz **duas coisas lentas em sequência**:
1. Chama a Edge Function `switch-empresa` (latência de cold start ~1-3s)
2. Faz `window.location.reload()`, que reinicia toda a app: auth, perfil, roles, plano — **5+ queries sequenciais ao banco**

### Solução

**Eliminar a Edge Function e o reload**. A atualização de `perfis.empresa_id` pode ser feita diretamente pelo cliente (RLS já permite `perfis_update_self` para o próprio usuário). Após o update, atualizar o estado local sem recarregar a página.

### Alterações

**1. `src/contexts/AuthContext.tsx` — Refatorar `switchEmpresa`**

Substituir a chamada à Edge Function por um update direto na tabela `perfis` e atualizar o estado em memória sem `window.location.reload()`:

```typescript
const switchEmpresa = async (targetEmpresaId: string) => {
  try {
    // Verificar se pertence à empresa (já temos a lista local)
    const targetEmpresa = empresas.find(e => e.empresa_id === targetEmpresaId);
    if (!targetEmpresa && !isSuperAdmin) {
      toast.error("Você não pertence a esta empresa");
      return;
    }

    // Update direto — sem Edge Function
    const { error } = await supabase
      .from("perfis")
      .update({ empresa_id: targetEmpresaId })
      .eq("id", user!.id);

    if (error) throw error;

    // Atualizar estado local
    setEmpresaId(targetEmpresaId);
    setUserRole(targetEmpresa?.role || userRole);
    setUserProfile(prev => prev ? { ...prev, empresa_id: targetEmpresaId } : prev);

    toast.success("Empresa alterada com sucesso.");
    navigate("/dashboard");
  } catch (error: any) {
    toast.error(error.message || "Erro ao trocar empresa");
  }
};
```

Isso reduz a troca de ~3-5s para ~200-400ms.

**2. Invalidar cache do React Query**

Após trocar empresa, os dados em cache (lançamentos, categorias, etc.) precisam ser recarregados. Adicionar invalidação do `queryClient` após a troca:

```typescript
import { useQueryClient } from "@tanstack/react-query";
// ...
const queryClient = useQueryClient();
// Após o update:
queryClient.invalidateQueries();
```

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/contexts/AuthContext.tsx` | Remover chamada à Edge Function, usar update direto + invalidar queries + remover `window.location.reload()` |

### Sem alterações no banco
A policy `perfis_update_self` já permite que o usuário atualize seu próprio `empresa_id`.

