

// app/dashboard/caretaker/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CaretakerDashboardClient from './CaretakerDashboardClient';

export default async function CaretakerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use 'let' so we can reassign it if null
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // FIX: If profile is null, check metadata and construct a fallback
  if (!profile) {
    const role = user.user_metadata?.role;
    
    // If the user's auth metadata says they are a caretaker, let them in
    if (role === 'caretaker') {
      profile = {
        id: user.id,
        role: 'caretaker',
        full_name: user.user_metadata?.full_name || 'Caretaker',
        // Add other required fields from your 'profiles' table schema here if needed
        email: user.email 
      } as any; // 'as any' helps bypass strict typing for the temporary fallback
    } else {
      // Not a caretaker? Go back to main dashboard to be routed correctly
      redirect('/dashboard');
    }
  }

  // Now profile is guaranteed to be an object
  if (profile.role !== 'caretaker') {
     // Safety check: redirect based on their actual role
     if (profile.role === 'patient') redirect('/dashboard/patient');
     if (profile.role === 'admin') redirect('/dashboard/admin');
     redirect('/dashboard');
  }

  return <CaretakerDashboardClient profile={profile} />;
}