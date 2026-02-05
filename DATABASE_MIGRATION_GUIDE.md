# 🗄️ Database Migration Guide for Parkinson's App

## 📋 Overview
This guide will help you apply all necessary database migrations to set up your Supabase database correctly.

---

## 🚀 Method 1: Using Supabase Dashboard (RECOMMENDED)

This is the easiest method and works every time!

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Login to your account
3. Select your **Parkinson project**

### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
   - It looks like a database icon with `</>`
2. You'll see a blank SQL editor

### Step 3: Apply the Main Fix (MOST IMPORTANT)
1. Open the file `APPLY_THIS_FIX.sql` from your project root
2. Copy **ALL** the contents (lines 1-60)
3. Paste into the Supabase SQL Editor
4. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
5. Wait for the green "Success" message

**✅ This will:**
- Fix the role constraint to include 'admin'
- Create the auto-profile creation trigger
- Enable proper user signup for all roles

### Step 4: Verify the Fix
Run this query in the SQL Editor:

```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'profiles_role_check';
```

**Expected Result:**
You should see: `role IN ('patient', 'caretaker', 'admin')`

---

## 🔧 Method 2: Using Supabase CLI (Advanced)

If you prefer using the command line and have Supabase CLI installed:

### Prerequisites
```powershell
# Check if Supabase CLI is installed
supabase --version

# If not installed, install it:
npm install -g supabase
# OR
scoop install supabase
```

### Step 1: Link Your Project
```powershell
cd D:\parkinson
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your PROJECT_REF:**
- Go to Supabase Dashboard → Project Settings
- Look for "Reference ID" or "Project ID"

### Step 2: Push Migrations
```powershell
supabase db push
```

This will apply all migrations in the `supabase/migrations/` folder.

### Step 3: Verify
```powershell
supabase db diff
```

This should show no differences if everything is applied correctly.

---

## 📁 Your Migration Files

Here are all the migration files in your project:

### 1. `001_initial_schema.sql`
**Purpose:** Creates the initial database schema
- Creates `profiles` table
- Sets up Row Level Security (RLS)
- Creates basic policies

### 2. `002_patient_dashboard.sql`
**Purpose:** Creates tables for patient data
- Creates `daily_checkins` table
- Sets up medication tracking
- Adds symptom scoring

### 3. `002_ai_insights.sql`
**Purpose:** Creates AI insights storage
- Creates `ai_insights` table
- Stores Gemini AI-generated summaries
- Links insights to users

### 4. `003_admin_and_assignments.sql`
**Purpose:** Adds admin role and assignments
- Creates `patient_caretaker_assignments` table
- Adds assignment management
- Creates views for easy querying

### 5. `004_fix_admin_role_and_trigger.sql`
**Purpose:** Fixes admin role issues
- Updates role constraint
- Fixes auto-profile creation trigger
- Same content as `APPLY_THIS_FIX.sql`

---

## ⚠️ IMPORTANT: Quick Fix (If Having Issues)

If you're having trouble with signup/login, just apply this ONE file:

### File: `APPLY_THIS_FIX.sql`

**How to apply:**
1. Open Supabase Dashboard → SQL Editor
2. Copy ALL contents from `APPLY_THIS_FIX.sql`
3. Paste and click "Run"
4. Wait for "Success"
5. Done! ✅

**This single file contains everything you need to:**
- ✅ Allow admin role signup
- ✅ Auto-create profiles on signup
- ✅ Fix all role-related issues

---

## 🧪 Testing Your Migrations

After applying migrations, test with these SQL queries:

### 1. Check if profiles table exists:
```sql
SELECT * FROM public.profiles LIMIT 5;
```

### 2. Check if role constraint is correct:
```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'profiles_role_check';
```

Expected: `(role = ANY (ARRAY['patient'::text, 'caretaker'::text, 'admin'::text]))`

### 3. Check if trigger exists:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Expected: One row showing the trigger on `auth.users`

### 4. Check if assignments table exists:
```sql
SELECT * FROM public.patient_caretaker_assignments LIMIT 5;
```

### 5. Check if AI insights table exists:
```sql
SELECT * FROM public.ai_insights LIMIT 5;
```

---

## 🐛 Troubleshooting

### Problem: "relation 'profiles' does not exist"
**Solution:** Apply `001_initial_schema.sql` first

### Problem: "Database error saving new user"
**Solution:** Apply `APPLY_THIS_FIX.sql`

### Problem: "constraint profiles_role_check failed"
**Solution:** 
1. Apply `APPLY_THIS_FIX.sql`
2. Or manually run:
```sql
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('patient', 'caretaker', 'admin'));
```

### Problem: "Users not being created in profiles table"
**Solution:** The trigger is missing. Apply `APPLY_THIS_FIX.sql`

---

## ✅ Step-by-Step Quick Start

**For first-time setup, follow this order:**

1. **Open Supabase Dashboard** → SQL Editor

2. **Apply the main fix:**
   - Copy all contents from `APPLY_THIS_FIX.sql`
   - Paste and Run in SQL Editor

3. **Verify it worked:**
   ```sql
   SELECT constraint_name, check_clause 
   FROM information_schema.check_constraints 
   WHERE constraint_name = 'profiles_role_check';
   ```

4. **Test signup:**
   - Go to `http://localhost:3000/signup`
   - Try signing up as Patient
   - Try signing up as Caretaker
   - Try signing up as Admin
   - All should work! ✅

---

## 🎯 What Each Migration Does

| File | What It Creates | Why You Need It |
|------|----------------|-----------------|
| `001_initial_schema.sql` | profiles table, basic RLS | Core user data |
| `002_patient_dashboard.sql` | daily_checkins table | Patient symptoms tracking |
| `002_ai_insights.sql` | ai_insights table | AI-generated summaries |
| `003_admin_and_assignments.sql` | assignments table | Admin/caretaker features |
| `004_fix_admin_role_and_trigger.sql` | Fixes constraints & triggers | Makes everything work |
| **`APPLY_THIS_FIX.sql`** | **ALL THE FIXES** | **USE THIS ONE!** ✨ |

---

## 📞 Need Help?

If you're still having issues:

1. Check Supabase logs:
   - Dashboard → Logs → Database
   - Look for any error messages

2. Verify your tables exist:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles';
   ```

---

## 🎉 Success Checklist

After applying migrations, you should be able to:

- ✅ Sign up as Patient
- ✅ Sign up as Caretaker  
- ✅ Sign up as Admin
- ✅ Login and see respective dashboards
- ✅ Admin can see all users
- ✅ Admin can create assignments
- ✅ Caretakers can see assigned patients
- ✅ Patients can complete daily check-ins
- ✅ AI insights work on patient dashboard

---

## 🚀 Ready to Go!

**Quick Command:**
Just apply `APPLY_THIS_FIX.sql` in Supabase Dashboard SQL Editor and you're done! 🎊
