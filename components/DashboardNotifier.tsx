'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

function DashboardNotifierContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasNotified = useRef(false);

  useEffect(() => {
    // Prevent double notifications in React.StrictMode or quick re-renders
    if (hasNotified.current) return;

    const event = searchParams.get('event');

    if (event === 'login') {
      // Show notification immediately
      setTimeout(() => {
        toast.success('Login Successful', {
          description: 'Welcome back to Parkinson Care',
          duration: 4000,
        });
      }, 100);

      hasNotified.current = true;
      // Clean up the URL via History API to avoid router refresh clearing the toast
      window.history.replaceState(null, '', pathname);
    } else if (event === 'signup') {
      setTimeout(() => {
        toast.success('Account Created Successfully', {
          description: 'Welcome to Parkinson Care!',
          duration: 4000,
        });
      }, 100);
      
      hasNotified.current = true;
      window.history.replaceState(null, '', pathname);
    }
  }, [searchParams, pathname]); // Removed router from deps as we use window.history

  return null;
}

export default function DashboardNotifier() {
  return (
    <Suspense fallback={null}>
      <DashboardNotifierContent />
    </Suspense>
  );
}
