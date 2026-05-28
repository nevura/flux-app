-- ── PROFILES: @username + phone ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone    TEXT;

ALTER TABLE profiles
  ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$');

-- ── PEOPLE: link local contact → registered user ──────────────────────────────
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── FRIENDSHIPS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- prevent self-friendship
  CHECK (requester_id != addressee_id)
);

-- Prevent duplicate pairs in either direction (A→B same as B→A for uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair ON friendships (
  LEAST(requester_id::text, addressee_id::text),
  GREATEST(requester_id::text, addressee_id::text)
);

CREATE TRIGGER trg_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'friend_request', 'friend_accepted', 'friend_declined',
               'shared_expense_invite', 'expense_settled'
             )),
  data       JSONB NOT NULL DEFAULT '{}',
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE friendships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Friendships: visible/editable only by requester or addressee
CREATE POLICY "Own friendships" ON friendships FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Notifications: own only
CREATE POLICY "Own notifications" ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- ── USER SEARCH FUNCTION ──────────────────────────────────────────────────────
-- Returns only safe public fields; bypasses RLS via SECURITY DEFINER
-- so we never expose email, subscription_status, etc. to other users.
CREATE OR REPLACE FUNCTION search_users_by_username(query TEXT)
RETURNS TABLE (id UUID, username TEXT, full_name TEXT)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT p.id, p.username, p.full_name
  FROM profiles p
  WHERE p.username IS NOT NULL
    AND p.username ILIKE '%' || query || '%'
    AND p.id != auth.uid()
    AND p.status = 'approved'
  ORDER BY p.username
  LIMIT 10;
$$;
