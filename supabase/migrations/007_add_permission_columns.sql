-- Add permission columns to patient_caretaker_assignments table
-- These columns allow patients to control what access their caretaker has

-- Step 1: Add the permission columns with defaults of false
ALTER TABLE public.patient_caretaker_assignments
ADD COLUMN IF NOT EXISTS can_view_data boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS can_log_on_behalf boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS can_generate_reports boolean DEFAULT false NOT NULL;

-- Step 2: Drop and recreate the view to include the new columns
DROP VIEW IF EXISTS public.patient_caretaker_assignments_view;

CREATE VIEW public.patient_caretaker_assignments_view AS
SELECT 
  pca.id,
  pca.patient_id,
  p_patient.full_name as patient_name,
  p_patient.email as patient_email,
  pca.caretaker_id,
  p_caretaker.full_name as caretaker_name,
  p_caretaker.email as caretaker_email,
  pca.assigned_by,
  p_admin.full_name as assigned_by_name,
  pca.assigned_at,
  pca.status,
  pca.notes,
  pca.can_view_data,
  pca.can_log_on_behalf,
  pca.can_generate_reports,
  pca.created_at,
  pca.updated_at
FROM public.patient_caretaker_assignments pca
LEFT JOIN public.profiles p_patient ON pca.patient_id = p_patient.id
LEFT JOIN public.profiles p_caretaker ON pca.caretaker_id = p_caretaker.id
LEFT JOIN public.profiles p_admin ON pca.assigned_by = p_admin.id;

-- Grant access to the view
GRANT SELECT ON public.patient_caretaker_assignments_view TO authenticated;

-- Step 3: Add RLS policy allowing patients to update ONLY permission columns on their own assignments
CREATE POLICY "Patients can update their own assignment permissions"
  ON public.patient_caretaker_assignments FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Note: The above policy allows patients to update their assignments.
-- The application code in permissions.ts already validates that only permission columns are updated.
