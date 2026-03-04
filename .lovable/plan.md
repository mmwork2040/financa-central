

## Plano: Remover atalhos e tornar cards clicáveis

### Mudanças em `src/pages/Dashboard.tsx`

1. **Remover import e uso do `DashboardShortcuts`** — deletar a linha de import e o `<DashboardShortcuts />` do JSX

2. **Tornar os cards de dados clicáveis** — envolver cada Card com `onClick={() => navigate("/transactions")}` e adicionar `cursor-pointer`:
   - "Você já recebeu" → `/transactions`
   - "Você já pagou" → `/transactions`
   - "Receita Pendente" → `/transactions`
   - "Contas a Pagar" → `/transactions`
   - "Saldo do mês" → `/transactions`
   - "Caixa Previsto" → `/transactions`

3. **Adicionar `useNavigate`** ao `DashboardContent` (já importado via react-router-dom no projeto)

### Arquivo `src/components/dashboard/DashboardShortcuts.tsx`
- Pode ser mantido no projeto (sem uso) ou removido. Não será mais referenciado.

