-- Track which coach mark tours the user has already seen (per account, not per browser)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coach_marks_seen jsonb NOT NULL DEFAULT '[]'::jsonb;
