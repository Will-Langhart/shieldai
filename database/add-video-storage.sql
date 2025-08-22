-- Add video storage capabilities to messages table
-- This migration adds columns to store video data and scripture references

-- Add video-related columns to messages table
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN relevant_videos JSONB DEFAULT '[]';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN bible_verses JSONB DEFAULT '[]';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN video_metadata JSONB DEFAULT '{}';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add index for video search performance
CREATE INDEX IF NOT EXISTS idx_messages_videos ON public.messages USING GIN (relevant_videos);
CREATE INDEX IF NOT EXISTS idx_messages_bible_verses ON public.messages USING GIN (bible_verses);

-- Add comment explaining the new columns
COMMENT ON COLUMN public.messages.relevant_videos IS 'Array of relevant videos found for this message, stored as JSONB for flexibility';
COMMENT ON COLUMN public.messages.bible_verses IS 'Array of relevant Bible verses found for this message, stored as JSONB for flexibility';
COMMENT ON COLUMN public.messages.video_metadata IS 'Additional metadata about video processing, such as search query, relevance scores, etc.';

-- Update existing messages to have empty arrays for videos and verses
UPDATE public.messages 
SET relevant_videos = '[]', bible_verses = '[]', video_metadata = '{}'
WHERE relevant_videos IS NULL OR bible_verses IS NULL OR video_metadata IS NULL;
