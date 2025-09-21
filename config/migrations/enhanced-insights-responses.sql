-- Enhanced AI Insights Schema with User Responses
-- This extends the existing ai_insights table with response tracking and interaction features

-- Create insights_responses table for storing user responses to insights
CREATE TABLE IF NOT EXISTS insights_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Response content
    response_text TEXT NOT NULL,
    response_type TEXT NOT NULL CHECK (response_type IN ('comment', 'question', 'prayer', 'reflection', 'application', 'correction', 'appreciation')),
    
    -- Response metadata
    is_helpful BOOLEAN DEFAULT NULL,
    is_accurate BOOLEAN DEFAULT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search vector for responses
    response_search_vector TSVECTOR,
    
    -- Unique constraint to prevent duplicate responses
    UNIQUE(insight_id, user_id, created_at)
);

-- Create insights_interactions table for tracking user interactions
CREATE TABLE IF NOT EXISTS insights_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Interaction types
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'view', 'like', 'dislike', 'share', 'copy', 'bookmark', 'unbookmark', 
        'favorite', 'unfavorite', 'report', 'flag', 'download', 'print'
    )),
    
    -- Interaction metadata
    interaction_data JSONB DEFAULT '{}',
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for performance
    UNIQUE(insight_id, user_id, interaction_type, created_at)
);

-- Create insights_feedback table for detailed feedback
CREATE TABLE IF NOT EXISTS insights_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Feedback categories
    content_quality INTEGER CHECK (content_quality >= 1 AND content_quality <= 5),
    theological_accuracy INTEGER CHECK (theological_accuracy >= 1 AND theological_accuracy <= 5),
    practical_helpfulness INTEGER CHECK (practical_helpfulness >= 1 AND practical_helpfulness <= 5),
    clarity INTEGER CHECK (clarity >= 1 AND clarity <= 5),
    relevance INTEGER CHECK (relevance >= 1 AND relevance <= 5),
    
    -- Overall rating
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Feedback text
    feedback_text TEXT,
    suggestions TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create insights_study_sessions table for tracking study sessions
CREATE TABLE IF NOT EXISTS insights_study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name TEXT,
    
    -- Session metadata
    insights_count INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    passages_studied TEXT[] DEFAULT '{}',
    themes_explored TEXT[] DEFAULT '{}',
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Create insights_session_insights table for linking insights to study sessions
CREATE TABLE IF NOT EXISTS insights_session_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES insights_study_sessions(id) ON DELETE CASCADE,
    insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
    
    -- Session-specific data
    time_spent INTEGER DEFAULT 0, -- in seconds
    notes TEXT,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    added_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to existing ai_insights table
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS helpfulness_score DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_insights_responses_insight_id ON insights_responses(insight_id);
CREATE INDEX IF NOT EXISTS idx_insights_responses_user_id ON insights_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_responses_type ON insights_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_insights_responses_created_at ON insights_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insights_interactions_insight_id ON insights_interactions(insight_id);
CREATE INDEX IF NOT EXISTS idx_insights_interactions_user_id ON insights_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_interactions_type ON insights_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_insights_interactions_created_at ON insights_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insights_feedback_insight_id ON insights_feedback(insight_id);
CREATE INDEX IF NOT EXISTS idx_insights_feedback_user_id ON insights_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_feedback_rating ON insights_feedback(overall_rating);

CREATE INDEX IF NOT EXISTS idx_insights_study_sessions_user_id ON insights_study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_study_sessions_active ON insights_study_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_insights_study_sessions_created_at ON insights_study_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insights_session_insights_session_id ON insights_session_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_insights_session_insights_insight_id ON insights_session_insights(insight_id);

-- Create search vector for responses
CREATE OR REPLACE FUNCTION insights_responses_search_vector(
    response_text TEXT,
    feedback_text TEXT
)
RETURNS TSVECTOR AS $$
BEGIN
    RETURN to_tsvector('english', 
        COALESCE(response_text, '') || ' ' ||
        COALESCE(feedback_text, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to update response search vector
CREATE OR REPLACE FUNCTION update_insights_responses_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.response_search_vector = insights_responses_search_vector(
        NEW.response_text,
        ''
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_insights_responses_search_vector ON insights_responses;
CREATE TRIGGER trigger_update_insights_responses_search_vector
    BEFORE INSERT OR UPDATE ON insights_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_insights_responses_search_vector();

-- Create trigger to update insights counters
CREATE OR REPLACE FUNCTION update_insights_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update response count
        IF TG_TABLE_NAME = 'insights_responses' THEN
            UPDATE ai_insights 
            SET response_count = response_count + 1,
                last_interaction = NOW()
            WHERE id = NEW.insight_id;
        END IF;
        
        -- Update interaction count
        IF TG_TABLE_NAME = 'insights_interactions' THEN
            UPDATE ai_insights 
            SET interaction_count = interaction_count + 1,
                last_interaction = NOW()
            WHERE id = NEW.insight_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease counters on delete
        IF TG_TABLE_NAME = 'insights_responses' THEN
            UPDATE ai_insights 
            SET response_count = GREATEST(response_count - 1, 0)
            WHERE id = OLD.insight_id;
        END IF;
        
        IF TG_TABLE_NAME = 'insights_interactions' THEN
            UPDATE ai_insights 
            SET interaction_count = GREATEST(interaction_count - 1, 0)
            WHERE id = OLD.insight_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for counter updates
DROP TRIGGER IF EXISTS trigger_update_insights_counters_responses ON insights_responses;
CREATE TRIGGER trigger_update_insights_counters_responses
    AFTER INSERT OR DELETE ON insights_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_insights_counters();

DROP TRIGGER IF EXISTS trigger_update_insights_counters_interactions ON insights_interactions;
CREATE TRIGGER trigger_update_insights_counters_interactions
    AFTER INSERT OR DELETE ON insights_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_insights_counters();

-- Create function to calculate average rating
CREATE OR REPLACE FUNCTION calculate_insight_rating(insight_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT AVG(overall_rating)::DECIMAL(3,2)
    INTO avg_rating
    FROM insights_feedback
    WHERE insight_id = insight_uuid AND overall_rating IS NOT NULL;
    
    RETURN COALESCE(avg_rating, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate helpfulness score
CREATE OR REPLACE FUNCTION calculate_insight_helpfulness(insight_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    helpful_count INTEGER;
    total_responses INTEGER;
    helpfulness_score DECIMAL(3,2);
BEGIN
    SELECT COUNT(*) INTO helpful_count
    FROM insights_responses
    WHERE insight_id = insight_uuid AND is_helpful = TRUE;
    
    SELECT COUNT(*) INTO total_responses
    FROM insights_responses
    WHERE insight_id = insight_uuid AND is_helpful IS NOT NULL;
    
    IF total_responses > 0 THEN
        helpfulness_score := (helpful_count::DECIMAL / total_responses::DECIMAL) * 100;
    ELSE
        helpfulness_score := 0.00;
    END IF;
    
    RETURN helpfulness_score;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_insight_engagement(insight_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_interactions INTEGER;
    unique_users INTEGER;
    engagement_score DECIMAL(3,2);
BEGIN
    SELECT COUNT(*) INTO total_interactions
    FROM insights_interactions
    WHERE insight_id = insight_uuid;
    
    SELECT COUNT(DISTINCT user_id) INTO unique_users
    FROM insights_interactions
    WHERE insight_id = insight_uuid;
    
    IF unique_users > 0 THEN
        engagement_score := (total_interactions::DECIMAL / unique_users::DECIMAL);
    ELSE
        engagement_score := 0.00;
    END IF;
    
    RETURN engagement_score;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE insights_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_session_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insights_responses
CREATE POLICY "Users can view their own responses" ON insights_responses
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view responses on shared insights" ON insights_responses
    FOR SELECT TO authenticated
    USING (insight_id IN (
        SELECT id FROM ai_insights WHERE is_shared = TRUE
    ));

CREATE POLICY "Users can insert their own responses" ON insights_responses
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own responses" ON insights_responses
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own responses" ON insights_responses
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for insights_interactions
CREATE POLICY "Users can view their own interactions" ON insights_interactions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own interactions" ON insights_interactions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interactions" ON insights_interactions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own interactions" ON insights_interactions
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for insights_feedback
CREATE POLICY "Users can view their own feedback" ON insights_feedback
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback" ON insights_feedback
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own feedback" ON insights_feedback
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own feedback" ON insights_feedback
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for insights_study_sessions
CREATE POLICY "Users can view their own study sessions" ON insights_study_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own study sessions" ON insights_study_sessions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own study sessions" ON insights_study_sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own study sessions" ON insights_study_sessions
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for insights_session_insights
CREATE POLICY "Users can view their own session insights" ON insights_session_insights
    FOR SELECT TO authenticated
    USING (session_id IN (
        SELECT id FROM insights_study_sessions WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own session insights" ON insights_session_insights
    FOR INSERT TO authenticated
    WITH CHECK (session_id IN (
        SELECT id FROM insights_study_sessions WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own session insights" ON insights_session_insights
    FOR UPDATE TO authenticated
    USING (session_id IN (
        SELECT id FROM insights_study_sessions WHERE user_id = auth.uid()
    ))
    WITH CHECK (session_id IN (
        SELECT id FROM insights_study_sessions WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own session insights" ON insights_session_insights
    FOR DELETE TO authenticated
    USING (session_id IN (
        SELECT id FROM insights_study_sessions WHERE user_id = auth.uid()
    ));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON insights_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON insights_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON insights_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON insights_study_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON insights_session_insights TO authenticated;

-- Create views for easy querying
CREATE OR REPLACE VIEW insights_with_stats AS
SELECT 
    ai.*,
    COALESCE(ir.response_count, 0) as response_count,
    COALESCE(ii.interaction_count, 0) as interaction_count,
    COALESCE(if.avg_rating, 0.00) as average_rating,
    COALESCE(if.helpfulness_score, 0.00) as helpfulness_score,
    COALESCE(if.engagement_score, 0.00) as engagement_score,
    ai.last_interaction
FROM ai_insights ai
LEFT JOIN (
    SELECT insight_id, COUNT(*) as response_count
    FROM insights_responses
    GROUP BY insight_id
) ir ON ai.id = ir.insight_id
LEFT JOIN (
    SELECT insight_id, COUNT(*) as interaction_count
    FROM insights_interactions
    GROUP BY insight_id
) ii ON ai.id = ii.insight_id
LEFT JOIN (
    SELECT 
        insight_id,
        AVG(overall_rating) as avg_rating,
        calculate_insight_helpfulness(insight_id) as helpfulness_score,
        calculate_insight_engagement(insight_id) as engagement_score
    FROM insights_feedback
    GROUP BY insight_id
) if ON ai.id = if.insight_id;

-- Grant select permission on the view
GRANT SELECT ON insights_with_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE insights_responses IS 'User responses and reactions to AI-generated Bible insights';
COMMENT ON TABLE insights_interactions IS 'User interactions with AI-generated Bible insights';
COMMENT ON TABLE insights_feedback IS 'Detailed feedback and ratings for AI-generated Bible insights';
COMMENT ON TABLE insights_study_sessions IS 'Study sessions for organizing and tracking Bible study progress';
COMMENT ON TABLE insights_session_insights IS 'Links insights to study sessions with session-specific data';

COMMENT ON COLUMN insights_responses.response_type IS 'Type of response: comment, question, prayer, reflection, application, correction, appreciation';
COMMENT ON COLUMN insights_interactions.interaction_type IS 'Type of interaction: view, like, dislike, share, copy, bookmark, favorite, report, flag, download, print';
COMMENT ON COLUMN insights_feedback.content_quality IS 'Rating for content quality (1-5)';
COMMENT ON COLUMN insights_feedback.theological_accuracy IS 'Rating for theological accuracy (1-5)';
COMMENT ON COLUMN insights_feedback.practical_helpfulness IS 'Rating for practical helpfulness (1-5)';

