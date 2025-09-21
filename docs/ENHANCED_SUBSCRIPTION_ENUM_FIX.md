# Enhanced Subscription Schema Enum Fix

## Issue
When running `database/enhanced-subscription-schema.sql`, you encounter:
```
ERROR: 55P04: unsafe use of new value "student" of enum type
```

## Root Cause
PostgreSQL has restrictions on adding enum values within transactions. The original schema tried to add multiple enum values in a single block, which can cause this error.

## Solution

### Step 1: Add Enum Values Individually
1. Open Supabase SQL Editor
2. Run each section of `database/fix-enum-additions.sql` **ONE AT A TIME**
3. Wait for each to complete before running the next

```sql
-- Section 1: Run this first
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'student';
```

Wait for completion, then:

```sql
-- Section 2: Run this second  
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'scholar';
```

Wait for completion, then:

```sql
-- Section 3: Run this third
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'ministry';
```

### Step 2: Verify Enum Values
Run this query to verify all enum values exist:

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype 
ORDER BY enumlabel;
```

You should see:
- basic
- ministry  
- premium
- scholar
- student

### Step 3: Run Enhanced Schema
Now you can safely run `database/enhanced-subscription-schema.sql` in Supabase SQL Editor.

## Why This Happens

1. **Transaction Restrictions**: PostgreSQL doesn't allow enum modifications within transactions in some contexts
2. **Function Dependencies**: If functions reference the enum type, additions can be blocked
3. **Concurrency**: Multiple enum additions in quick succession can conflict

## Alternative Approach

If you continue having issues, you can also manually add the enum values through the Supabase dashboard:

1. Go to Database → Schema → Types
2. Find `subscription_plan` enum
3. Click "Edit"
4. Add the new values: `student`, `scholar`, `ministry`
5. Save changes

## Verification

After successful enum addition, verify by checking existing plans:

```sql
SELECT name, display_name FROM subscription_plans ORDER BY name;
```

You should see the new plans after running the enhanced schema.