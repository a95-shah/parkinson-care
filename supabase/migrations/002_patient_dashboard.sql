-- Migration: Patient Dashboard Schema
-- File: supabase/migrations/002_patient_dashboard.sql

-- Create daily_checkins table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Symptom scores (0-10)
  tremor_score INTEGER CHECK (tremor_score >= 0 AND tremor_score <= 10),
  stiffness_score INTEGER CHECK (stiffness_score >= 0 AND stiffness_score <= 10),
  balance_score INTEGER CHECK (balance_score >= 0 AND balance_score <= 10),
  sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 10),
  mood_score INTEGER CHECK (mood_score >= 0 AND mood_score <= 10),
  
  -- Medication tracking
  medication_taken TEXT CHECK (medication_taken IN ('yes', 'missed', 'partially')),
  
  -- Side effects (stored as JSON array)
  side_effects JSONB DEFAULT '[]'::jsonb,
  side_effects_other TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one check-in per day per user
  UNIQUE(user_id, check_in_date)
);

-- Create index for faster queries
CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins(user_id, check_in_date DESC);
CREATE INDEX idx_daily_checkins_user_created ON public.daily_checkins(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_checkins
CREATE POLICY "Users can view their own check-ins"
  ON public.daily_checkins
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins"
  ON public.daily_checkins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins"
  ON public.daily_checkins
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins"
  ON public.daily_checkins
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_daily_checkins_updated_at
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();