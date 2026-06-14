-- Add currency to budgets
-- Budget amounts are always in the user's base display currency (profiles.currency)
-- Stored here for reference if the user changes their base currency later

ALTER TABLE budgets
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'MXN';

UPDATE budgets b
SET currency = COALESCE((
  SELECT p.currency FROM profiles p WHERE p.id = b.user_id
), 'MXN');
