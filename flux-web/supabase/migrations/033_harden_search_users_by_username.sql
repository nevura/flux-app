-- Advisor flagged this SECURITY DEFINER function as callable by anon and as
-- having a mutable search_path. The anon exposure was harmless in practice
-- (auth.uid() is NULL for anon, so `p.id != auth.uid()` evaluates to NULL and
-- excludes every row) but both issues are easy to close outright.
CREATE OR REPLACE FUNCTION public.search_users_by_username(query text)
RETURNS TABLE(id uuid, username text, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.username, p.full_name
  FROM profiles p
  WHERE p.username IS NOT NULL
    AND p.username ILIKE '%' || query || '%'
    AND p.id != auth.uid()
    AND p.status = 'approved'
  ORDER BY p.username
  LIMIT 10;
$$;

REVOKE EXECUTE ON FUNCTION public.search_users_by_username(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_users_by_username(text) FROM public;
GRANT EXECUTE ON FUNCTION public.search_users_by_username(text) TO authenticated;
