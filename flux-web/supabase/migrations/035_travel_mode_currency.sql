-- Travel mode: when set, new transactions captured without an explicit
-- currency (Apple Pay via Shortcut, manual entry) default to this currency
-- instead of the account's home currency. NULL = travel mode off.
ALTER TABLE profiles
  ADD COLUMN travel_mode_currency TEXT;
