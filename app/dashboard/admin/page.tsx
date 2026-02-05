
// app/dashboard/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // FIX: Handle missing profile row
  if (!profile) {
    const role = user.user_metadata?.role;
    
    if (role === 'admin') {
      profile = {
        id: user.id,
        role: 'admin',
        full_name: user.user_metadata?.full_name || 'Admin',
        email: user.email
      } as any;
    } else {
      redirect('/dashboard');
    }
  }

  // Final role verification
  if (profile.role !== 'admin') redirect('/dashboard');

  return <AdminDashboardClient profile={profile} />;
}