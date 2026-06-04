-- Fix FK on support_conversations so PostgREST can auto-join with public.profiles
-- Previously referenced auth.users(id) which breaks the profiles(email, full_name) join syntax

ALTER TABLE public.support_conversations
  DROP CONSTRAINT IF EXISTS support_conversations_user_id_fkey;

ALTER TABLE public.support_conversations
  ADD CONSTRAINT support_conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
