-- Enhanced Bible Notes Schema
-- This extends the existing bible_notes table with additional features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add new columns to the bible_notes table (using DO blocks to handle potential conflicts)
DO $$ 
BEGIN
    -- Add text column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN text TEXT DEFAULT '';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add category column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN category VARCHAR(100) DEFAULT 'Personal Study';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add visibility column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add color column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add is_favorite column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add cross_references column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN cross_references TEXT[] DEFAULT '{}';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add related_verses column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN related_verses JSONB DEFAULT '[]';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add last_modified column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN last_modified TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add audio_note_url column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN audio_note_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add attachments column
    BEGIN
        ALTER TABLE bible_notes ADD COLUMN attachments TEXT[] DEFAULT '{}';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Add constraint for visibility values
DO $$
BEGIN
    BEGIN
        ALTER TABLE bible_notes ADD CONSTRAINT check_visibility_values 
        CHECK (visibility IN ('private', 'shared', 'public'));
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bible_notes_user_category ON bible_notes(user_id, category);
CREATE INDEX IF NOT EXISTS idx_bible_notes_user_favorite ON bible_notes(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_bible_notes_user_visibility ON bible_notes(user_id, visibility);
CREATE INDEX IF NOT EXISTS idx_bible_notes_last_modified ON bible_notes(last_modified DESC);
CREATE INDEX IF NOT EXISTS idx_bible_notes_reference ON bible_notes(reference);
CREATE INDEX IF NOT EXISTS idx_bible_notes_tags ON bible_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_bible_notes_cross_refs ON bible_notes USING GIN(cross_references);

-- Create a function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_bible_note_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_modified
DROP TRIGGER IF EXISTS trigger_update_bible_note_modified_time ON bible_notes;
CREATE TRIGGER trigger_update_bible_note_modified_time
    BEFORE UPDATE ON bible_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_bible_note_modified_time();

-- Create a view for note statistics
CREATE OR REPLACE VIEW bible_note_stats AS
SELECT 
    user_id,
    COUNT(*) as total_notes,
    COUNT(*) FILTER (WHERE is_favorite = true) as favorite_notes,
    COUNT(*) FILTER (WHERE last_modified >= NOW() - INTERVAL '7 days') as recent_notes,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT reference) as unique_references,
    array_agg(DISTINCT category) as categories,
    MAX(last_modified) as last_activity
FROM bible_notes
GROUP BY user_id;

-- Create an immutable function for full-text search indexing
-- Drop the function first if it exists to ensure clean creation
DROP FUNCTION IF EXISTS bible_notes_search_vector(TEXT, TEXT, TEXT[]);

