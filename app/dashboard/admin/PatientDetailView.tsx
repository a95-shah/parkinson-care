'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getPatientCheckIns,
  getPatientStats,
  updatePatientCheckIn,
  deletePatientCheckIn,
  type PatientCheckIn,
  type PatientDetailStats,
} from '@/lib/supabase/admin';
import type { UserProfile } from '@/lib/supabase/config';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Pill,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  User,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PatientDetailViewProps {
  patient: UserProfile;
  onBack: () => void;
}

const SIDE_EFFECTS = [
  'Dizziness',
  'Nausea',
  'Fatigue',
  'Headache',
  'Dry mouth',
  'Constipation',
];

export default function PatientDetailView({ patient, onBack }: PatientDetailViewProps) {
  const [checkIns, setCheckIns] = useState<PatientCheckIn[]>([]);
  const [stats, setStats] = useState<PatientDetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCheckIn, setEditingCheckIn] = useState<PatientCheckIn | null>(null);
  const [editForm, setEditForm] = useState({
    tremor_score: 5,
    stiffness_score: 5,
    balance_score: 5,
    sleep_score: 5,
    mood_score: 5,
    medication_taken: 'yes' as 'yes' | 'missed' | 'partially',
    side_effects: [] as string[],
    side_effects_other: '',
    notes: '',
  });

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    setLoading(true);
    const [checkInsResult, statsResult] = await Promise.all([
      getPatientCheckIns(patient.id),
      getPatientStats(patient.id, patient),
    ]);

    if (!checkInsResult.error) {
      setCheckIns(checkInsResult.checkIns);
    }
    if (!statsResult.error && statsResult.stats) {
      setStats(statsResult.stats);
    }
    setLoading(false);
  };

  const handleEditCheckIn = (checkIn: PatientCheckIn) => {
    setEditingCheckIn(checkIn);
    setEditForm({
      tremor_score: checkIn.tremor_score,
      stiffness_score: checkIn.stiffness_score,
      balance_score: checkIn.balance_score,
      sleep_score: checkIn.sleep_score,
      mood_score: checkIn.mood_score,
      medication_taken: checkIn.medication_taken,
      side_effects: checkIn.side_effects || [],
      side_effects_other: checkIn.side_effects_other || '',
      notes: checkIn.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCheckIn) return;

    const { success, error } = await updatePatientCheckIn(editingCheckIn.id, editForm);

    if (success) {
      toast.success('Check-in updated successfully');
      setEditingCheckIn(null);
      loadPatientData();
    } else {
      toast.error(error || 'Failed to update check-in');
    }
  };

  const handleDeleteCheckIn = async (checkInId: string, date: string) => {
    if (!confirm(`Are you sure you want to delete the check-in from ${date}? This cannot be undone.`)) {
      return;
    }

    const { success, error } = await deletePatientCheckIn(checkInId);

    if (success) {
      toast.success('Check-in deleted successfully');
      loadPatientData();
    } else {
      toast.error(error || 'Failed to delete check-in');
    }
  };

  const handleSideEffectToggle = (effect: string) => {
    setEditForm((prev) => ({
      ...prev,
      side_effects: prev.side_effects.includes(effect)
        ? prev.side_effects.filter((e) => e !== effect)
        : [...prev.side_effects, effect],
    }));
  };

  const getMedicationColor = (taken: string) => {
    switch (taken) {
      case 'yes': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'partially': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner className="py-16" />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
      </div>

      {/* Patient Profile Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {patient.full_name.charAt(0).toUpperCase()}
            </div>
            {patient.full_name}
          </CardTitle>
          <CardDescription className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {patient.email}
            </span>
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {patient.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Joined: {new Date(patient.created_at).toLocaleDateString()}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.totalCheckIns}</p>
                  <p className="text-sm text-green-600">Total Check-ins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.missedDays}</p>
                  <p className="text-sm text-red-600">Missed Days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.medicationAdherence}%</p>
                  <p className="text-sm text-blue-600">Medication Adherence</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.daysSinceRegistration}</p>
                  <p className="text-sm text-purple-600">Days Since Joined</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Average Scores */}
      {stats && stats.totalCheckIns > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Average Symptom Scores</CardTitle>
            <CardDescription>Based on {stats.totalCheckIns} check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold">{stats.avgTremor}</p>
                <p className="text-sm text-muted-foreground">Tremor</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold">{stats.avgStiffness}</p>
                <p className="text-sm text-muted-foreground">Stiffness</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold">{stats.avgBalance}</p>
                <p className="text-sm text-muted-foreground">Balance</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold">{stats.avgSleep}</p>
                <p className="text-sm text-muted-foreground">Sleep</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold">{stats.avgMood}</p>
                <p className="text-sm text-muted-foreground">Mood</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Side Effects */}
      {stats && stats.mostCommonSideEffects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Common Side Effects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.mostCommonSideEffects.map((effect) => (
                <span
                  key={effect}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                >
                  {effect}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-ins History */}
      <Card>
        <CardHeader>
          <CardTitle>Check-ins History</CardTitle>
          <CardDescription>All daily check-ins for this patient</CardDescription>
        </CardHeader>
        <CardContent>
          {checkIns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No check-ins recorded yet</p>
          ) : (
            <div className="space-y-3">
              {checkIns.map((checkIn) => (
                <div key={checkIn.id} className="border rounded-lg p-4">
                  {editingCheckIn?.id === checkIn.id ? (
                    /* Edit Form */
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">
                          Editing: {new Date(checkIn.check_in_date).toLocaleDateString()}
                        </h4>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                            <Check className="h-4 w-4" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCheckIn(null)}
                            className="gap-1"
                          >
                            <X className="h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>

                      {/* Symptom Scores */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {['tremor', 'stiffness', 'balance', 'sleep', 'mood'].map((field) => (
                          <div key={field}>
                            <Label className="capitalize">{field}</Label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={editForm[`${field}_score` as keyof typeof editForm] as number}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  [`${field}_score`]: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>

                      {/* Medication */}
                      <div>
                        <Label>Medication Taken</Label>
                        <div className="flex gap-2 mt-1">
                          {['yes', 'partially', 'missed'].map((option) => (
                            <Button
                              key={option}
                              type="button"
                              size="sm"
                              variant={editForm.medication_taken === option ? 'default' : 'outline'}
                              onClick={() =>
                                setEditForm({
                                  ...editForm,
                                  medication_taken: option as 'yes' | 'missed' | 'partially',
                                })
                              }
                              className="capitalize"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Side Effects */}
                      <div>
                        <Label>Side Effects</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {SIDE_EFFECTS.map((effect) => (
                            <Button
                              key={effect}
                              type="button"
                              size="sm"
                              variant={editForm.side_effects.includes(effect) ? 'default' : 'outline'}
                              onClick={() => handleSideEffectToggle(effect)}
                            >
                              {effect}
                            </Button>
                          ))}
                        </div>
                        <Input
                          placeholder="Other side effects..."
                          value={editForm.side_effects_other}
                          onChange={(e) =>
                            setEditForm({ ...editForm, side_effects_other: e.target.value })
                          }
                          className="mt-2"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <Label>Notes</Label>
                        <Input
                          placeholder="Additional notes..."
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">
                            {new Date(checkIn.check_in_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMedicationColor(
                              checkIn.medication_taken
                            )}`}
                          >
                            Medication: {checkIn.medication_taken}
                          </span>
                        </div>

                        {/* Scores */}
                        <div className="flex flex-wrap gap-3 text-sm mb-2">
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            Tremor: <strong>{checkIn.tremor_score}</strong>
                          </span>
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            Stiffness: <strong>{checkIn.stiffness_score}</strong>
                          </span>
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            Balance: <strong>{checkIn.balance_score}</strong>
                          </span>
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            Sleep: <strong>{checkIn.sleep_score}</strong>
                          </span>
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            Mood: <strong>{checkIn.mood_score}</strong>
                          </span>
                        </div>

                        {/* Side Effects */}
                        {checkIn.side_effects && checkIn.side_effects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            <span className="text-sm text-muted-foreground">Side effects:</span>
                            {checkIn.side_effects.map((effect) => (
                              <span
                                key={effect}
                                className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs"
                              >
                                {effect}
                              </span>
                            ))}
                          </div>
                        )}

                        {checkIn.side_effects_other && (
                          <p className="text-sm text-muted-foreground">
                            Other: {checkIn.side_effects_other}
                          </p>
                        )}

                        {checkIn.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Notes: {checkIn.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCheckIn(checkIn)}
                          className="gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCheckIn(checkIn.id, checkIn.check_in_date)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
