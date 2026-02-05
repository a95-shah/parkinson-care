// app/dashboard/patient/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PatientDashboardClient from './PatientDashboardClient';

export default async function PatientDashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? user.user_metadata?.role;

  // Only bounce if role is known and not patient
  if (role && role !== 'patient') redirect('/dashboard');

  // If role is missing entirely, send to an onboarding / login
  if (!role) redirect('/login');

  const userName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User';

  return <PatientDashboardClient userName={userName} />;
}