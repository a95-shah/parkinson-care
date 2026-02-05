import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardIndex() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? user.user_metadata?.role;

  if (role === 'admin') redirect('/dashboard/admin');
  if (role === 'caretaker') redirect('/dashboard/caretaker');
  if (role === 'patient') redirect('/dashboard/patient');

  redirect('/login');
}