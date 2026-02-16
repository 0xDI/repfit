# Fix: Database Error Saving New User

## Problem
New users cannot sign up because the `phone` column has a UNIQUE constraint, and multiple empty strings violate this constraint.

## Solution Steps

### Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/cshxcttmkddskguyniec
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `scripts/014_fix_phone_unique_constraint.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for confirmation message: "Fix applied successfully!"

### Option 2: Run via Project Scripts

If your project has script execution enabled:
```bash
# Navigate to your project directory
cd /path/to/your/project

# The script is already in your scripts folder
# Run it using your Supabase CLI or database tool
```

## What This Fix Does

1. **Updates existing data**: Converts empty phone strings to NULL
2. **Removes NOT NULL constraint**: Allows users to sign up without a phone
3. **Drops old unique constraint**: Removes the constraint causing conflicts
4. **Adds partial unique index**: Ensures phones are unique ONLY when provided
5. **Updates trigger function**: New users get NULL phone instead of empty string
6. **Adds error handling**: Prevents auth failures even if profile creation has issues

## After Running the Fix

- New users can sign up immediately without the database error
- Users can optionally add their phone number later in their profile
- Phone numbers remain unique when provided
- No data loss - all existing user data is preserved

## Verify the Fix Worked

After running the script, try signing up with a new email. You should:
- ✅ Receive the magic link email
- ✅ Successfully create an account
- ✅ Be redirected to the dashboard
- ❌ No more "Database error saving new user" message
