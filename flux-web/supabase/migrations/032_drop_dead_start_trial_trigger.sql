-- trg_start_trial / start_trial_on_approval() only fired on a status
-- transition INTO 'approved' (OLD.status != 'approved' AND NEW.status =
-- 'approved'). Since profiles.status now defaults to 'approved' at INSERT
-- (handle_new_user never transitions it), this never fires for new signups.
-- It's still live for any future status transition though (e.g. admin
-- un-rejecting a user via setUserAccountStatus in actions/admin.ts) — and
-- there it silently overwrites trial_ends_at with a stale hardcoded 20-day
-- value, conflicting with the app code's own explicit (and now 14-day)
-- assignment in the same update. Dropping it: the app already sets
-- trial_ends_at/subscription_status explicitly wherever it transitions a
-- profile to 'approved', so this trigger was a redundant, drifting second
-- source of truth.
DROP TRIGGER IF EXISTS trg_start_trial ON profiles;
DROP FUNCTION IF EXISTS start_trial_on_approval();
