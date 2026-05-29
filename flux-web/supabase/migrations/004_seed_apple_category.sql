-- Seed default categories that exist in lib/constants.ts but were missing from the DB.
-- CAT-APPLE is referenced by the Apple Pay shortcut integration (category="apple" → CAT-APPLE).
INSERT INTO categories (id, user_id, name, icon_id, color_id, is_default, sort_order)
VALUES ('CAT-APPLE', NULL, 'Apple Pay', 'IC-APPLE', 'COL-01', true, 98)
ON CONFLICT (id) DO NOTHING;
