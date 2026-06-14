-- Promotional subscription system
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'trial_extension',
  extra_days INTEGER NOT NULL DEFAULT 30,
  max_uses INTEGER NOT NULL DEFAULT 20,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_uses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  extra_days_granted INTEGER NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promotion_id, user_id)
);

-- Seed the Fundadores promotion
INSERT INTO promotions (name, description, extra_days, max_uses, active)
VALUES ('Fundadores', 'Primeros 20 en registrar su tarjeta — 30 días gratis adicionales', 30, 20, true);
