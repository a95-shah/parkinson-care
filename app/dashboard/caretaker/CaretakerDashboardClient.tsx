'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCaretakerAssignments, type PatientCaretakerAssignment } from '@/lib/supabase/admin';
import { getCaretakerStats } from '@/lib/supabase/checkins';
import type { UserProfile } from '@/lib/supabase/config';
import PatientReportsView from './PatientReportsView';
import { CaretakerSidebar } from './components/CaretakerSidebar';
import { CaretakerHeader } from './components/CaretakerHeader';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Users, FileText, Activity } from 'lucide-react';

interface CaretakerDashboardClientProps {
  profile: UserProfile;
}

export default function CaretakerDashboardClient({ profile }: CaretakerDashboardClientProps) {
  const [assignments, setAssignments] = useState<PatientCaretakerAssignment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientCaretakerAssignment | null>(null);
  const [stats, setStats] = useState<{ totalCheckIns: number; weekCheckIns: number; monthReports: number }>({ 
    totalCheckIns: 0, 
    weekCheckIns: 0, 
    monthReports: 0 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  // Handle selectedPatient changes to switch tabs/views intuitively
  useEffect(() => {
    if (selectedPatient) {
      setActiveTab('patients');
    }
  }, [selectedPatient]);

  const loadAssignments = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [{ assignments: data }, statsData] = await Promise.all([
        getCaretakerAssignments(profile.id),
        getCaretakerStats()
      ]);
      setAssignments(data || []);
      setStats({
        totalCheckIns: statsData?.totalCheckIns || 0,
        weekCheckIns: statsData?.weekCheckIns || 0,
        monthReports: statsData?.monthReports || 0
      });
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAssignments(true);
  };

  const getPageTitle = () => {
    if (selectedPatient) return `Patient: ${selectedPatient.patient_name}`;
    switch (activeTab) {
      case 'overview': return 'Dashboard Overview';
      case 'patients': return 'My Patients';
      default: return 'Caretaker Dashboard';
    }
  };

  // If loading initially
  if (loading && !refreshing && assignments.length === 0) {
    return (
      <div className="flex min-h-screen bg-muted/40 dark:bg-background font-sans">
        <CaretakerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <CaretakerHeader profile={profile} title="Loading..." />
          <main className="flex-1 flex items-center justify-center">
            <LoadingSpinner size={48} text="Loading dashboard..." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40 dark:bg-background font-sans">
      <CaretakerSidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedPatient(null);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <CaretakerHeader 
          profile={profile} 
          title={getPageTitle()} 
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border dark:border-green-800/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-900 dark:text-green-300">
                        Assigned Patients
                      </CardTitle>
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">{assignments.length}</div>
                      <p className="text-xs text-green-600/80 dark:text-green-500 mt-1">
                        Active assignments
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border dark:border-blue-800/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Total Check-ins
                      </CardTitle>
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalCheckIns}</div>
                      <p className="text-xs text-blue-600/80 dark:text-blue-500 mt-1">
                        All time ({stats.weekCheckIns} this week)
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 dark:border dark:border-purple-800/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-300">
                        Reports Generated
                      </CardTitle>
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.monthReports}</div>
                      <p className="text-xs text-purple-600/80 dark:text-purple-500 mt-1">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Access to Patients */}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mt-8 mb-4">Quick Patient Access</h3>
                {assignments.length === 0 ? (
                  <Card className="border-dashed bg-muted/50 dark:bg-muted/10">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mb-4 opacity-20" />
                      <p>No patients assigned yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {assignments.map((assignment) => (
                      <Card 
                        key={assignment.id} 
                        className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-green-500 cursor-pointer overflow-hidden dark:bg-card dark:hover:bg-accent/10"
                        onClick={() => {
                          setSelectedPatient(assignment);
                          setActiveTab('patients');
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                              {assignment.patient_name[0]?.toUpperCase()}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-semibold text-base text-foreground group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                                {assignment.patient_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">{assignment.patient_email}</p>
                              <div className="flex items-center gap-2 pt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                                  assignment.can_view_data 
                                    ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30'
                                }`}>
                                  Access: {assignment.can_view_data ? 'Granted' : 'Restricted'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="space-y-6">
                {selectedPatient ? (
                  <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                    <Button 
                      onClick={() => setSelectedPatient(null)} 
                      variant="ghost" 
                      className="mb-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400"
                    >
                      ← Back to Patient List
                    </Button>
                    <PatientReportsView assignment={selectedPatient} />
                  </div>
                ) : (
                  <Card className="border-0 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border-b dark:border-slate-700/50">
                      <CardTitle>Your Assigned Patients</CardTitle>
                      <CardDescription>
                        Select a patient to view their daily check-ins and generate reports
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {assignments.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Patients Assigned</h3>
                          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                            You haven't been assigned any patients yet. Contact your administrator to get started.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assignments.map((assignment) => (
                            <div 
                              key={assignment.id} 
                              className="flex items-center justify-between p-4 rounded-xl border hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50/50 dark:hover:bg-green-900/10 hover:shadow-sm transition-all cursor-pointer group dark:bg-slate-900/50"
                              onClick={() => setSelectedPatient(assignment)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold group-hover:bg-green-600 group-hover:text-white transition-colors">
                                  {assignment.patient_name[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-green-800 dark:group-hover:text-green-400 transition-colors">
                                    {assignment.patient_name}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.patient_email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                  <p className="text-xs text-gray-400">Assigned</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {new Date(assignment.assigned_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 dark:text-green-400">
                                  View Details →
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}