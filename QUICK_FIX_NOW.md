# ⚡ QUICK FIX - Do This Now!

## 🚨 Error: "Profile not found"

## ✅ THE FIX (Copy & Paste 3 Times)

### Open Supabase Dashboard → SQL Editor

---

### 📋 **COPY THIS (Section 1)** → Paste → Click Run

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
```

**Expected:** ✅ Success

---

### 📋 **COPY THIS (Section 2)** → Paste → Click Run ⭐ IMPORTANT!

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

**Expected:** ✅ Success (creates missing profiles!)

---

### 📋 **COPY THIS (Section 3)** → Paste → Click Run

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL) as missing_profiles;
```

**Expected:** 
```
total_users | total_profiles | missing_profiles
     3      |       3        |        0
```
✅ missing_profiles = 0

---

## 🧪 NOW TRY LOGGING IN

```
http://localhost:3000/login
```

**Should work! 🎉**

---

## 🔥 If Still Doesn't Work

### Quick Manual Fix:

1. **Get your user ID:**
```sql
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';
```

2. **Create profile manually:**
```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'YOUR_USER_ID_FROM_STEP_1',
  'YOUR_EMAIL@example.com',
  'Your Name',
  'patient'
);
```

3. **Try login again!**

---

## ✅ That's It!

**Run all 3 SQL sections above, then login!** 🚀
