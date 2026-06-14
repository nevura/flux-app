-- Exchange rate history table
-- Populated daily by cron from Frankfurter (ECB data)
CREATE TABLE IF NOT EXISTS exchange_rates (
  date DATE NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  source TEXT NOT NULL DEFAULT 'frankfurter',
  PRIMARY KEY (date, from_currency, to_currency)
);

CREATE INDEX IF NOT EXISTS exchange_rates_date_idx ON exchange_rates (date DESC);
CREATE INDEX IF NOT EXISTS exchange_rates_pair_idx ON exchange_rates (from_currency, to_currency, date DESC);
