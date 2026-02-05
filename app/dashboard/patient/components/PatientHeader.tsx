'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { InviteCaretakerDialog } from '@/components/InviteCaretakerDialog';

interface PatientHeaderProps {
  userName: string;
  title: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function PatientHeader({ userName, title, refreshing, onRefresh }: PatientHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
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
          <InviteCaretakerDialog role="patient" />
        </div>
        
        <div className="h-8 w-[1px] bg-border" />
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{getGreeting()}</span>
            <span className="text-xs text-muted-foreground">{userName}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            {userName[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
