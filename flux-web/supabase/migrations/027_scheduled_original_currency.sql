-- Allow scheduled transactions to record the original charge currency
-- (e.g. a USD recurring on a MXN account). chargeScheduled will handle
-- the conversion at fire time once exchange_rates coverage is verified.
ALTER TABLE scheduled_transactions ADD COLUMN original_currency TEXT;
