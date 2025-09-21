-- Temporarily disable RLS for development
-- This allows test tokens to work without Supabase authentication

-- Disable RLS on messages table for development
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Note: This should only be used in development
-- In production, RLS should be enabled with proper policies
