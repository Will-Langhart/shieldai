-- Add reading progress + denomination tracking to bible_user_preferences
-- Safe to run multiple times (IF NOT EXISTS / EXCEPTION guards)

DO $$
BEGIN
  BEGIN
    ALTER TABLE bible_user_preferences ADD COLUMN last_book TEXT DEFAULT 'Genesis';
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE bible_user_preferences ADD COLUMN last_chapter INTEGER DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE bible_user_preferences ADD COLUMN last_verse INTEGER DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE bible_user_preferences ADD COLUMN last_denomination TEXT DEFAULT NULL;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Index for fast single-row lookup by user
CREATE INDEX IF NOT EXISTS idx_bible_user_prefs_user_id ON bible_user_preferences(user_id);
