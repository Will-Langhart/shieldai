-- AI Insights Schema
-- This creates a table for storing AI-generated Bible insights

-- Create the ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    passage_reference TEXT NOT NULL,
    passage_text TEXT NOT NULL,
    bible_version TEXT NOT NULL,
    
    -- AI-generated content
    explanation TEXT NOT NULL,
    key_themes TEXT[] DEFAULT '{}',
    cross_references JSONB DEFAULT '[]',
    study_questions JSONB DEFAULT '[]',
    historical_context TEXT,
    theological_meaning TEXT,
    practical_application TEXT,
    prayer_points TEXT[] DEFAULT '{}',
    
    -- Metadata
    ai_model TEXT DEFAULT 'gpt-4-turbo-preview',
    generation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User interaction
    is_favorite BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    notes TEXT, -- User's personal notes on the insight
    
    -- Search and organization
    search_vector TSVECTOR
);

-- Create an immutable function for search vector generation
CREATE OR REPLACE FUNCTION ai_insights_search_vector(
    explanation TEXT,
    passage_reference TEXT,
    passage_text TEXT,
    key_themes TEXT[],
    historical_context TEXT,
    theological_meaning TEXT,
    practical_application TEXT,
    prayer_points TEXT[],
    notes TEXT
)
RETURNS TSVECTOR AS $$
BEGIN
    RETURN to_tsvector('english', 
        COALESCE(explanation, '') || ' ' ||
        COALESCE(passage_reference, '') || ' ' ||
        COALESCE(passage_text, '') || ' ' ||
        COALESCE(array_to_string(key_themes, ' '), '') || ' ' ||
        COALESCE(historical_context, '') || ' ' ||
        COALESCE(theological_meaning, '') || ' ' ||
        COALESCE(practical_application, '') || ' ' ||
        COALESCE(array_to_string(prayer_points, ' '), '') || ' ' ||
        COALESCE(notes, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_reference ON ai_insights(passage_reference);
CREATE INDEX IF NOT EXISTS idx_ai_insights_version ON ai_insights(bible_version);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_favorite ON ai_insights(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_ai_insights_shared ON ai_insights(is_shared);
CREATE INDEX IF NOT EXISTS idx_ai_insights_tags ON ai_insights USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_insights_key_themes ON ai_insights USING GIN(key_themes);
CREATE INDEX IF NOT EXISTS idx_ai_insights_search ON ai_insights USING GIN(
    ai_insights_search_vector(
        explanation, passage_reference, passage_text, key_themes,
        historical_context, theological_meaning, practical_application,
        prayer_points, notes
    )
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_ai_insights_updated_at ON ai_insights;
CREATE TRIGGER trigger_update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_insights_updated_at();

-- Create trigger to update search vector on insert and update
CREATE OR REPLACE FUNCTION update_ai_insights_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = ai_insights_search_vector(
        NEW.explanation, NEW.passage_reference, NEW.passage_text, NEW.key_themes,
        NEW.historical_context, NEW.theological_meaning, NEW.practical_application,
        NEW.prayer_points, NEW.notes
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_insights_search_vector ON ai_insights;
CREATE TRIGGER trigger_update_ai_insights_search_vector
    BEFORE INSERT OR UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_insights_search_vector();

-- Enable Row Level Security
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own insights and public shared insights
CREATE POLICY "Users can view their own insights" ON ai_insights
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view shared insights" ON ai_insights
    FOR SELECT TO authenticated
    USING (is_shared = true);

CREATE POLICY "Users can insert their own insights" ON ai_insights
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own insights" ON ai_insights
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own insights" ON ai_insights
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_insights TO authenticated;

-- Create a function for searching insights
CREATE OR REPLACE FUNCTION search_ai_insights(
    p_user_id UUID,
    p_search_query TEXT DEFAULT NULL,
    p_passage_reference TEXT DEFAULT NULL,
    p_bible_version TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_key_themes TEXT[] DEFAULT NULL,
    p_is_favorite BOOLEAN DEFAULT NULL,
    p_is_shared BOOLEAN DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    passage_reference TEXT,
    passage_text TEXT,
    bible_version TEXT,
    explanation TEXT,
    key_themes TEXT[],
    cross_references JSONB,
    study_questions JSONB,
    historical_context TEXT,
    theological_meaning TEXT,
    practical_application TEXT,
    prayer_points TEXT[],
    ai_model TEXT,
    generation_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_favorite BOOLEAN,
    is_shared BOOLEAN,
    tags TEXT[],
    notes TEXT,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ai.id,
        ai.passage_reference,
        ai.passage_text,
        ai.bible_version,
        ai.explanation,
        ai.key_themes,
        ai.cross_references,
        ai.study_questions,
        ai.historical_context,
        ai.theological_meaning,
        ai.practical_application,
        ai.prayer_points,
        ai.ai_model,
        ai.generation_timestamp,
        ai.created_at,
        ai.updated_at,
        ai.is_favorite,
        ai.is_shared,
        ai.tags,
        ai.notes,
        ai.user_id
    FROM ai_insights ai
    WHERE (ai.user_id = p_user_id OR ai.is_shared = true)
    AND (p_search_query IS NULL OR ai_insights_search_vector(
        ai.explanation, ai.passage_reference, ai.passage_text, ai.key_themes,
        ai.historical_context, ai.theological_meaning, ai.practical_application,
        ai.prayer_points, ai.notes
    ) @@ plainto_tsquery('english', p_search_query))
    AND (p_passage_reference IS NULL OR ai.passage_reference ILIKE '%' || p_passage_reference || '%')
    AND (p_bible_version IS NULL OR ai.bible_version = p_bible_version)
    AND (p_tags IS NULL OR ai.tags && p_tags)
    AND (p_key_themes IS NULL OR ai.key_themes && p_key_themes)
    AND (p_is_favorite IS NULL OR ai.is_favorite = p_is_favorite)
    AND (p_is_shared IS NULL OR ai.is_shared = p_is_shared)
    AND (p_date_from IS NULL OR ai.created_at >= p_date_from)
    AND (p_date_to IS NULL OR ai.created_at <= p_date_to)
    ORDER BY ai.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_ai_insights TO authenticated;

-- Create a function to get insights by passage reference
CREATE OR REPLACE FUNCTION get_insights_by_passage(
    p_user_id UUID,
    p_passage_reference TEXT,
    p_bible_version TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    passage_reference TEXT,
    passage_text TEXT,
    bible_version TEXT,
    explanation TEXT,
    key_themes TEXT[],
    cross_references JSONB,
    study_questions JSONB,
    historical_context TEXT,
    theological_meaning TEXT,
    practical_application TEXT,
    prayer_points TEXT[],
    ai_model TEXT,
    generation_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_favorite BOOLEAN,
    is_shared BOOLEAN,
    tags TEXT[],
    notes TEXT,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ai.id,
        ai.passage_reference,
        ai.passage_text,
        ai.bible_version,
        ai.explanation,
        ai.key_themes,
        ai.cross_references,
        ai.study_questions,
        ai.historical_context,
        ai.theological_meaning,
        ai.practical_application,
        ai.prayer_points,
        ai.ai_model,
        ai.generation_timestamp,
        ai.created_at,
        ai.updated_at,
        ai.is_favorite,
        ai.is_shared,
        ai.tags,
        ai.notes,
        ai.user_id
    FROM ai_insights ai
    WHERE (ai.user_id = p_user_id OR ai.is_shared = true)
    AND ai.passage_reference = p_passage_reference
    AND (p_bible_version IS NULL OR ai.bible_version = p_bible_version)
    ORDER BY ai.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the get insights function
GRANT EXECUTE ON FUNCTION get_insights_by_passage TO authenticated;

-- Create a view for insight statistics
CREATE OR REPLACE VIEW ai_insights_stats AS
SELECT 
    user_id,
    COUNT(*) as total_insights,
    COUNT(*) FILTER (WHERE is_favorite = true) as favorite_insights,
    COUNT(*) FILTER (WHERE is_shared = true) as shared_insights,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_insights,
    COUNT(DISTINCT passage_reference) as unique_passages,
    COUNT(DISTINCT bible_version) as unique_versions,
    array_agg(DISTINCT bible_version) as versions_used,
    MAX(created_at) as last_activity
FROM ai_insights
GROUP BY user_id;

-- Grant select permission on the stats view
GRANT SELECT ON ai_insights_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE ai_insights IS 'AI-generated Bible insights with full-text search and organization features';
COMMENT ON COLUMN ai_insights.passage_reference IS 'Bible passage reference (e.g., "John 3:16")';
COMMENT ON COLUMN ai_insights.passage_text IS 'The actual text of the Bible passage';
COMMENT ON COLUMN ai_insights.bible_version IS 'Bible version used for the passage';
COMMENT ON COLUMN ai_insights.explanation IS 'AI-generated explanation of the passage';
COMMENT ON COLUMN ai_insights.key_themes IS 'Array of key themes identified by AI';
COMMENT ON COLUMN ai_insights.cross_references IS 'JSON array of cross-references with relevance';
COMMENT ON COLUMN ai_insights.study_questions IS 'JSON array of study questions generated by AI';
COMMENT ON COLUMN ai_insights.historical_context IS 'Historical context provided by AI';
COMMENT ON COLUMN ai_insights.theological_meaning IS 'Theological meaning explained by AI';
COMMENT ON COLUMN ai_insights.practical_application IS 'Practical application suggested by AI';
COMMENT ON COLUMN ai_insights.prayer_points IS 'Array of prayer points based on the passage';
COMMENT ON COLUMN ai_insights.search_vector IS 'Full-text search vector for searching insights';
