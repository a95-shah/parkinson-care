-- Update profiles table to add admin role
alter table public.profiles 
  drop constraint profiles_role_check;

alter table public.profiles 
  add constraint profiles_role_check 
  check (role in ('patient', 'caretaker', 'admin'));

-- Create patient_caretaker_assignments table
create table public.patient_caretaker_assignments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  caretaker_id uuid references public.profiles(id) on delete cascade not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(patient_id, caretaker_id)
);

-- Enable Row Level Security
alter table public.patient_caretaker_assignments enable row level security;

-- Create policies for patient_caretaker_assignments
-- Admins can do everything
create policy "Admins can view all assignments"
  on public.patient_caretaker_assignments for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can insert assignments"
  on public.patient_caretaker_assignments for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update assignments"
  on public.patient_caretaker_assignments for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete assignments"
  on public.patient_caretaker_assignments for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Caretakers can view their own assignments
create policy "Caretakers can view their assignments"
  on public.patient_caretaker_assignments for select
  using (caretaker_id = auth.uid());

-- Patients can view their assignments
create policy "Patients can view their assignments"
  on public.patient_caretaker_assignments for select
  using (patient_id = auth.uid());

-- Create trigger for updated_at
create trigger on_patient_caretaker_assignments_updated
  before update on public.patient_caretaker_assignments
  for each row
  execute procedure public.handle_updated_at();

-- Update profiles policies to allow admins to view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Caretakers can view assigned patients' profiles
create policy "Caretakers can view assigned patients"
  on public.profiles for select
  using (
    role = 'patient' and exists (
      select 1 from public.patient_caretaker_assignments
      where patient_id = profiles.id 
        and caretaker_id = auth.uid()
        and status = 'active'
    )
  );

-- Update daily_check_ins policies to allow caretakers to view assigned patients' check-ins
create policy "Caretakers can view assigned patients check-ins"
  on public.daily_check_ins for select
  using (
    exists (
      select 1 from public.patient_caretaker_assignments
      where patient_id = daily_check_ins.user_id 
        and caretaker_id = auth.uid()
        and status = 'active'
    )
  );

-- Admins can view all check-ins
create policy "Admins can view all check-ins"
  on public.daily_check_ins for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can manage all check-ins
create policy "Admins can insert check-ins"
  on public.daily_check_ins for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update all check-ins"
  on public.daily_check_ins for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete check-ins"
  on public.daily_check_ins for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Update AI insights policies for admins
create policy "Admins can view all AI insights"
  on public.ai_insights for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Caretakers can view assigned patients' AI insights
create policy "Caretakers can view assigned patients AI insights"
  on public.ai_insights for select
  using (
    exists (
      select 1 from public.patient_caretaker_assignments
      where patient_id = ai_insights.user_id 
        and caretaker_id = auth.uid()
        and status = 'active'
    )
  );

-- Create indexes for better performance
create index patient_caretaker_assignments_patient_id_idx on public.patient_caretaker_assignments(patient_id);
create index patient_caretaker_assignments_caretaker_id_idx on public.patient_caretaker_assignments(caretaker_id);
create index patient_caretaker_assignments_status_idx on public.patient_caretaker_assignments(status);

-- Create a view for easy assignment queries with names
create view public.patient_caretaker_assignments_view as
select 
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
  pca.created_at,
  pca.updated_at
from public.patient_caretaker_assignments pca
left join public.profiles p_patient on pca.patient_id = p_patient.id
left join public.profiles p_caretaker on pca.caretaker_id = p_caretaker.id
left join public.profiles p_admin on pca.assigned_by = p_admin.id;

-- Grant access to the view
grant select on public.patient_caretaker_assignments_view to authenticated;
