-- Migration: Add user_id column to messages table
-- This script adds the missing user_id column to the messages table

-- Add user_id column to messages table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add metadata column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN metadata JSONB DEFAULT '{}';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create index for user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- Update existing messages to have user_id from their conversation
UPDATE public.messages 
SET user_id = c.user_id 
FROM public.conversations c 
WHERE messages.conversation_id = c.id 
AND messages.user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to include user_id check
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.messages;

-- Create updated RLS policies for messages table
CREATE POLICY "Users can view messages in own conversations" ON public.messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update messages in own conversations" ON public.messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete messages in own conversations" ON public.messages
    FOR DELETE USING (auth.uid() = user_id);