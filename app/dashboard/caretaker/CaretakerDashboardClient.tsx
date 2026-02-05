
// app/dashboard/caretaker/CaretakerDashboardClient.tsx
'use client';

import { useState, useEffect } from 'react';
// Removed useRouter and signOut imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCaretakerAssignments, type PatientCaretakerAssignment } from '@/lib/supabase/admin';
import { getCaretakerStats } from '@/lib/supabase/checkins';
import type { UserProfile } from '@/lib/supabase/config';
import PatientReportsView from './PatientReportsView';

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

  useEffect(() => {
    loadAssignments();
  }, []);


  const loadAssignments = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };



  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            Caretaker Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome, {profile.full_name}
          </p>
        </div>

        {/* UPDATED LOGOUT: Using Secure Form Action */}
        <form action="/auth/signout" method="post">
          <Button 
            variant="outline" 
            type="submit"
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </form>
      </div>

      {selectedPatient ? (
        <div className="space-y-4">
          <Button onClick={() => setSelectedPatient(null)} variant="outline">
            ← Back to Patients List
          </Button>
          <PatientReportsView assignment={selectedPatient} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardDescription className="text-green-700">Assigned Patients</CardDescription>
                <CardTitle className="text-4xl text-green-900">{assignments.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-green-600">Active assignments</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardDescription className="text-blue-700">Total Check-ins</CardDescription>
                <CardTitle className="text-4xl text-blue-900">{stats.totalCheckIns}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-blue-600">All time ({stats.weekCheckIns} this week)</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-2">
                <CardDescription className="text-purple-700">Reports Generated</CardDescription>
                <CardTitle className="text-4xl text-purple-900">-</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-purple-600">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Patients */}
          <Card>
            <CardHeader>
              <CardTitle>Your Assigned Patients</CardTitle>
              <CardDescription>
                {assignments.length === 0 
                  ? 'No patients assigned yet. Contact your administrator.'
                  : 'Click on a patient to view their daily check-ins and generate reports'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600 mb-2">No patients assigned</p>
                  <p className="text-sm text-gray-500">Your administrator will assign patients to you</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {assignments.map((assignment) => (
                    <Card 
                      key={assignment.id} 
                      className="border-blue-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-md"
                      onClick={() => setSelectedPatient(assignment)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink:0">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{assignment.patient_name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{assignment.patient_email}</p>
                            {assignment.notes && (
                              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                                Note: {assignment.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button className="w-full mt-4" size="sm" variant="secondary">
                          View Patient Data →
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}