'use client';

import { Button } from "@/components/ui/button";
import { 
  RefreshCw,
  Menu,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase/config";
import { InviteCaretakerDialog } from '@/components/InviteCaretakerDialog';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminHeaderProps {
  profile: UserProfile;
  title: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onMenuToggle?: () => void;
}

export function AdminHeader({ profile, title, refreshing, onRefresh, onMenuToggle }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background dark:bg-slate-950 dark:border-slate-800 px-4 md:px-6">
      {/* Mobile menu button */}
      {onMenuToggle && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      )}
      
      <h1 className="text-lg md:text-xl font-semibold text-foreground dark:text-gray-100 truncate">{title}</h1>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className={refreshing ? "animate-spin" : "text-muted-foreground hover:text-foreground"}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          )}
          <ThemeToggle />
          <div className="hidden sm:block">
            <InviteCaretakerDialog role="admin" />
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-border dark:bg-slate-800 hidden sm:block" />
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-foreground dark:text-gray-100">{profile.full_name}</span>
            <span className="text-xs text-muted-foreground capitalize">{profile.role}</span>
          </div>
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {profile.full_name[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
