-- Allow transactions without account_id.
-- Used for shared expense debt acknowledgments (accepted invites before
-- the recipient has physically paid — no money movement yet).
ALTER TABLE transactions ALTER COLUMN account_id DROP NOT NULL;
