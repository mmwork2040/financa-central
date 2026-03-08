

## Problem

The **bulk pay** (`handleBulkPay`) in `LancamentosTable.tsx` only updates the `status` field of each transaction but **does NOT adjust the bank account balance** (`saldo_atual`). 

The single-item status change (`handleStatus` in `LancamentosContext.tsx`) correctly calculates a delta and updates `contas_bancarias.saldo_atual`, but the bulk operation skips this entirely.

## Root Cause

Lines 86-101 of `LancamentosTable.tsx`:
```typescript
const handleBulkPay = async () => {
  for (const l of selectedLancamentos) {
    const newStatus = l.tipo === "receita" ? "recebido" : "pago";
    await supabase.from("lancamentos").update({ status: newStatus }).eq("id", l.id!);
    // ← Missing: balance adjustment for conta_bancaria_id
  }
};
```

## Plan

**Edit `src/components/lancamentos/LancamentosTable.tsx`** — Update `handleBulkPay` to, for each selected transaction:

1. Check if the transaction has a `conta_bancaria_id` and is currently `pendente`
2. Calculate delta: `+valor` for receita, `-valor` for despesa/investimento
3. Fetch current `saldo_atual` from `contas_bancarias`
4. Update `saldo_atual` with the delta
5. Then update the lancamento status

This mirrors the existing logic in `LancamentosContext.tsx` `handleStatus` (lines 789-818).

The same fix applies to `handleBulkDelete` — when deleting a paid/received transaction, the balance should be reversed. However, looking at the current code, bulk delete only targets pending items (selectable filter on line 146), so no balance adjustment is needed there.

No database changes required.

