CREATE TABLE IF NOT EXISTS bot_usage_logs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID        REFERENCES support_conversations(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  input_tokens    INT         NOT NULL DEFAULT 0,
  output_tokens   INT         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bot_usage_logs_user_id_idx    ON bot_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS bot_usage_logs_created_at_idx ON bot_usage_logs(created_at);
