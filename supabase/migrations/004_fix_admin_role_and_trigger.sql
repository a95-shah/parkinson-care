-- Fix: Update the role constraint to include 'admin'
--004_fix_admin_role_and_trigger.sql
alter table public.profiles 
  drop constraint if exists profiles_role_check;

alter table public.profiles 
  add constraint profiles_role_check 
  check (role in ('patient', 'caretaker', 'admin'));

-- Fix: Create the trigger function to auto-create profiles when users sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, phone)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.email), 
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop the trigger if it exists and recreate it
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
