import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  ClipboardCheck, 
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}

export function AdminSidebar({ activeTab, setActiveTab, className }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'caretakers', label: 'Caretakers', icon: Stethoscope },
    { id: 'assignments', label: 'Assignments', icon: ClipboardCheck },
  ];

  return (
    <div className={cn("pb-12 min-h-screen w-64 border-r bg-card", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-4 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">PD</span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Admin Portal</h2>
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
                onClick={() => setActiveTab(item.id)}
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
    </div>
  );
}
