'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRecentCheckIns, type DailyCheckIn } from '@/lib/supabase/checkins';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PatientCaretakerAssignment } from '@/lib/supabase/admin';
import DailyCheckInForm from '../patient/DailyCheckInForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FileText } from 'lucide-react';

interface PatientReportsViewProps {
  assignment: PatientCaretakerAssignment;
}

export default function PatientReportsView({ assignment }: PatientReportsViewProps) {
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  useEffect(() => {
    if (assignment.can_view_data) {
      loadCheckIns();
    } else {
      setLoading(false);
    }
  }, [assignment.patient_id, days, assignment.can_view_data]);

  const loadCheckIns = async () => {
    setLoading(true);
    const data = await getRecentCheckIns(days, assignment.patient_id);
    setCheckIns(data);
    setLoading(false);
  };

  const calculateStats = () => {
    if (checkIns.length === 0) return null;

    const avgTremor = (checkIns.reduce((sum, c) => sum + c.tremor_score, 0) / checkIns.length).toFixed(1);
    const avgStiffness = (checkIns.reduce((sum, c) => sum + c.stiffness_score, 0) / checkIns.length).toFixed(1);
    const avgBalance = (checkIns.reduce((sum, c) => sum + c.balance_score, 0) / checkIns.length).toFixed(1);
    const avgSleep = (checkIns.reduce((sum, c) => sum + c.sleep_score, 0) / checkIns.length).toFixed(1);
    const avgMood = (checkIns.reduce((sum, c) => sum + c.mood_score, 0) / checkIns.length).toFixed(1);
    
    const medicationTaken = checkIns.filter(c => c.medication_taken === 'yes').length;
    const medicationPartial = checkIns.filter(c => c.medication_taken === 'partially').length;
    const medicationMissed = checkIns.filter(c => c.medication_taken === 'missed').length;
    const adherence = Math.round((medicationTaken / checkIns.length) * 100);

    return {
      avgTremor,
      avgStiffness,
      avgBalance,
      avgSleep,
      avgMood,
      medicationTaken,
      medicationPartial,
      medicationMissed,
      adherence,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return <LoadingSpinner text="Loading patient data..." />;
  }

  if (showCheckInForm) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowCheckInForm(false)}>
          ← Cancel Check-in
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Log Check-in for {assignment.patient_name}</CardTitle>
            <CardDescription>Logging on behalf of patient</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyCheckInForm
              onComplete={() => {
                setShowCheckInForm(false);
                loadCheckIns();
              }}
              onCancel={() => setShowCheckInForm(false)}
              patientId={assignment.patient_id}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Info Card */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 via-indigo-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-blue-100">
              <span className="text-2xl font-bold text-blue-700">{assignment.patient_name[0]?.toUpperCase()}</span>
            </div>
            <div>
              <CardTitle className="text-2xl text-blue-900">{assignment.patient_name}</CardTitle>
              <CardDescription className="text-blue-700 font-medium">{assignment.patient_email}</CardDescription>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/60 border border-blue-200 text-blue-700 font-medium">
                  Patient
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/60 border border-green-200 text-green-700 font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Control Bar: Time Range & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <span className="text-sm font-medium text-muted-foreground mr-2">Time Range:</span>
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d as 7 | 30 | 90)}
              size="sm"
              className={days === d ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Last {d} Days
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
           {/* Log on Behalf Button */}
           {assignment.can_log_on_behalf && (
            <Button onClick={() => setShowCheckInForm(true)} className="flex-1 sm:flex-none">
              <span className="mr-2">+</span> Log Check-in
            </Button>
          )}
          {assignment.can_generate_reports && checkIns.length > 0 && (
            <Button onClick={() => window.print()} variant="outline" className="flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50">
               🖨️ Print Report
            </Button>
          )}
        </div>
      </div>

      {/* Permission Check for Data View */}
      {!assignment.can_view_data ? (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800 font-semibold flex items-center gap-2">
            🔒 Access Restricted
          </AlertTitle>
          <AlertDescription className="text-amber-700 mt-1">
            {assignment.patient_name} has not granted permission to view their detailed health data.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Statistics Summary */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Avg Tremor', value: stats.avgTremor, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                { label: 'Avg Stiffness', value: stats.avgStiffness, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                { label: 'Avg Balance', value: stats.avgBalance, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
                { label: 'Avg Sleep', value: stats.avgSleep, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { label: 'Avg Mood', value: stats.avgMood, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
              ].map((stat) => (
                <Card key={stat.label} className={`border ${stat.border} shadow-sm hover:shadow-md transition-shadow`}>
                  <CardHeader className={`pb-2 ${stat.bg} rounded-t-xl border-b ${stat.border}`}>
                    <CardDescription className="font-medium text-gray-600">{stat.label}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}<span className="text-lg text-muted-foreground font-normal">/10</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Average over last {days} days</p>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-green-200 shadow-sm bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="pb-2 border-b border-green-100">
                  <CardDescription className="text-green-800 font-medium">Medication Adherence</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-green-700">{stats.adherence}%</div>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full">{stats.medicationTaken} taken</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full">{stats.medicationMissed} missed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Daily Check-ins List */}
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Daily Check-ins History
              </CardTitle>
              <CardDescription>
                {checkIns.length === 0 
                  ? 'No check-ins recorded for this period'
                  : `Showing ${checkIns.length} check-ins from the last ${days} days`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {checkIns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                  <FileText className="h-12 w-12 opacity-20 mb-3" />
                  <p>No data available for this time range.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {checkIns.map((checkIn) => (
                    <div key={checkIn.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800">
                            {new Date(checkIn.check_in_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Logged at {new Date(checkIn.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
                            checkIn.medication_taken === 'yes'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : checkIn.medication_taken === 'partially'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          Meds: {checkIn.medication_taken === 'missed' ? 'missed' : checkIn.medication_taken}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                         {[
                           { label: 'Tremor', val: checkIn.tremor_score, color: 'text-gray-900' },
                           { label: 'Stiffness', val: checkIn.stiffness_score, color: 'text-gray-900' },
                           { label: 'Balance', val: checkIn.balance_score, color: 'text-gray-900' },
                           { label: 'Sleep', val: checkIn.sleep_score, color: 'text-gray-900' },
                           { label: 'Mood', val: checkIn.mood_score, color: 'text-gray-900' },
                         ].map((s) => (
                           <div key={s.label} className="bg-gray-50/50 p-2 rounded border border-gray-100">
                             <p className="text-xs text-gray-500 uppercase font-medium">{s.label}</p>
                             <p className={`font-bold text-lg ${s.color}`}>{s.val}/10</p>
                           </div>
                         ))}
                      </div>

                      {checkIn.notes && (
                        <div className="mt-4 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-sm text-gray-700 flex gap-2 items-start">
                          <span className="text-yellow-600 mt-0.5">💬</span>
                          <div>
                            <span className="font-semibold text-gray-900">Notes:</span> {checkIn.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
