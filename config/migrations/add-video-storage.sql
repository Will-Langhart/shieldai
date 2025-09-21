
-- Add video storage capabilities to messages table
-- This migration adds columns to store video data and scripture references

-- Add video-related columns to messages table
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN relevant_videos JSONB DEFAULT '[]';
    RAISE NOTICE 'Added relevant_videos column to messages table';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'relevant_videos column already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding relevant_videos column: %', SQLERRM;
END $$;

DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN bible_verses JSONB DEFAULT '[]';
    RAISE NOTICE 'Added bible_verses column to messages table';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'bible_verses column already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding bible_verses column: %', SQLERRM;
END $$;

DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN video_metadata JSONB DEFAULT '{}';
    RAISE NOTICE 'Added video_metadata column to messages table';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'video_metadata column already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding video_metadata column: %', SQLERRM;
END $$;

-- Add index for video search performance
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_videos ON public.messages USING GIN (relevant_videos);
    RAISE NOTICE 'Created index for relevant_videos';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creating videos index: %', SQLERRM;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_bible_verses ON public.messages USING GIN (bible_verses);
    RAISE NOTICE 'Created index for bible_verses';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creating bible_verses index: %', SQLERRM;
END $$;

-- Add comment explaining the new columns
DO $$ BEGIN
    COMMENT ON COLUMN public.messages.relevant_videos IS 'Array of relevant videos found for this message, stored as JSONB for flexibility';
    COMMENT ON COLUMN public.messages.bible_verses IS 'Array of relevant Bible verses found for this message, stored as JSONB for flexibility';
    COMMENT ON COLUMN public.messages.video_metadata IS 'Additional metadata about video processing, such as search query, relevance scores, etc.';
    RAISE NOTICE 'Added column comments';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding column comments: %', SQLERRM;
END $$;

-- Update existing messages to have empty arrays for videos and verses
DO $$ 
DECLARE
    _row_count INTEGER;
BEGIN
    UPDATE public.messages 
    SET relevant_videos = '[]', bible_verses = '[]', video_metadata = '{}'
    WHERE relevant_videos IS NULL OR bible_verses IS NULL OR video_metadata IS NULL;
    
    GET DIAGNOSTICS _row_count = ROW_COUNT;
    RAISE NOTICE 'Updated % messages with default video data', _row_count;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error updating existing messages: %', SQLERRM;
END $$;

-- Verify the columns were added
DO $$ 
DECLARE
    col_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'relevant_videos'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'SUCCESS: relevant_videos column exists in messages table';
    ELSE
        RAISE NOTICE 'ERROR: relevant_videos column was not added to messages table';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'bible_verses'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'SUCCESS: bible_verses column exists in messages table';
    ELSE
        RAISE NOTICE 'ERROR: bible_verses column was not added to messages table';
    END IF;
END $$;
