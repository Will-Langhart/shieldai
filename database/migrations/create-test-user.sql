-- Create a test user for development
-- This creates a user that can be used with test tokens

-- Insert a test user
INSERT INTO public.users (id, email, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'test@example.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert a test conversation for this user
INSERT INTO public.conversations (id, title, user_id, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Conversation',
  '550e8400-e29b-41d4-a716-446655440001',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Note: This user and conversation will be available for testing
