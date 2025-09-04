-- Enhanced Analytics Schema for Shield AI
-- Tracks detailed interaction metrics and user engagement profiles

-- Enhanced interaction analytics
CREATE TABLE IF NOT EXISTS analytics_enhanced_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  correlation_id TEXT NOT NULL,
  message TEXT,
  response_length INTEGER,
  
  -- Context analysis
  question_type TEXT CHECK (question_type IN ('theological', 'philosophical', 'cultural', 'personal', 'general')),
  user_intent TEXT CHECK (user_intent IN ('seeking', 'challenging', 'learning', 'struggling', 'curious')),
  emotional_tone TEXT CHECK (emotional_tone IN ('neutral', 'positive', 'negative', 'anxious', 'angry', 'hopeful')),
  complexity TEXT CHECK (complexity IN ('basic', 'intermediate', 'advanced')),
  engagement_level TEXT CHECK (engagement_level IN ('surface', 'moderate', 'deep')),
  conversation_goal TEXT CHECK (conversation_goal IN ('apologetics', 'pastoral', 'educational', 'evangelistic', 'discipleship')),
  
  -- Objection analysis
  objection_type TEXT,
  objection_intensity TEXT CHECK (objection_intensity IN ('mild', 'moderate', 'strong')),
  user_stance TEXT CHECK (user_stance IN ('seeker', 'skeptic', 'challenger', 'believer', 'struggler')),
  
  -- Performance metrics
  duration_ms INTEGER,
  token_count INTEGER,
  scripture_count INTEGER,
  topics TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_user_id ON analytics_enhanced_interactions(user_id);
CREATE INDEX idx_analytics_created_at ON analytics_enhanced_interactions(created_at);
CREATE INDEX idx_analytics_question_type ON analytics_enhanced_interactions(question_type);
CREATE INDEX idx_analytics_conversation_goal ON analytics_enhanced_interactions(conversation_goal);
CREATE INDEX idx_analytics_topics ON analytics_enhanced_interactions USING GIN(topics);

-- User engagement profiles for personalization
CREATE TABLE IF NOT EXISTS user_engagement_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Recent engagement patterns
  last_engagement_level TEXT,
  last_emotional_tone TEXT,
  last_conversation_goal TEXT,
  frequent_topics TEXT[],
  
  -- Theological preferences
  theological_perspective TEXT CHECK (theological_perspective IN ('reformed', 'evangelical', 'catholic', 'orthodox', 'general')),
  preferred_communication_style TEXT CHECK (preferred_communication_style IN ('formal', 'casual', 'academic', 'pastoral')),
  learning_style TEXT CHECK (learning_style IN ('visual', 'logical', 'narrative', 'practical')),
  
  -- Spiritual journey tracking
  spiritual_stage TEXT CHECK (spiritual_stage IN ('seeking', 'new_believer', 'growing', 'mature', 'struggling')),
  key_milestones TEXT[],
  current_challenges TEXT[],
  
  -- Engagement statistics
  total_interactions INTEGER DEFAULT 0,
  average_engagement_depth DECIMAL(3,2),
  most_discussed_topics TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message metadata for enhanced context
CREATE TABLE IF NOT EXISTS message_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Enhanced context
  question_type TEXT,
  user_intent TEXT,
  emotional_tone TEXT,
  complexity TEXT,
  engagement_level TEXT,
  conversation_goal TEXT,
  
  -- Objection details
  objection_type TEXT,
  objection_intensity TEXT,
  
  -- Content analysis
  topics TEXT[],
  scripture_references TEXT[],
  key_concepts TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_metadata_message_id ON message_metadata(message_id);

-- Analytics aggregation views
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT aei.id) as total_interactions,
  AVG(aei.duration_ms) as avg_response_time,
  AVG(aei.token_count) as avg_token_count,
  AVG(aei.scripture_count) as avg_scripture_references,
  MODE() WITHIN GROUP (ORDER BY aei.question_type) as most_common_question_type,
  MODE() WITHIN GROUP (ORDER BY aei.conversation_goal) as primary_conversation_goal,
  MODE() WITHIN GROUP (ORDER BY aei.emotional_tone) as typical_emotional_tone,
  ARRAY_AGG(DISTINCT unnest(aei.topics)) as all_topics
FROM auth.users u
LEFT JOIN analytics_enhanced_interactions aei ON u.id = aei.user_id
GROUP BY u.id, u.email;

-- Function to update user engagement profile
CREATE OR REPLACE FUNCTION update_user_engagement_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_engagement_profiles (
    user_id,
    last_engagement_level,
    last_emotional_tone,
    last_conversation_goal,
    frequent_topics,
    total_interactions,
    updated_at
  ) VALUES (
    NEW.user_id,
    NEW.engagement_level,
    NEW.emotional_tone,
    NEW.conversation_goal,
    NEW.topics,
    1,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_engagement_level = NEW.engagement_level,
    last_emotional_tone = NEW.emotional_tone,
    last_conversation_goal = NEW.conversation_goal,
    frequent_topics = ARRAY(
      SELECT DISTINCT unnest(
        user_engagement_profiles.frequent_topics || NEW.topics
      ) LIMIT 20
    ),
    total_interactions = user_engagement_profiles.total_interactions + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update profiles
CREATE TRIGGER update_engagement_profile_trigger
AFTER INSERT ON analytics_enhanced_interactions
FOR EACH ROW
EXECUTE FUNCTION update_user_engagement_profile();

-- Row Level Security
ALTER TABLE analytics_enhanced_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_metadata ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_enhanced_interactions
CREATE POLICY "Users can view their own analytics" ON analytics_enhanced_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics" ON analytics_enhanced_interactions
  FOR INSERT WITH CHECK (true);

-- Policies for user_engagement_profiles
CREATE POLICY "Users can view their own profile" ON user_engagement_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_engagement_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage profiles" ON user_engagement_profiles
  FOR ALL USING (true);

-- Policies for message_metadata
CREATE POLICY "Users can view metadata for their messages" ON message_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_metadata.message_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert metadata" ON message_metadata
  FOR INSERT WITH CHECK (true);








