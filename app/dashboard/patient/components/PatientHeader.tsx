'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw, Menu } from "lucide-react";
import { InviteCaretakerDialog } from '@/components/InviteCaretakerDialog';
import { ThemeToggle } from "@/components/ThemeToggle";

interface PatientHeaderProps {
  userName: string;
  title: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onMenuToggle?: () => void;
}

export function PatientHeader({ userName, title, refreshing, onRefresh, onMenuToggle }: PatientHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
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
      
      <div className="flex flex-col min-w-0 flex-shrink">
        <h1 className="text-lg md:text-xl font-semibold truncate">{title}</h1>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className={refreshing ? "animate-spin" : ""}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          )}
          <ThemeToggle />
          <div className="hidden sm:block">
            <InviteCaretakerDialog role="patient" />
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-border hidden sm:block" />
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium">{getGreeting()}</span>
            <span className="text-xs text-muted-foreground">{userName}</span>
          </div>
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-sm md:text-base">
            {userName[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
