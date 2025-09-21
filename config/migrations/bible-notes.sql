-- Bible Study Notes Table
CREATE TABLE IF NOT EXISTS bible_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  note TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bible Favorites Table
CREATE TABLE IF NOT EXISTS bible_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  text TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reference)
);

-- Bible Search History Table
CREATE TABLE IF NOT EXISTS bible_search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bible Study Sessions Table
CREATE TABLE IF NOT EXISTS bible_study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  verse_references TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bible User Preferences Table
CREATE TABLE IF NOT EXISTS bible_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  default_version TEXT DEFAULT 'de4e12af7f28f599-02',
  preferred_versions TEXT[] DEFAULT '{}',
  search_history_enabled BOOLEAN DEFAULT true,
  auto_save_notes BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bible_notes_user_id ON bible_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_notes_reference ON bible_notes(reference);
CREATE INDEX IF NOT EXISTS idx_bible_notes_created_at ON bible_notes(created_at);

CREATE INDEX IF NOT EXISTS idx_bible_favorites_user_id ON bible_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_favorites_reference ON bible_favorites(reference);

CREATE INDEX IF NOT EXISTS idx_bible_search_history_user_id ON bible_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_search_history_created_at ON bible_search_history(created_at);

CREATE INDEX IF NOT EXISTS idx_bible_study_sessions_user_id ON bible_study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_study_sessions_created_at ON bible_study_sessions(created_at);

-- RLS Policies
ALTER TABLE bible_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_user_preferences ENABLE ROW LEVEL SECURITY;

-- Bible Notes Policies
CREATE POLICY "Users can view their own bible notes" ON bible_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bible notes" ON bible_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bible notes" ON bible_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bible notes" ON bible_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Bible Favorites Policies
CREATE POLICY "Users can view their own bible favorites" ON bible_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bible favorites" ON bible_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bible favorites" ON bible_favorites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bible favorites" ON bible_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Bible Search History Policies
CREATE POLICY "Users can view their own search history" ON bible_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON bible_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON bible_search_history
  FOR DELETE USING (auth.uid() = user_id);

-- Bible Study Sessions Policies
CREATE POLICY "Users can view their own study sessions" ON bible_study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON bible_study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON bible_study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions" ON bible_study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Bible User Preferences Policies
CREATE POLICY "Users can view their own preferences" ON bible_user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON bible_user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON bible_user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_bible_notes_updated_at
  BEFORE UPDATE ON bible_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bible_study_sessions_updated_at
  BEFORE UPDATE ON bible_study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bible_user_preferences_updated_at
  BEFORE UPDATE ON bible_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 