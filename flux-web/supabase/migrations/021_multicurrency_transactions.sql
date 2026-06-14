-- Add currency and exchange_rate to transactions
-- currency: inherited from account at creation time, never changes
-- exchange_rate: rate from transaction currency → user's base display currency at moment of transaction

ALTER TABLE transactions
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN',
  ADD COLUMN exchange_rate NUMERIC(12,6) NOT NULL DEFAULT 1;

-- Backfill: inherit currency from the linked account
UPDATE transactions t
SET currency = a.currency
FROM accounts a
WHERE t.account_id = a.id;
-- Transactions with no account_id (shared expense debts) keep 'MXN' / rate 1
