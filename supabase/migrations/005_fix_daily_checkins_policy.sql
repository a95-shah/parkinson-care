-- Fix typo in policy table name (daily_check_ins -> daily_checkins)

-- Create policy for the correct table: daily_checkins
create policy "Caretakers can view assigned patients check-ins"
  on public.daily_checkins for select
  using (
    exists (
      select 1 from public.patient_caretaker_assignments
      where patient_id = daily_checkins.user_id 
        and caretaker_id = auth.uid()
        and status = 'active'
    )
  );

-- Admins permissions were also on the wrong table name in 003_admin...
create policy "Admins can view all check-ins"
  on public.daily_checkins for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can insert check-ins"
  on public.daily_checkins for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update all check-ins"
  on public.daily_checkins for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete check-ins"
  on public.daily_checkins for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );