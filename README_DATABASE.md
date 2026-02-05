# 📚 Database Migration Guide - Parkinson's App

## 🎯 Quick Start (Choose ONE method)

### Option 1: Single File Setup (RECOMMENDED) ⭐
**Perfect for first-time setup or complete reset**

1. Open Supabase Dashboard → SQL Editor
2. Copy **ALL** contents from `COMPLETE_DATABASE_SETUP.sql`
3. Paste and click "Run"
4. Done! ✅

**This file contains EVERYTHING you need:**
- ✅ Profiles table with admin role
- ✅ Auto-profile creation trigger
- ✅ Daily check-ins table
- ✅ AI insights table
- ✅ Patient-caretaker assignments
- ✅ All RLS policies
- ✅ All indexes for performance

---

### Option 2: Quick Fix (If Already Have Tables)
**Use this if you already have some tables but getting errors**

1. Open Supabase Dashboard → SQL Editor
2. Copy **ALL** contents from `APPLY_THIS_FIX.sql`
3. Paste and click "Run"
4. Done! ✅

**This fixes:**
- ✅ Admin role constraint
- ✅ Auto-profile creation trigger
- ✅ Missing RLS policies

---

## 📁 Available Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **`COMPLETE_DATABASE_SETUP.sql`** | Complete setup from scratch | First time or reset |
| **`APPLY_THIS_FIX.sql`** | Fix admin & trigger issues | Having signup errors |
| `001_initial_schema.sql` | Basic profiles table | Individual migration |
| `002_patient_dashboard.sql` | Daily check-ins | Individual migration |
| `002_ai_insights.sql` | AI insights table | Individual migration |
| `003_admin_and_assignments.sql` | Admin & assignments | Individual migration |
| `004_fix_admin_role_and_trigger.sql` | Fixes for admin | Individual migration |

---

## 🚀 Step-by-Step Instructions

### Method 1: Supabase Dashboard (Web) ⭐

**Step 1: Access Supabase**
```
1. Go to https://supabase.com
2. Login with your credentials
3. Select your Parkinson project
```

**Step 2: Open SQL Editor**
```
1. Look at the left sidebar
2. Click on "SQL Editor" (looks like </> icon)
3. You'll see a blank text editor
```

**Step 3: Run the SQL**
```
1. Copy contents from COMPLETE_DATABASE_SETUP.sql
2. Paste into the SQL Editor
3. Click "Run" button (or Ctrl+Enter)
4. Wait for green "Success" message
```

**Step 4: Verify**
```sql
-- Run this query to check if everything is set up:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- ✅ profiles
- ✅ daily_checkins
- ✅ ai_insights
- ✅ patient_caretaker_assignments
- ✅ patient_caretaker_assignments_view

---

### Method 2: Supabase CLI (Advanced)

**Prerequisites:**
```powershell
# Install Supabase CLI
npm install -g supabase

# Or using Scoop (Windows)
scoop install supabase
```

**Step 1: Link Project**
```powershell
cd D:\parkinson
supabase link --project-ref YOUR_PROJECT_REF
```

**Step 2: Push Migrations**
```powershell
# Push all migrations
supabase db push

