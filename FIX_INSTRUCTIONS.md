# 🔧 FIX: "Setting up your profile" Error

## 🐛 The Problem

Users are seeing **"Setting up your profile... Please try again"** error when trying to login. This means the user profile is not being created in the `profiles` table after signup.

---

## 🔍 Root Causes

1. **Database trigger not working** - The `on_auth_user_created` trigger may not exist or is failing
2. **Double profile creation** - Code was trying to create profiles both manually AND via trigger, causing conflicts
3. **Timing issues** - Profile query happens before trigger completes

---

## ✅ FIXES APPLIED

### 1. Fixed Database Trigger
- Created improved `handle_new_user()` function with better error handling
- Added `ON CONFLICT` clause to prevent duplicate key errors
- Added proper exception handling
- Used `SECURITY DEFINER` for proper permissions

### 2. Fixed `lib/supabase/auth.ts`
- Removed manual profile creation (let trigger handle it)
- Added verification check after signup
- Added fallback manual creation if trigger fails
- Added 500ms delay to let trigger complete

### 3. Fixed `app/login/page.tsx`
- Added retry logic (3 attempts with 1s delays)
- Better error messages
- Handles cases where profile is being created

---

## 🚀 HOW TO APPLY THE FIX

### Step 1: Apply the Database Fix

1. **Open Supabase Dashboard** → SQL Editor

2. **Copy ALL contents** from `FIX_PROFILE_ISSUE.sql`

3. **Paste and Run** in SQL Editor

4. **Check the verification queries** at the end - you should see:
   - `trigger_count: 1` ✅
   - `function_count: 1` ✅
   - `missing_profiles: 0` ✅

### Step 2: Fix Existing Users (If Any)

If the query shows users without profiles, uncomment and run this in SQL Editor:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'role', 'patient')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Restart Your Dev Server

```powershell
# Stop the server (Ctrl+C)
Ctrl+C

# Clear cache
Remove-Item -Recurse -Force .next

# Restart
npm run dev
```

### Step 4: Clear Your Browser Session

Visit: `http://localhost:3000/logout`

This will clear all cookies and session data.

---

## 🧪 TEST THE FIX

### Test 1: Sign Up as Patient

1. Go to `http://localhost:3000/signup`
2. Select **"Patient"** role
3. Enter details:
   - Full Name: Test Patient
   - Email: patient@test.com
   - Password: Test123!
4. Click "Create Account"
5. **Expected**: Redirect to `/dashboard/patient` ✅
6. **NOT**: Error message ❌

### Test 2: Verify Profile in Database

1. Open Supabase Dashboard → SQL Editor
2. Run this query:

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 5;
```

3. **Expected**: You should see the new user's profile ✅

### Test 3: Login as That User

1. Go to `http://localhost:3000/logout` (to clear session)
2. Go to `http://localhost:3000/login`
3. Login with: patient@test.com / Test123!
4. **Expected**: Redirect to `/dashboard/patient` ✅
5. **NOT**: "Setting up your profile" error ❌

### Test 4: Sign Up as Admin

1. Go to `http://localhost:3000/logout`
2. Go to `http://localhost:3000/signup`
3. Select **"Admin"** role
4. Enter details and signup
5. **Expected**: Redirect to `/dashboard/admin` with stats ✅

---

## 🔍 Verify Trigger is Working

### Check 1: Trigger Exists

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected**: 1 row returned ✅

### Check 2: Function Exists

```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

**Expected**: 1 row returned ✅

### Check 3: All Users Have Profiles

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as users,
  (SELECT COUNT(*) FROM public.profiles) as profiles;
```

**Expected**: users = profiles ✅

---

## 🐛 Troubleshooting

### Issue: Trigger still doesn't work

**Check trigger permissions:**

```sql
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
```

### Issue: "duplicate key value violates unique constraint"

This means the trigger is trying to create a profile that already exists. The new trigger handles this with `ON CONFLICT`, but if you still see it:

```sql
-- Update the function to include ON CONFLICT
-- (Already in FIX_PROFILE_ISSUE.sql)
```

### Issue: Still getting "Setting up your profile" error

**Manual fix - Create the profile manually:**

1. Get the user ID from auth.users:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

2. Create the profile:
```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'USER_ID_FROM_STEP_1',
  'your-email@example.com',
  'Your Name',
  'patient' -- or 'caretaker' or 'admin'
)
ON CONFLICT (id) DO NOTHING;
```

3. Try logging in again

---

## 📊 What Changed

### Before (❌ Had Issues):
```typescript
// auth.ts - Manual profile creation
await createUserProfile(user.id, {...});

// Database - No trigger or broken trigger
// Result: Race conditions, duplicates, or missing profiles
```

### After (✅ Fixed):
```typescript
// auth.ts - Let trigger handle it, verify, fallback if needed
await new Promise(resolve => setTimeout(resolve, 500));
// Verify profile exists, create manually if trigger failed

// Database - Robust trigger with ON CONFLICT
CREATE TRIGGER on_auth_user_created...
ON CONFLICT (id) DO UPDATE...
```

### Benefits:
- ✅ No duplicate key errors
- ✅ Automatic profile creation
- ✅ Fallback if trigger fails
- ✅ Retry logic in login
- ✅ Better error handling

---

## 🎉 SUCCESS CRITERIA

After applying all fixes, you should be able to:

1. ✅ Sign up as Patient → Dashboard loads
2. ✅ Sign up as Caretaker → Dashboard loads
3. ✅ Sign up as Admin → Dashboard loads
4. ✅ Login after signup → Works immediately
5. ✅ No "Setting up your profile" error
6. ✅ All users have profiles in database
7. ✅ Trigger creates profiles automatically

---

## 📝 Files Modified

1. **`FIX_PROFILE_ISSUE.sql`** ⭐ (NEW - Apply this first!)
2. **`lib/supabase/auth.ts`** - Removed manual profile creation
3. **`app/login/page.tsx`** - Added retry logic
4. **`FIX_INSTRUCTIONS.md`** - This file

---

## 🚀 Quick Command Summary

```powershell
# 1. Apply SQL fix in Supabase Dashboard
# (Copy FIX_PROFILE_ISSUE.sql and run in SQL Editor)

# 2. Clear cache and restart
Ctrl+C
Remove-Item -Recurse -Force .next
npm run dev

# 3. Clear session
# Visit: http://localhost:3000/logout

# 4. Test signup
# Visit: http://localhost:3000/signup
```

**That's it! Your issue should now be fixed! 🎊**
