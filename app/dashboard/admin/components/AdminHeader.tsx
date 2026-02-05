import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Search,
  RefreshCw,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase/config";
import { InviteCaretakerDialog } from '@/components/InviteCaretakerDialog';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminHeaderProps {
  profile: UserProfile;
  title: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function AdminHeader({ profile, title, refreshing, onRefresh }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background dark:bg-slate-950 dark:border-slate-800 px-6">
      <h1 className="text-xl font-semibold text-foreground dark:text-gray-100">{title}</h1>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
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
          <InviteCaretakerDialog role="admin" />
        </div>
        
        <div className="h-8 w-[1px] bg-border dark:bg-slate-800" />
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-foreground dark:text-gray-100">{profile.full_name}</span>
            <span className="text-xs text-muted-foreground capitalize">{profile.role}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {profile.full_name[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
