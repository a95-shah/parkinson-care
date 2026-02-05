'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ThemeToggle({ variant = 'ghost', size = 'icon', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${
          isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
        }`}
        style={{ position: isDark ? 'absolute' : 'relative' }}
      />
      <Moon
        className={`h-4 w-4 transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
        }`}
        style={{ position: !isDark ? 'absolute' : 'relative' }}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
