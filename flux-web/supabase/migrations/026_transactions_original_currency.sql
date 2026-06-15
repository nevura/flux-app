-- Support for recording the original charge currency on any transaction
-- e.g. a USD charge on a MXN account: original_amount=50, original_currency='USD',
--      amount=875 (converted to account currency at time of entry)
ALTER TABLE transactions
  ADD COLUMN original_amount   NUMERIC(15,2),
  ADD COLUMN original_currency TEXT;
