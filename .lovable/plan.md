

## Problem

Expenses were paid on "OSV LTDA" but the bank balance (`saldo_atual`) was never debited. This happened because older transactions or bulk operations didn't include balance adjustment logic. The user needs a way to **recalculate** the bank account balance from scratch based on actual transaction data.

## Solution: "Recalcular Saldo" (Recalculate Balance) Feature

Add a reconciliation button on the **Contas Bancárias** page that recalculates `saldo_atual` for any bank account based on its `saldo_inicial` plus all paid/received transactions minus all paid expenses/investments.

### Changes

**1. `src/components/contas-bancarias/RecalcularSaldoDialog.tsx`** (new file)
- Dialog that lists all bank accounts with their current `saldo_atual` vs. the **calculated balance** (`saldo_inicial` + sum of paid receitas - sum of paid despesas/investimentos linked to that account)
- Shows the difference (divergência) for each account
- "Recalcular" button per account (or "Recalcular Todos") that updates `saldo_atual` to the correct calculated value
- Confirmation step before applying

**2. `src/pages/ContasBancarias.tsx`**
- Add a "Recalcular Saldo" button (with `Calculator` icon) next to the existing Extrato/Transferir buttons
- Opens the new `RecalcularSaldoDialog`

### Technical Details

The recalculation query per account:
```sql
-- For each conta_bancaria_id:
-- new_saldo = saldo_inicial 
--   + SUM(valor) WHERE tipo='receita' AND status IN ('pago','recebido')
--   - SUM(valor) WHERE tipo IN ('despesa','investimento') AND status='pago'
```

This is done client-side with two queries:
1. Fetch all `contas_bancarias` (already available)
2. Fetch aggregated lancamentos grouped by `conta_bancaria_id` and `tipo` where status is paid/received

The dialog shows a table: Account | Current Balance | Calculated Balance | Difference — with action buttons to fix divergent accounts.

No database schema changes needed.

