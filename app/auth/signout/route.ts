import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Check if a user's session exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  revalidatePath('/', 'layout');

  // Redirect to login page after logout with event
  return NextResponse.redirect(new URL('/login?event=logout', req.url), {
    status: 302,
  });
}