-- destination_amount: for cross-currency transfers, stores the credited amount in the destination
-- account's currency. NULL = same-currency transfer (destination gets t.amount).
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS destination_amount numeric;
