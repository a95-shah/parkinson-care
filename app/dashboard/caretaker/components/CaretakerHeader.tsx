import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Search,
  RefreshCw,
} from "lucide-react";
import { UserProfile } from "@/lib/supabase/config";
import { ThemeToggle } from '@/components/ThemeToggle';

interface CaretakerHeaderProps {
  profile: UserProfile;
  title: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function CaretakerHeader({ profile, title, refreshing, onRefresh }: CaretakerHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background dark:bg-slate-950 dark:border-slate-800 px-6">
      <h1 className="text-xl font-semibold text-green-900 dark:text-green-400">{title}</h1>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className={refreshing ? "animate-spin text-green-600 dark:text-green-400" : "text-muted-foreground hover:text-green-600 dark:hover:text-green-400"}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          )}
          <ThemeToggle />
        </div>
        
        <div className="h-8 w-[1px] bg-border dark:bg-slate-800" />
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium dark:text-white">{profile.full_name}</span>
            <span className="text-xs text-muted-foreground capitalize">Caretaker</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-800/50">
            {profile.full_name[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
