-- ============================================
-- FLUX WEB APP — INITIAL SCHEMA
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── PROFILES ──────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  timezone    TEXT    NOT NULL DEFAULT 'America/Mexico_City',
  currency    TEXT    NOT NULL DEFAULT 'MXN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SHORTCUT API TOKENS ───────────────────────────────────────────────────────
CREATE TABLE shortcut_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  name         TEXT NOT NULL DEFAULT 'Mi Atajo',
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CATEGORIES ────────────────────────────────────────────────────────────────
-- user_id NULL = default category (visible to all)
CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  icon_id     TEXT    NOT NULL DEFAULT 'IC-009',
  color_id    TEXT    NOT NULL DEFAULT 'COL-21',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ACCOUNTS ──────────────────────────────────────────────────────────────────
CREATE TABLE accounts (
  id                TEXT PRIMARY KEY,
  user_id           UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT    NOT NULL,
  payment_method_id TEXT    NOT NULL DEFAULT 'MP-EFECTIVO',
  color_id          TEXT    NOT NULL DEFAULT 'COL-01',
  payment_day       INTEGER,       -- credit card billing day
  credit_limit      NUMERIC(14,2), -- credit card limit
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INTEGER NOT NULL DEFAULT 100,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PEOPLE ────────────────────────────────────────────────────────────────────
CREATE TABLE people (
  id         TEXT PRIMARY KEY,
  user_id    UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  phone      TEXT,
  is_me      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SCHEDULED TRANSACTIONS (planificados) ─────────────────────────────────────
CREATE TABLE scheduled_transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                   TEXT    NOT NULL,
  type                   TEXT    NOT NULL CHECK (type IN ('TR-GASTO','TR-INGRESO','TR-TRANSFER')),
  amount                 NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  category_id            TEXT    REFERENCES categories(id),
  account_id             TEXT    NOT NULL REFERENCES accounts(id),
  destination_account_id TEXT    REFERENCES accounts(id),
  frequency_num          INTEGER NOT NULL DEFAULT 1,
  frequency_unit         TEXT    NOT NULL DEFAULT 'mes' CHECK (frequency_unit IN ('dia','semana','mes','año')),
  payment_day            INTEGER,
  notification_days      INTEGER NOT NULL DEFAULT 1,
  status                 TEXT    NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO','PAUSADO','CANCELADO')),
  next_charge_date       DATE,
  last_charge_date       DATE,
  last_notification_date DATE,
  split_data             JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TRANSACTIONS (movimientos) ────────────────────────────────────────────────
CREATE TABLE transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept              TEXT    NOT NULL,
  type                 TEXT    NOT NULL CHECK (type IN ('TR-GASTO','TR-INGRESO','TR-TRANSFER')),
  amount               NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  adjustment           NUMERIC(14,2) NOT NULL, -- signed delta applied to account balance
  category_id          TEXT    REFERENCES categories(id),
  account_id           TEXT    NOT NULL REFERENCES accounts(id),
  transaction_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_validated         BOOLEAN NOT NULL DEFAULT TRUE,
  scheduled_id         UUID    REFERENCES scheduled_transactions(id) ON DELETE SET NULL,
  split_data           JSONB,  -- { mode, splitMode, data: [{id,nombre,value,paidAmount,paidStatus}] }
  exclude_from_budget  BOOLEAN NOT NULL DEFAULT FALSE,
  is_receivable        BOOLEAN NOT NULL DEFAULT FALSE, -- me deben
  is_payable           BOOLEAN NOT NULL DEFAULT FALSE, -- les debo
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BUDGETS (presupuestos) ────────────────────────────────────────────────────
CREATE TABLE budgets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month      INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year       INTEGER NOT NULL CHECK (year > 2000),
  amount     NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_transactions_user_date     ON transactions (user_id, transaction_date DESC);
CREATE INDEX idx_transactions_account       ON transactions (account_id);
CREATE INDEX idx_transactions_category      ON transactions (category_id);
CREATE INDEX idx_transactions_scheduled     ON transactions (scheduled_id) WHERE scheduled_id IS NOT NULL;
CREATE INDEX idx_transactions_split         ON transactions USING GIN (split_data) WHERE split_data IS NOT NULL;
CREATE INDEX idx_scheduled_user_next        ON scheduled_transactions (user_id, next_charge_date);
CREATE INDEX idx_budgets_user_period        ON budgets (user_id, year, month);
CREATE INDEX idx_shortcut_tokens_token      ON shortcut_tokens (token);

-- ── COMPUTED VIEW: ACCOUNT BALANCES ──────────────────────────────────────────
CREATE VIEW account_balances AS
SELECT
  a.id           AS account_id,
  a.user_id,
  a.name,
  a.payment_method_id,
  a.color_id,
  a.payment_day,
  a.is_active,
  a.sort_order,
  COALESCE(SUM(t.adjustment), 0) AS balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.user_id = a.user_id
GROUP BY a.id, a.user_id, a.name, a.payment_method_id, a.color_id, a.payment_day, a.is_active, a.sort_order;

-- ── MONTHLY SUMMARY VIEW ──────────────────────────────────────────────────────
CREATE VIEW monthly_summary AS
SELECT
  user_id,
  EXTRACT(YEAR  FROM transaction_date)::INTEGER AS year,
  EXTRACT(MONTH FROM transaction_date)::INTEGER AS month,
  SUM(CASE WHEN type = 'TR-INGRESO' THEN amount ELSE 0 END) AS income,
  SUM(CASE WHEN type = 'TR-GASTO'   THEN amount ELSE 0 END) AS expenses,
  SUM(CASE WHEN type = 'TR-INGRESO' THEN amount
           WHEN type = 'TR-GASTO'   THEN -amount
           ELSE 0 END) AS net
FROM transactions
WHERE NOT exclude_from_budget
GROUP BY user_id, year, month;

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at              BEFORE UPDATE ON profiles              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at            BEFORE UPDATE ON categories            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_accounts_updated_at              BEFORE UPDATE ON accounts              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_people_updated_at                BEFORE UPDATE ON people                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at          BEFORE UPDATE ON transactions          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_scheduled_transactions_updated_at BEFORE UPDATE ON scheduled_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_budgets_updated_at               BEFORE UPDATE ON budgets               FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── NEW USER SETUP TRIGGER ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_suffix TEXT := substr(NEW.id::TEXT, 1, 8);
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  -- Create "Yo" person
  INSERT INTO people (id, user_id, name, is_me)
  VALUES ('PER-YO-' || user_suffix, NEW.id, 'Yo', TRUE);

  -- Create default accounts
  INSERT INTO accounts (id, user_id, name, payment_method_id, color_id, sort_order) VALUES
    ('CTA-EFE-' || user_suffix, NEW.id, 'Efectivo',      'MP-EFECTIVO', 'COL-02', 1),
    ('CTA-TDD-' || user_suffix, NEW.id, 'Tarjeta Débito', 'MP-TDD',      'COL-01', 2);

  -- Create shortcut token
  INSERT INTO shortcut_tokens (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── DEFAULT CATEGORIES (global, user_id = NULL) ───────────────────────────────
INSERT INTO categories (id, user_id, name, icon_id, color_id, is_default, sort_order) VALUES
  ('CAT-DEF-FOOD',  NULL, 'Alimentos y bebidas', 'IC-001', 'COL-08', TRUE,  1),
  ('CAT-DEF-SHOP',  NULL, 'Compras',             'IC-002', 'COL-19', TRUE,  2),
  ('CAT-DEF-ENT',   NULL, 'Entretenimiento',     'IC-003', 'COL-10', TRUE,  3),
  ('CAT-DEF-GAS',   NULL, 'Gasolina',            'IC-005', 'COL-14', TRUE,  4),
  ('CAT-DEF-HOME',  NULL, 'Hogar',               'IC-015', 'COL-24', TRUE,  5),
  ('CAT-DEF-SAL',   NULL, 'Salud',               'IC-011', 'COL-06', TRUE,  6),
  ('CAT-DEF-SERV',  NULL, 'Servicios',           'IC-026', 'COL-20', TRUE,  7),
  ('CAT-DEF-REC',   NULL, 'Recurrente',          'IC-010', 'COL-03', TRUE,  8),
  ('CAT-DEF-TRANS', NULL, 'Transporte',          'IC-022', 'COL-01', TRUE,  9),
  ('CAT-DEF-INV',   NULL, 'Inversiones',         'IC-007', 'COL-09', TRUE, 10),
  ('CAT-DEF-HON',   NULL, 'Honorarios',          'IC-006', 'COL-22', TRUE, 11),
  ('CAT-DEF-AMOR',  NULL, 'Amor',                'IC-023', 'COL-23', TRUE, 12),
  ('CAT-DEF-VENT',  NULL, 'Ventas y Negocios',   'IC-014', 'COL-12', TRUE, 13),
  ('CAT-DEF-EST',   NULL, 'Estacionamiento',     'IC-004', 'COL-05', TRUE, 14),
  ('CAT-DEF-OTHER', NULL, 'Otro',                'IC-009', 'COL-21', TRUE, 15),
  ('CAT-AUDIT',     NULL, 'Ajuste',              'IC-AUDIT','COL-30',TRUE, 99);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcut_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE people               ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets              ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Tokens
CREATE POLICY "Own tokens" ON shortcut_tokens FOR ALL USING (auth.uid() = user_id);

-- Categories: anyone can read defaults, only owner manages custom
CREATE POLICY "Read categories" ON categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Manage custom categories" ON categories FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own categories" ON categories FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Delete own categories" ON categories FOR DELETE
  USING (user_id = auth.uid());

-- Accounts, People, Transactions, Scheduled, Budgets — own data only
CREATE POLICY "Own accounts"     ON accounts              FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own people"       ON people                FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own transactions" ON transactions          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own scheduled"    ON scheduled_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own budgets"      ON budgets               FOR ALL USING (auth.uid() = user_id);
