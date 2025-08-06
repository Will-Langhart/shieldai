-- Fix for Enhanced Subscription Schema Enum Additions
-- This script safely adds new enum values to subscription_plan type
-- 
-- IMPORTANT: Run each section separately in Supabase SQL editor
-- Do NOT run this entire script at once - enum additions need to be committed individually

-- Section 1: Add 'student' enum value
-- Copy and run this section first, then wait for completion
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'student';

-- Section 2: Add 'scholar' enum value  
-- Copy and run this section second, then wait for completion
-- ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'scholar';

-- Section 3: Add 'ministry' enum value
-- Copy and run this section third, then wait for completion
-- ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'ministry';

-- After successfully running all three sections above,
-- you can then run the enhanced-subscription-schema.sql file