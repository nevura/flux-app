-- Track the transaction created when a credit payment is recorded
ALTER TABLE credit_payments ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
