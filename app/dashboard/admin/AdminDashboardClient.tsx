// app/dashboard/admin/AdminDashboardClient.tsx

'use client';

import { useState, useEffect } from 'react';
import { getAdminDashboardStats, type DashboardStats } from '@/lib/supabase/admin';
import type { UserProfile } from '@/lib/supabase/config';
import PatientsManagement from './PatientsManagement';
import CaretakersManagement from './CaretakersManagement';
import AssignmentsManagement from './AssignmentsManagement';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { StatsCard } from './components/StatsCard';
import { Users, Stethoscope, ClipboardCheck, Activity } from 'lucide-react';

interface AdminDashboardClientProps {
  profile: UserProfile;
}

export default function AdminDashboardClient({ profile }: AdminDashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  // Reload stats when switching to overview tab
  useEffect(() => {
    if (activeTab === 'overview') {
      loadStats(true);
    }
  }, [activeTab]);

  const loadStats = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    const { stats: data, error } = await getAdminDashboardStats();
    
    if (!error && data) {
      setStats(data);
      setLastUpdated(new Date());
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    loadStats();
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard Overview';
      case 'patients': return 'Patients Management';
      case 'caretakers': return 'Caretakers Management';
      case 'assignments': return 'Patient Assignments';
      default: return 'Admin Dashboard';
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/40 font-sans">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader 
          profile={profile} 
          title={getPageTitle()} 
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  <StatsCard 
                    title="Total Patients"
                    value={stats?.totalPatients || 0}
                    description="Registered patient accounts"
                    icon={Users}
                    variant="blue"
                    loading={loading}
                  />
                  <StatsCard 
                    title="Total Caretakers"
                    value={stats?.totalCaretakers || 0}
                    description="Registered caretaker accounts"
                    icon={Stethoscope}
                    variant="green"
                    loading={loading}
                  />
                  <StatsCard 
                    title="Active Assignments"
                    value={stats?.activeAssignments || 0}
                    description="Patients assigned to caretakers"
                    icon={ClipboardCheck}
                    variant="purple"
                    loading={loading}
                  />
                  <StatsCard 
                    title="Recent Check-ins"
                    value={stats?.recentCheckIns || 0}
                    description="Check-ins in last 7 days"
                    icon={Activity}
                    variant="orange"
                    loading={loading}
                  />
                </div>

                {/* Quick Actions removed/moved to Sidebar or implicitly handled */}
                
              </div>
            )}

            {activeTab === 'patients' && (
              <PatientsManagement onUpdate={loadStats} />
            )}

            {activeTab === 'caretakers' && (
              <CaretakersManagement onUpdate={loadStats} />
            )}

            {activeTab === 'assignments' && (
              <AssignmentsManagement onUpdate={loadStats} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}