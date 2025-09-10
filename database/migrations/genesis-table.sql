-- Genesis Table Creation for Shield AI Bible Database
-- This table stores Genesis content with proper indexing and metadata

-- Create the genesis table
CREATE TABLE IF NOT EXISTS genesis (
    id SERIAL PRIMARY KEY,
    book VARCHAR(50) NOT NULL DEFAULT 'Genesis',
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    reference VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    version VARCHAR(100) DEFAULT 'ESV',
    language VARCHAR(50) DEFAULT 'English',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add unique constraint to prevent duplicate verses
    UNIQUE(book, chapter, verse, version)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_genesis_book_chapter_verse ON genesis(book, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_genesis_reference ON genesis(reference);
CREATE INDEX IF NOT EXISTS idx_genesis_version ON genesis(version);
CREATE INDEX IF NOT EXISTS idx_genesis_text_search ON genesis USING gin(to_tsvector('english', text));

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_genesis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_genesis_updated_at
    BEFORE UPDATE ON genesis
    FOR EACH ROW
    EXECUTE FUNCTION update_genesis_updated_at();

-- Add comments for documentation
COMMENT ON TABLE genesis IS 'Stores Genesis Bible verses with metadata for Shield AI';
COMMENT ON COLUMN genesis.book IS 'Book name (always Genesis)';
COMMENT ON COLUMN genesis.chapter IS 'Chapter number';
COMMENT ON COLUMN genesis.verse IS 'Verse number';
COMMENT ON COLUMN genesis.reference IS 'Full reference (e.g., Genesis 1:1)';
COMMENT ON COLUMN genesis.text IS 'Verse text content';
COMMENT ON COLUMN genesis.version IS 'Bible translation version';
COMMENT ON COLUMN genesis.language IS 'Language of the text';

-- Create a view for easier querying
CREATE OR REPLACE VIEW genesis_verses AS
SELECT 
    id,
    book,
    chapter,
    verse,
    reference,
    text,
    version,
    language,
    created_at,
    updated_at
FROM genesis
ORDER BY chapter, verse;

-- Grant permissions (adjust as needed for your Supabase setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON genesis TO authenticated;
-- GRANT SELECT ON genesis_verses TO authenticated;

-- Example insert statement (you can replace with your actual content):
-- INSERT INTO genesis (chapter, verse, reference, text, version) VALUES
-- (1, 1, 'Genesis 1:1', 'In the beginning God created the heavens and the earth.', 'ESV'),
-- (1, 2, 'Genesis 1:2', 'The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.', 'ESV');

-- Table is ready for your Genesis content!
-- You can now provide the content and I'll help you create the INSERT statements.
