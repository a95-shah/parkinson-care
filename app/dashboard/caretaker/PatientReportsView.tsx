'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRecentCheckIns, type DailyCheckIn } from '@/lib/supabase/checkins';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PatientCaretakerAssignment } from '@/lib/supabase/admin';
import DailyCheckInForm from '../patient/DailyCheckInForm';

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
    return <div className="text-center py-8">Loading patient data...</div>;
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
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-blue-900">{assignment.patient_name}</CardTitle>
              <CardDescription className="text-blue-700">{assignment.patient_email}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button
          variant={days === 7 ? 'default' : 'outline'}
          onClick={() => setDays(7)}
          size="sm"
        >
          Last 7 Days
        </Button>
        <Button
          variant={days === 30 ? 'default' : 'outline'}
          onClick={() => setDays(30)}
          size="sm"
        >
          Last 30 Days
        </Button>
        <Button
          variant={days === 90 ? 'default' : 'outline'}
          onClick={() => setDays(90)}
          size="sm"
        >
          Last 90 Days
        </Button>
      </div>

      {/* Permission Check for Data View */}
      {!assignment.can_view_data ? (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Access Restricted</AlertTitle>
          <AlertDescription className="text-yellow-700">
            {assignment.patient_name} has not granted permission to view their health data and stats.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Statistics Summary */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Tremor</CardDescription>
                  <CardTitle className="text-3xl">{stats.avgTremor}/10</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Last {days} days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Stiffness</CardDescription>
                  <CardTitle className="text-3xl">{stats.avgStiffness}/10</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Last {days} days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Balance</CardDescription>
                  <CardTitle className="text-3xl">{stats.avgBalance}/10</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Last {days} days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Sleep Quality</CardDescription>
                  <CardTitle className="text-3xl">{stats.avgSleep}/10</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Last {days} days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Mood</CardDescription>
                  <CardTitle className="text-3xl">{stats.avgMood}/10</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Last {days} days</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardDescription className="text-green-700">Medication Adherence</CardDescription>
                  <CardTitle className="text-3xl text-green-900">{stats.adherence}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-green-600">
                    {stats.medicationTaken} taken, {stats.medicationMissed} missed
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Daily Check-ins List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daily Check-ins</CardTitle>
                <CardDescription>
                  {checkIns.length === 0 
                    ? 'No check-ins recorded for this period'
                    : `${checkIns.length} check-ins in the last ${days} days`}
                </CardDescription>
              </div>
              {/* Log on Behalf Button */}
              {assignment.can_log_on_behalf && (
                <Button onClick={() => setShowCheckInForm(true)}>
                  Log Check-in on Behalf
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {checkIns.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {checkIns.map((checkIn) => (
                    <Card key={checkIn.id} className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">
                              {new Date(checkIn.check_in_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                checkIn.medication_taken === 'yes'
                                  ? 'bg-green-100 text-green-800'
                                  : checkIn.medication_taken === 'partially'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              Medication: {checkIn.medication_taken === 'missed' ? 'missed' : checkIn.medication_taken}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Tremor</p>
                              <p className="font-semibold">{checkIn.tremor_score}/10</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Stiffness</p>
                              <p className="font-semibold">{checkIn.stiffness_score}/10</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Balance</p>
                              <p className="font-semibold">{checkIn.balance_score}/10</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Sleep</p>
                              <p className="font-semibold">{checkIn.sleep_score}/10</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Mood</p>
                              <p className="font-semibold">{checkIn.mood_score}/10</p>
                            </div>
                          </div>

                          {checkIn.notes && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Patient Notes:</p>
                              <p className="text-sm text-gray-600">{checkIn.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print Report Button */}
          {assignment.can_generate_reports && checkIns.length > 0 ? (
            <Button onClick={() => window.print()} className="w-full" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </Button>
          ) : !assignment.can_generate_reports && (
            <Alert className="bg-gray-50 border-gray-200">
              <AlertDescription className="text-gray-500 text-center">
                Report generation is disabled by the patient.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
