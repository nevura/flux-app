-- Track Apple Pay vs Quick Register shortcut usage separately
ALTER TABLE public.shortcut_tokens
  ADD COLUMN IF NOT EXISTS apple_pay_last_used_at      timestamptz,
  ADD COLUMN IF NOT EXISTS quick_register_last_used_at timestamptz;
