-- ── CREDIT CARD PAYMENTS (pagos TDC) ─────────────────────────────────────────
-- Tracks monthly credit card payment status per account.
-- One record per (user, account, year, month).
CREATE TABLE credit_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id        TEXT    NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year              INTEGER NOT NULL,
  month             INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount            NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_type      TEXT    NOT NULL DEFAULT 'transfer'
                            CHECK (payment_type IN ('transfer', 'deposit')),
  source_account_id TEXT    REFERENCES accounts(id),
  notes             TEXT,
  paid_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, account_id, year, month)
);

CREATE INDEX idx_credit_payments_user_period ON credit_payments (user_id, year, month);

ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own credit_payments" ON credit_payments FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER trg_credit_payments_updated_at
  BEFORE UPDATE ON credit_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
