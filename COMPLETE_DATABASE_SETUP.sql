-- ============================================
-- COMPLETE_DATABASE_SETUP.sql
-- COMPLETE DATABASE SETUP FOR PARKINSON APP
-- Apply this SQL in Supabase Dashboard > SQL Editor
-- This includes ALL migrations in the correct order
-- ============================================

-- ============================================
-- PART 1: PROFILES TABLE (Initial Schema)
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'caretaker', 'admin')),
  phone text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create policies for regular users
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for admins
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create a function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- ============================================
-- PART 2: AUTO-PROFILE CREATION TRIGGER
-- ============================================

-- Create the auto-profile creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 3: PATIENT-CARETAKER ASSIGNMENTS
-- (Must be created BEFORE daily_checkins due to RLS policy reference)
-- ============================================

CREATE TABLE IF NOT EXISTS public.patient_caretaker_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  caretaker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(patient_id, caretaker_id)
);

-- Enable Row Level Security
ALTER TABLE public.patient_caretaker_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.patient_caretaker_assignments;
DROP POLICY IF EXISTS "Caretakers can view their assigned patients" ON public.patient_caretaker_assignments;
DROP POLICY IF EXISTS "Patients can view their assignments" ON public.patient_caretaker_assignments;

-- Create policies
CREATE POLICY "Admins can manage all assignments"
  ON public.patient_caretaker_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Caretakers can view their assigned patients"
  ON public.patient_caretaker_assignments FOR SELECT
  USING (caretaker_id = auth.uid());

CREATE POLICY "Patients can view their assignments"
  ON public.patient_caretaker_assignments FOR SELECT
  USING (patient_id = auth.uid());

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_patient_caretaker_assignments_updated ON public.patient_caretaker_assignments;
CREATE TRIGGER on_patient_caretaker_assignments_updated
  BEFORE UPDATE ON public.patient_caretaker_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS assignments_patient_id_idx ON public.patient_caretaker_assignments(patient_id);
CREATE INDEX IF NOT EXISTS assignments_caretaker_id_idx ON public.patient_caretaker_assignments(caretaker_id);
CREATE INDEX IF NOT EXISTS assignments_status_idx ON public.patient_caretaker_assignments(status);

-- ============================================
-- PART 4: DAILY CHECK-INS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  check_in_date date NOT NULL,
  tremor_score integer NOT NULL CHECK (tremor_score >= 0 AND tremor_score <= 10),
  stiffness_score integer NOT NULL CHECK (stiffness_score >= 0 AND stiffness_score <= 10),
  balance_score integer NOT NULL CHECK (balance_score >= 0 AND balance_score <= 10),
  sleep_score integer NOT NULL CHECK (sleep_score >= 0 AND sleep_score <= 10),
  mood_score integer NOT NULL CHECK (mood_score >= 0 AND mood_score <= 10),
  medication_taken text NOT NULL CHECK (medication_taken IN ('yes', 'no', 'partially')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, check_in_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can update their own check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Caretakers can view assigned patients check-ins" ON public.daily_checkins;

-- Create policies
CREATE POLICY "Users can view their own check-ins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins"
  ON public.daily_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all check-ins"
  ON public.daily_checkins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Caretakers can view assigned patients check-ins"
  ON public.daily_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_caretaker_assignments
      WHERE caretaker_id = auth.uid() 
      AND patient_id = daily_checkins.user_id 
      AND status = 'active'
    )
  );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_daily_checkins_updated ON public.daily_checkins;
CREATE TRIGGER on_daily_checkins_updated
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS daily_checkins_user_id_idx ON public.daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS daily_checkins_date_idx ON public.daily_checkins(check_in_date DESC);

-- ============================================
-- PART 5: AI INSIGHTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  summary text NOT NULL,
  key_observations jsonb NOT NULL,
  medication_patterns text,
  symptom_trends text,
  wearing_off_patterns text,
  recommendations text,
  data_points_analyzed integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Admins can view all insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Caretakers can view assigned patients insights" ON public.ai_insights;

-- Create policies
CREATE POLICY "Users can view their own insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.ai_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all insights"
  ON public.ai_insights FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Caretakers can view assigned patients insights"
  ON public.ai_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_caretaker_assignments
      WHERE caretaker_id = auth.uid() 
      AND patient_id = ai_insights.user_id 
      AND status = 'active'
    )
  );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_ai_insights_updated ON public.ai_insights;
CREATE TRIGGER on_ai_insights_updated
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ai_insights_user_id_idx ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS ai_insights_created_at_idx ON public.ai_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_insights_date_range_idx ON public.ai_insights(date_range_start, date_range_end);


-- ============================================
-- PART 6: CREATE VIEW FOR ASSIGNMENTS
-- ============================================

CREATE OR REPLACE VIEW public.patient_caretaker_assignments_view AS
SELECT
  pca.id,
  pca.patient_id,
  pp.full_name AS patient_name,
  pp.email AS patient_email,
  pca.caretaker_id,
  pc.full_name AS caretaker_name,
  pc.email AS caretaker_email,
  pca.assigned_by,
  pa.full_name AS assigned_by_name,
  pca.assigned_at,
  pca.status,
  pca.notes,
  pca.created_at,
  pca.updated_at
FROM public.patient_caretaker_assignments pca
JOIN public.profiles pp ON pca.patient_id = pp.id
JOIN public.profiles pc ON pca.caretaker_id = pc.id
LEFT JOIN public.profiles pa ON pca.assigned_by = pa.id;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify everything is set up correctly:

-- 1. Check if all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Check if role constraint includes admin
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'profiles_role_check';

-- 3. Check if trigger exists
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- DONE! Your database is ready!
-- ============================================
