

## Plan: Add "Saldo em Caixa" to Lancamentos Summary

### What
Add a 5th summary card "Saldo em Caixa" to the Lancamentos page that shows the real-time sum of all `contas_bancarias.saldo_atual`. This value auto-updates when transactions are executed (paid/received) since the existing realtime listener already refreshes data on lancamentos changes.

### Changes

**1. `src/components/lancamentos/LancamentosSummary.tsx`**
- Import `supabase` client and add a `useState` + `useEffect` to fetch `SUM(saldo_atual)` from `contas_bancarias`
- Add a realtime subscription on `contas_bancarias` table to auto-refresh the balance when bank account balances change (triggered by bulk status changes / payments)
- Add a 5th `SummaryCard` with icon `Landmark`, showing the current cash balance
- Change grid from `md:grid-cols-4` to `md:grid-cols-5` to accommodate the new card

**2. Layout**
- On mobile: stays 2 columns (cards wrap naturally)
- On desktop: 5 columns for the 5 summary cards

### Technical Details
- The `contas_bancarias.saldo_atual` is already automatically updated by the system when transactions are marked as paid/received
- A realtime listener on `contas_bancarias` ensures the card updates immediately after bulk operations that change bank balances
- No database changes needed

