// lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected and auth routes
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup');

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard');

  // Redirect unauthenticated users from protected routes to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to their dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';

    // We redirect to /dashboard and let the logic below handle the specific role redirect
    return NextResponse.redirect(url);
  }

  // --- NEW: Instant Dashboard Redirection ---
  if (user && request.nextUrl.pathname === '/dashboard') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || user.user_metadata?.role;
    let target = null;

    if (role === 'admin') target = '/dashboard/admin';
    else if (role === 'caretaker') target = '/dashboard/caretaker';
    else if (role === 'patient') target = '/dashboard/patient';

    if (target) {
      const redirectResponse = NextResponse.redirect(new URL(target, request.url));

      // Copy cookies to persist session
      // This is critical because `supabaseResponse` might have set-cookie headers (token refresh)
      // We must carry them over to the new redirect response
      const cookiesToSet = supabaseResponse.cookies.getAll();
      cookiesToSet.forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });

      return redirectResponse;
    }
  }

  return supabaseResponse;
}
