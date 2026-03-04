

## Plano: Sincronizar todo o sistema quando lançamentos são modificados

### Problema

Quando o usuário deleta ou cria lançamentos, o Dashboard e os Relatórios não atualizam automaticamente. Cada módulo (Lançamentos, Dashboard, Relatórios) opera com hooks independentes que não se comunicam entre si. Além disso, `handleDelete` no `LancamentosContext` remove o item apenas do state local sem refazer a query ao banco.

### Solução

**1. `src/contexts/LancamentosContext.tsx`** — Garantir refetch completo em todas as operações:

- No `handleDelete`: adicionar `fetchLancamentos()` após a exclusão (atualmente só faz `filter` local)
- No `handleStatus`: substituir a atualização local por `fetchLancamentos()` para garantir dados frescos do banco após mudanças de saldo e cancelamento em cadeia

**2. `src/hooks/useDashboardData.tsx`** — Adicionar listener de realtime:

- Usar `supabase.channel()` com `postgres_changes` na tabela `lancamentos` para escutar `INSERT`, `UPDATE` e `DELETE`
- Ao receber qualquer evento, chamar `fetchDashboardData()` novamente
- Cleanup do channel no unmount

**3. `src/hooks/useRelatoriosData.tsx`** — Adicionar listener de realtime:

- Mesmo padrão: escutar `postgres_changes` na tabela `lancamentos`
- Refazer `fetchRelatoriosData()` ao receber eventos
- Cleanup no unmount

**4. Migration SQL** — Habilitar realtime na tabela `lancamentos`:

- `ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos;`

### Resultado

Qualquer criação, edição, exclusão ou mudança de status em lançamentos será refletida automaticamente no Dashboard, Relatórios e lista de Lançamentos, sem necessidade de recarregar a página.

### Arquivos afetados
- `src/contexts/LancamentosContext.tsx`
- `src/hooks/useDashboardData.tsx`
- `src/hooks/useRelatoriosData.tsx`
- Migration SQL (habilitar realtime)