CREATE FUNCTION bible_notes_search_vector(note TEXT, reference TEXT, tags TEXT[])
RETURNS tsvector AS $$
BEGIN
    RETURN to_tsvector('english', COALESCE(note, '') || ' ' || COALESCE(reference, '') || ' ' || COALESCE(array_to_string(tags, ' '), ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Create full-text search index for notes using the immutable function
-- Drop the index first if it exists to ensure clean creation
DROP INDEX IF EXISTS idx_bible_notes_fulltext;

CREATE INDEX idx_bible_notes_fulltext 
ON bible_notes USING GIN(bible_notes_search_vector(note, reference, tags));

-- Create a function for advanced note search
CREATE OR REPLACE FUNCTION search_bible_notes(
    p_user_id UUID,
    p_search_query TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_is_favorite BOOLEAN DEFAULT NULL,
    p_reference TEXT DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    reference TEXT,
    text TEXT,
    note TEXT,
    tags TEXT[],
    category VARCHAR(100),
    visibility VARCHAR(20),
    color VARCHAR(7),
    is_favorite BOOLEAN,
    cross_references TEXT[],
    related_verses JSONB,
    created_at TIMESTAMPTZ,
    last_modified TIMESTAMPTZ,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bn.id,
        bn.reference,
        bn.text,
        bn.note,
        bn.tags,
        bn.category,
        bn.visibility,
        bn.color,
        bn.is_favorite,
        bn.cross_references,
        bn.related_verses,
        bn.created_at,
        bn.last_modified,
        bn.user_id
    FROM bible_notes bn
    WHERE bn.user_id = p_user_id
    AND (p_search_query IS NULL OR bible_notes_search_vector(bn.note, bn.reference, bn.tags) @@ plainto_tsquery('english', p_search_query))
    AND (p_category IS NULL OR bn.category = p_category)
    AND (p_tags IS NULL OR bn.tags && p_tags)
    AND (p_is_favorite IS NULL OR bn.is_favorite = p_is_favorite)
    AND (p_reference IS NULL OR bn.reference ILIKE '%' || p_reference || '%')
    AND (p_date_from IS NULL OR bn.last_modified >= p_date_from)
    AND (p_date_to IS NULL OR bn.last_modified <= p_date_to)
    ORDER BY bn.last_modified DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get related notes by tags and references
CREATE OR REPLACE FUNCTION get_related_notes(
    p_user_id UUID,
    p_note_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    id UUID,
    reference TEXT,
    note TEXT,
    tags TEXT[],
    category VARCHAR(100),
    similarity_score REAL
) AS $$
DECLARE
    source_tags TEXT[];
    source_reference TEXT;
    source_cross_refs TEXT[];
BEGIN
    -- Get the source note's tags and reference
    SELECT bn.tags, bn.reference, bn.cross_references
    INTO source_tags, source_reference, source_cross_refs
    FROM bible_notes bn
    WHERE bn.id = p_note_id AND bn.user_id = p_user_id;
    
    -- Find related notes based on shared tags, cross-references, or similar references
    RETURN QUERY
    SELECT 
        bn.id,
        bn.reference,
        bn.note,
        bn.tags,
        bn.category,
        (
            -- Calculate similarity score based on shared tags and references
            CASE WHEN bn.tags && source_tags THEN 0.5 ELSE 0.0 END +
            CASE WHEN bn.reference = ANY(source_cross_refs) OR source_reference = ANY(bn.cross_references) THEN 0.3 ELSE 0.0 END +
            CASE WHEN similarity(bn.reference, source_reference) > 0.3 THEN 0.2 ELSE 0.0 END
        )::REAL as similarity_score
    FROM bible_notes bn
    WHERE bn.user_id = p_user_id 
    AND bn.id != p_note_id
    AND (
        bn.tags && source_tags OR
        bn.reference = ANY(source_cross_refs) OR
        source_reference = ANY(bn.cross_references) OR
        similarity(bn.reference, source_reference) > 0.3
    )
    ORDER BY similarity_score DESC, bn.last_modified DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Note: RLS policies are already set up in bible-notes.sql
-- We only need to add the new policy for public note visibility

-- Policy for public notes (if visibility is 'public') - only if it doesn't exist
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'bible_notes' 
        AND policyname = 'bible_notes_public_read'
    ) THEN
        CREATE POLICY bible_notes_public_read ON bible_notes
            FOR SELECT
            TO authenticated
            USING (visibility = 'public');
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON bible_notes TO authenticated;
GRANT SELECT ON bible_note_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_bible_notes TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_notes TO authenticated;

-- Create a lookup table for valid categories (optional)
CREATE TABLE IF NOT EXISTS bible_note_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories if they don't exist
INSERT INTO bible_note_categories (name, description, color) VALUES
    ('Personal Study', 'Personal Bible study and reflection', '#3B82F6'),
    ('Sermon Notes', 'Notes from sermons and teachings', '#059669'),
    ('Prayer Requests', 'Prayer-related notes and requests', '#DC2626'),
    ('Devotional', 'Daily devotional insights', '#7C3AED'),
    ('Apologetics', 'Apologetics and theological defense', '#EA580C'),
    ('Theology', 'Deep theological study and analysis', '#0891B2'),
    ('Life Application', 'Practical application of biblical truth', '#65A30D'),
    ('Questions', 'Questions and areas for further study', '#CA8A04'),
    ('Insights', 'Personal insights and revelations', '#BE185D'),
    ('Cross References', 'Cross-reference studies and connections', '#4338CA')
ON CONFLICT (name) DO NOTHING;

-- Set up permissions for the categories table
ALTER TABLE bible_note_categories ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read categories
CREATE POLICY "All users can read note categories" ON bible_note_categories
    FOR SELECT TO authenticated
    USING (true);

-- Grant permissions
GRANT SELECT ON bible_note_categories TO authenticated;

-- Create notification trigger for note sharing (optional)
CREATE OR REPLACE FUNCTION notify_note_shared()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.visibility != OLD.visibility AND NEW.visibility = 'shared' THEN
        -- Could send notification here
        RAISE NOTICE 'Note % has been shared', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_note_shared
    AFTER UPDATE ON bible_notes
    FOR EACH ROW
    WHEN (OLD.visibility IS DISTINCT FROM NEW.visibility)
    EXECUTE FUNCTION notify_note_shared();

-- Add comments for documentation
COMMENT ON TABLE bible_notes IS 'Enhanced Bible study notes with categories, cross-references, and collaboration features';
COMMENT ON COLUMN bible_notes.text IS 'The actual verse text being studied';
COMMENT ON COLUMN bible_notes.category IS 'Note category for organization';
COMMENT ON COLUMN bible_notes.visibility IS 'Note visibility: private, shared, or public';
COMMENT ON COLUMN bible_notes.color IS 'Hex color code for visual organization';
COMMENT ON COLUMN bible_notes.is_favorite IS 'Whether the note is marked as favorite';
COMMENT ON COLUMN bible_notes.cross_references IS 'Array of related verse references';
COMMENT ON COLUMN bible_notes.related_verses IS 'JSON array of related verse objects';
COMMENT ON COLUMN bible_notes.last_modified IS 'Timestamp of last modification';
COMMENT ON COLUMN bible_notes.audio_note_url IS 'URL to audio recording of the note';
COMMENT ON COLUMN bible_notes.attachments IS 'Array of attachment URLs or file references';