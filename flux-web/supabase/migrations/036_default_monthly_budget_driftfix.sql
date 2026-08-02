-- Schema-drift fix: default_monthly_budget has been in use across the app
-- (actions/config.ts, DashboardTab.tsx, notifications.ts) since before this
-- migrations folder tracked it. IF NOT EXISTS makes this a safe no-op against
-- the live DB, which already has the column.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_monthly_budget NUMERIC(12,2);
