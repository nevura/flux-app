-- profiles.status defaults to 'approved' and trial_ends_at has no default, so
-- handle_new_user() was creating profiles with trial_ends_at = NULL for every
-- signup (Google and email/password alike) — the app code that sets
-- trial_ends_at only runs when status = 'pending', which the DB default never
-- produces. A NULL trial_ends_at means the daily cron's expiry check
-- (`trial_ends_at < cutoff`) never matches, so the user is stuck on an
-- unlimited free trial and never receives the welcome email tied to that step.
--
-- Keep TRIAL_DAYS here in sync with lib/subscriptionStatus.ts.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  user_suffix TEXT := substr(NEW.id::TEXT, 1, 8);
BEGIN
  INSERT INTO profiles (id, email, full_name, trial_ends_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), now() + interval '14 days');

  INSERT INTO people (id, user_id, name, is_me)
  VALUES ('PER-YO-' || user_suffix, NEW.id, 'Yo', TRUE);

  INSERT INTO accounts (id, user_id, name, payment_method_id, color_id, sort_order) VALUES
    ('CTA-EFE-' || user_suffix, NEW.id, 'Efectivo',      'MP-EFECTIVO', 'COL-02', 1),
    ('CTA-TDD-' || user_suffix, NEW.id, 'Tarjeta Débito', 'MP-TDD',      'COL-01', 2);

  INSERT INTO shortcut_tokens (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;
