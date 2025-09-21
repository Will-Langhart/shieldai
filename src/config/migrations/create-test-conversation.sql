-- Create a test conversation for development
-- This creates a conversation that can be used with test tokens

-- Insert a test conversation
INSERT INTO public.conversations (id, title, user_id, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Conversation',
  '550e8400-e29b-41d4-a716-446655440001',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Note: This conversation will be available for testing
