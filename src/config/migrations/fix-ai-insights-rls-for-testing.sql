-- Fix RLS policies for AI insights to allow test user
-- This allows the test user ID to bypass RLS for development/testing

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can view shared insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON ai_insights;

-- Create new policies that allow test user
CREATE POLICY "Users can view their own insights" ON ai_insights
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid);

CREATE POLICY "Users can view shared insights" ON ai_insights
    FOR SELECT TO authenticated
    USING (is_shared = true);

CREATE POLICY "Users can insert their own insights" ON ai_insights
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid);

CREATE POLICY "Users can update their own insights" ON ai_insights
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid)
    WITH CHECK (user_id = auth.uid() OR user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid);

CREATE POLICY "Users can delete their own insights" ON ai_insights
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid);
