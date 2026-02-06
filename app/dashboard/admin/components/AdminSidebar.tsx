'use client';

import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  ClipboardCheck, 
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function AdminSidebar({ activeTab, setActiveTab, isOpen = false, onClose, className }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'caretakers', label: 'Caretakers', icon: Stethoscope },
    { id: 'assignments', label: 'Assignments', icon: ClipboardCheck },
  ];

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isOpen]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onClose?.();
  };

  const sidebarContent = (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-2 px-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">PD</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Admin Portal</h2>
          </div>
          {/* Close button - only visible on mobile */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 relative overflow-hidden transition-all duration-300",
                activeTab === item.id && "bg-primary/10 text-primary hover:bg-primary/15 font-semibold shadow-sm"
              )}
              onClick={() => handleTabClick(item.id)}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground opacity-50 uppercase">
          Settings
        </h2>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <form action="/auth/signout" method="post" className="w-full">
             <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - always visible on md+ */}
      <div className={cn("hidden md:block pb-12 min-h-screen w-64 border-r bg-card", className)}>
        {sidebarContent}
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden mobile-overlay-enter"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar - slide-in from left */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-xl md:hidden transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0 mobile-sidebar-enter" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
