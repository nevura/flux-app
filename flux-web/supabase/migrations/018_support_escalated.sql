-- Add escalated flag to support_conversations so the admin inbox
-- can visually highlight conversations the bot flagged for human attention
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS escalated BOOLEAN NOT NULL DEFAULT FALSE;
