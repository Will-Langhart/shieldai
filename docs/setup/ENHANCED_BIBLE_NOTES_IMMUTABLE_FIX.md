# Enhanced Bible Notes Immutable Function Fix

## Issue
When running `database/enhanced-bible-notes.sql`, you encounter:
```
ERROR: 42P17: functions in index expression must be marked IMMUTABLE
```

## Root Cause
PostgreSQL requires that functions used in index expressions be marked as `IMMUTABLE`. The original schema tried to create a GIN index using `to_tsvector('english', ...)` directly, but this function is not considered immutable when used with a language parameter in an index context.

## Solution Applied

### 1. Created Immutable Function
```sql
CREATE OR REPLACE FUNCTION bible_notes_search_vector(note TEXT, reference TEXT, tags TEXT[])
RETURNS tsvector AS $$
BEGIN
    RETURN to_tsvector('english', COALESCE(note, '') || ' ' || COALESCE(reference, '') || ' ' || COALESCE(array_to_string(tags, ' '), ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;
```

Key points:
- Marked as `IMMUTABLE` - tells PostgreSQL this function has no side effects
- `STRICT` - returns NULL if any parameter is NULL
- Uses `COALESCE` to handle NULL values safely

### 2. Updated Index Definition
```sql
CREATE INDEX IF NOT EXISTS idx_bible_notes_fulltext 
ON bible_notes USING GIN(bible_notes_search_vector(note, reference, tags));
```

### 3. Updated Search Function
Updated the search query to use our new immutable function:
```sql
AND (p_search_query IS NULL OR bible_notes_search_vector(bn.note, bn.reference, bn.tags) @@ plainto_tsquery('english', p_search_query))
```

## Benefits

1. **Performance**: The GIN index can now be created successfully for fast full-text search
2. **Consistency**: Search queries use the same logic as the index
3. **Maintainability**: Centralized search vector logic in one function
4. **Safety**: Proper NULL handling with COALESCE

## Verification

After running the corrected schema, verify the index was created:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'bible_notes' 
AND indexname = 'idx_bible_notes_fulltext';
```

Test the search functionality:

```sql
SELECT search_bible_notes(
    'your-user-id'::UUID, 
    'search term', 
    NULL, NULL, NULL, NULL, NULL, NULL, 10, 0
);
```

## Technical Details

### Why IMMUTABLE is Required
- Index expressions must be deterministic
- PostgreSQL needs to guarantee the function always returns the same output for the same input
- This ensures index consistency and correctness

### Alternative Solutions Considered
1. **Remove language parameter**: Use `to_tsvector()` without 'english' (less optimal)
2. **Stored computed column**: Add a computed tsvector column (more storage)
3. **Custom immutable function**: ✅ Chosen - best balance of performance and functionality