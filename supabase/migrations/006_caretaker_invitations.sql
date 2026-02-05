-- Migration: Caretaker Invitation System
-- File: supabase/migrations/006_caretaker_invitations.sql

-- 1. Create Invitations Table
CREATE TABLE public.caretaker_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_by_user_id UUID REFERENCES auth.users(id) NOT NULL,
  invited_by_role TEXT NOT NULL CHECK (invited_by_role IN ('patient', 'admin')),
  token UUID DEFAULT gen_random_uuid() NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Invitations
ALTER TABLE public.caretaker_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view all invitations
CREATE POLICY "Admins can view invitations"
  ON public.caretaker_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can insert invitations
CREATE POLICY "Admins can insert invitations"
  ON public.caretaker_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Patients can view their sent invitations
CREATE POLICY "Patients can view sent invitations"
  ON public.caretaker_invitations
  FOR SELECT
  USING (invited_by_user_id = auth.uid());

-- Patients can insert invitations
CREATE POLICY "Patients can insert invitations"
  ON public.caretaker_invitations
  FOR INSERT
  WITH CHECK (
    invited_by_user_id = auth.uid() AND
    invited_by_role = 'patient'
  );

-- 2. Function to enforce invitation-only signup for caretakers
-- This runs BEFORE a user is created in auth.users (technically hard to trigger directly in Supabase on auth.users directly via SQL policies, 
-- but we can use a trigger on public.profiles if we assume profiles are created immediately)
-- BETTER APPROACH: Use a trigger on public.profiles to block creation if no invite exists.

CREATE OR REPLACE FUNCTION public.check_caretaker_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if role is caretaker
  IF NEW.role = 'caretaker' THEN
    -- Check if a pending invitation exists for this email
    IF NOT EXISTS (
      SELECT 1 FROM public.caretaker_invitations
      WHERE email = NEW.email AND status = 'pending'
    ) THEN
      RAISE EXCEPTION 'Caretaker signup requires a valid invitation.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles insert to check invitation
CREATE TRIGGER check_caretaker_invitation_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_caretaker_invitation();

-- 3. Function to handle auto-assignment and invite status update
CREATE OR REPLACE FUNCTION public.handle_caretaker_signup()
RETURNS TRIGGER AS $$
DECLARE
  invite_record public.caretaker_invitations%ROWTYPE;
BEGIN
  -- Only process if role is caretaker
  IF NEW.role = 'caretaker' THEN
    -- Get the invitation info
    SELECT * INTO invite_record
    FROM public.caretaker_invitations
    WHERE email = NEW.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
      -- If invited by a patient, create the assignment automatically
      IF invite_record.invited_by_role = 'patient' THEN
        INSERT INTO public.patient_caretaker_assignments (
          patient_id,
          caretaker_id,
          assigned_by,
          assigned_at,
          status,
          notes
        ) VALUES (
          invite_record.invited_by_user_id, -- Patient ID (inviter)
          NEW.id,                           -- Caretaker ID (new user)
          invite_record.invited_by_user_id, -- Assigned by Patient
          NOW(),
          'active',
          'Auto-assigned via invitation'
        );
      END IF;

      -- Update invitation status to accepted
      UPDATE public.caretaker_invitations
      SET status = 'accepted', updated_at = NOW()
      WHERE id = invite_record.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles insert (AFTER) to handle assignment
CREATE TRIGGER handle_caretaker_signup_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_caretaker_signup();
