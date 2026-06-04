-- ── SOURCE COLUMN ON TRANSACTIONS ────────────────────────────────────────────
-- Tracks how the transaction was created: 'apple_pay', 'quick_register', or NULL (manual/web).
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT;

-- Backfill: Apple Pay transactions are identifiable by notes field.
UPDATE transactions
SET source = 'apple_pay'
WHERE source IS NULL
  AND notes ILIKE '%apple pay%';

-- ── IOWE BALANCE FIX ──────────────────────────────────────────────────────────
-- Previously, is_payable transactions were saved with adjustment = 0 (deferred balance).
-- The new behavior applies the adjustment immediately at creation so the balance reflects
-- real economic exposure. Backfill existing rows to match the new semantics.
UPDATE transactions
SET adjustment = CASE
  WHEN type = 'TR-GASTO'   THEN -amount
  WHEN type = 'TR-INGRESO' THEN  amount
  ELSE 0
END
WHERE is_payable = true
  AND adjustment = 0
  AND type IN ('TR-GASTO', 'TR-INGRESO');
