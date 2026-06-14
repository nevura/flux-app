-- Add currency and display_exchange_rate to accounts
-- currency: locked after first transaction (enforced at app level)
-- display_exchange_rate: updated automatically on each transaction, used for balance display conversion

ALTER TABLE accounts
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN',
  ADD COLUMN display_exchange_rate NUMERIC(12,6) NOT NULL DEFAULT 1;

-- Backfill: inherit each account's currency from the owner's profile currency
UPDATE accounts a
SET currency = COALESCE((
  SELECT p.currency FROM profiles p WHERE p.id = a.user_id
), 'MXN');