# Or apply specific migration
supabase db push --include-all
```

**Step 3: Verify**
```powershell
supabase db diff
```

---

## 🧪 Testing Your Setup

### Test 1: Check Role Constraint
```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'profiles_role_check';
```

**Expected:** `role IN ('patient', 'caretaker', 'admin')`

### Test 2: Check Trigger
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected:** One row showing trigger on `auth.users`

### Test 3: Check Tables
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Expected:** At least 4 tables

### Test 4: Check RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** Multiple policies for each table

---

## ✅ Verification Checklist

After applying migrations, verify these work:

- [ ] Can sign up as **Patient**
- [ ] Can sign up as **Caretaker**
- [ ] Can sign up as **Admin**
- [ ] Patient can access `/dashboard/patient`
- [ ] Caretaker can access `/dashboard/caretaker`
- [ ] Admin can access `/dashboard/admin`
- [ ] Patient can complete daily check-ins
- [ ] Admin can see all users
- [ ] Admin can create assignments
- [ ] Caretaker can see assigned patients
- [ ] AI insights are saved and displayed

---

## 🐛 Troubleshooting

### Error: "relation 'profiles' does not exist"
**Cause:** Tables not created yet  
**Solution:** Apply `COMPLETE_DATABASE_SETUP.sql`

### Error: "Database error saving new user"
**Cause:** Missing trigger or wrong constraint  
**Solution:** Apply `APPLY_THIS_FIX.sql`

### Error: "constraint profiles_role_check failed"
**Cause:** Role constraint doesn't include 'admin'  
**Solution:** Apply `APPLY_THIS_FIX.sql`

### Error: "permission denied for table profiles"
**Cause:** RLS policies not set up correctly  
**Solution:** Apply `COMPLETE_DATABASE_SETUP.sql` (includes all policies)

### Error: "duplicate key value violates unique constraint"
**Cause:** Profile already exists for that user  
**Solution:** This is normal, the trigger handles it gracefully

---

## 📊 Database Schema

### Tables Created

#### 1. **profiles**
Stores user account information
- `id` - User UUID (links to auth.users)
- `email` - User email
- `full_name` - Display name
- `role` - patient | caretaker | admin
- `phone` - Optional phone number
- `avatar_url` - Profile picture URL
- `created_at` / `updated_at` - Timestamps

#### 2. **daily_checkins**
Patient daily symptom tracking
- `user_id` - Patient UUID
- `check_in_date` - Date of check-in
- `tremor_score` - 0-10 scale
- `stiffness_score` - 0-10 scale
- `balance_score` - 0-10 scale
- `sleep_score` - 0-10 scale
- `mood_score` - 0-10 scale
- `medication_taken` - yes | no | partially
- `notes` - Optional text notes

#### 3. **ai_insights**
AI-generated health summaries
- `user_id` - Patient UUID
- `insight_type` - daily | weekly | monthly | quarterly
- `date_range_start/end` - Period covered
- `summary` - AI-generated text
- `key_observations` - JSON data
- `medication_patterns` - Text analysis
- `symptom_trends` - Text analysis
- `wearing_off_patterns` - Text analysis
- `recommendations` - AI suggestions

#### 4. **patient_caretaker_assignments**
Links patients to caretakers
- `patient_id` - Patient UUID
- `caretaker_id` - Caretaker UUID
- `assigned_by` - Admin UUID
- `status` - active | inactive
- `notes` - Optional assignment notes

---

## 🔐 Security (Row Level Security)

All tables have RLS enabled with these rules:

### Profiles
- ✅ Users can view/edit their own profile
- ✅ Admins can view/edit/delete all profiles

### Daily Check-ins
- ✅ Patients can view/edit their own check-ins
- ✅ Caretakers can view assigned patients' check-ins
- ✅ Admins can view all check-ins

### AI Insights
- ✅ Patients can view/edit their own insights
- ✅ Caretakers can view assigned patients' insights
- ✅ Admins can view all insights

### Assignments
- ✅ Admins can manage all assignments
- ✅ Caretakers can view their assignments
- ✅ Patients can view their assignments

---

## 🎉 Success!

Once migrations are applied, you should see:

1. **Admin Dashboard** (`/dashboard/admin`)
   - Total Patients: Shows count from profiles table
   - Total Caretakers: Shows count from profiles table
   - Active Assignments: Shows count from assignments table
   - Recent Check-ins: Shows count from last 7 days

2. **Patient Dashboard** (`/dashboard/patient`)
   - Can complete daily check-ins
   - View symptom trends charts
   - Generate AI insights

3. **Caretaker Dashboard** (`/dashboard/caretaker`)
   - View assigned patients
   - See patient check-ins
   - Generate reports

---

## 📞 Need Help?

1. Check Supabase logs: Dashboard → Logs → Database
2. Verify tables: Run verification queries above
3. Check environment variables: Ensure `.env` has correct keys
4. Restart dev server: `npm run dev`

---

## 🔄 Reset Database (Start Over)

If you want to start completely fresh:

```sql
-- WARNING: This deletes ALL data!
DROP TABLE IF EXISTS public.patient_caretaker_assignments CASCADE;
DROP TABLE IF EXISTS public.ai_insights CASCADE;
DROP TABLE IF EXISTS public.daily_checkins CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
```

Then apply `COMPLETE_DATABASE_SETUP.sql` again.

---

**🚀 You're all set! Happy coding!**
