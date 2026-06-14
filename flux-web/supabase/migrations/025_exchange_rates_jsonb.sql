-- Optimize exchange_rates: one row per day with all currency rates in JSONB
-- Format: { "EUR_MXN": 21.5, "USD_MXN": 17.2, "GBP_MXN": 22.1, ... }
DROP TABLE IF EXISTS exchange_rates;

CREATE TABLE exchange_rates (
  date DATE PRIMARY KEY,
  rates JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'frankfurter',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX exchange_rates_date_idx ON exchange_rates (date DESC);
