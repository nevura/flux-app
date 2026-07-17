-- Per-user preferences for default categories: hide or override name/icon/color
CREATE TABLE user_category_preferences (
  user_id         UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     TEXT    NOT NULL,
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  custom_name     TEXT,
  custom_icon_id  TEXT,
  custom_color_id TEXT,
  PRIMARY KEY (user_id, category_id)
);

ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own category preferences" ON user_category_preferences
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
