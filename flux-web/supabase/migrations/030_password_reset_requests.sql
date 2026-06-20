-- Tracks password-reset email requests so we can apply our own cooldown.
-- Needed because the reset email is sent via admin.generateLink() + our own
-- Resend pipeline (for branding), which bypasses Supabase's built-in
-- resetPasswordForEmail() throttle. Service-role only — no RLS policy.
create table password_reset_requests (
  email text not null,
  requested_at timestamptz not null default now()
);
create index idx_password_reset_requests_email on password_reset_requests(email, requested_at desc);
