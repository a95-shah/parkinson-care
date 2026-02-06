'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getAllAssignments,
  getAllPatients,
  getAllCaretakers,
  createAssignment,
  updateAssignmentStatus,
  deleteAssignment,
  type PatientCaretakerAssignment,
} from '@/lib/supabase/admin';
import type { UserProfile } from '@/lib/supabase/config';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AssignmentsManagementProps {
  onUpdate: () => void;
}

export default function AssignmentsManagement({ onUpdate }: AssignmentsManagementProps) {
  const [assignments, setAssignments] = useState<PatientCaretakerAssignment[]>([]);
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [caretakers, setCaretakers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedCaretaker, setSelectedCaretaker] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [assignmentsResult, patientsResult, caretakersResult] = await Promise.all([
      getAllAssignments(),
      getAllPatients(),
      getAllCaretakers(),
    ]);

    setAssignments(assignmentsResult.assignments);
    setPatients(patientsResult.patients);
    setCaretakers(caretakersResult.caretakers);
    setLoading(false);
  };

  const handleCreateAssignment = async () => {
    if (!selectedPatient || !selectedCaretaker) {
      setMessage({ type: 'error', text: 'Please select both patient and caretaker' });
      return;
    }

    // Check for duplicate assignment
    const existingAssignment = assignments.find(
      (a) => a.patient_id === selectedPatient && a.caretaker_id === selectedCaretaker
    );

    if (existingAssignment) {
      if (existingAssignment.status === 'active') {
        setMessage({ type: 'error', text: 'This patient is already currently assigned to this caretaker.' });
      } else {
        setMessage({ type: 'error', text: 'An inactive assignment already exists for this pair. Please reactivate it below instead of creating a new one.' });
      }
      return;
    }

    const { success, error } = await createAssignment(selectedPatient, selectedCaretaker, notes);

    if (success) {
      toast.success('Assignment created successfully');
      setMessage({ type: 'success', text: 'Assignment created successfully' });
      setShowCreateForm(false);
      setSelectedPatient('');
      setSelectedCaretaker('');
      setNotes('');
      loadData();
      onUpdate();
    } else {
      toast.error(error || 'Failed to create assignment');
      setMessage({ type: 'error', text: error || 'Failed to create assignment' });
    }
  };

  const handleToggleStatus = async (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { success, error} = await updateAssignmentStatus(assignmentId, newStatus);

    if (success) {
      const msg = `Assignment ${newStatus === 'active' ? 'activated' : 'deactivated'}`;
      toast.success(msg);
      setMessage({ type: 'success', text: msg });
      loadData();
      onUpdate();
    } else {
      toast.error(error || 'Failed to update assignment');
      setMessage({ type: 'error', text: error || 'Failed to update assignment' });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, patientName: string, caretakerName: string) => {
    if (!confirm(`Remove assignment: ${patientName} ← ${caretakerName}?`)) {
      return;
    }

    const { success, error } = await deleteAssignment(assignmentId);

    if (success) {
      toast.success('Assignment deleted successfully');
      setMessage({ type: 'success', text: 'Assignment deleted successfully' });
      loadData();
      onUpdate();
    } else {
      toast.error(error || 'Failed to delete assignment');
      setMessage({ type: 'error', text: error || 'Failed to delete assignment' });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading assignments..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Patient-Caretaker Assignments</CardTitle>
              <CardDescription>Assign caretakers to patients for monitoring</CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel' : '+ New Assignment'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Create Assignment Form */}
          {showCreateForm && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Select Patient</Label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.full_name} ({patient.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Select Caretaker</Label>
                    <select
                      value={selectedCaretaker}
                      onChange={(e) => setSelectedCaretaker(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Choose a caretaker...</option>
                      {caretakers.map((caretaker) => (
                        <option key={caretaker.id} value={caretaker.id}>
                          {caretaker.full_name} ({caretaker.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Add any notes about this assignment..."
                  />
                </div>

                <Button onClick={handleCreateAssignment} className="w-full">
                  Create Assignment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assignments List */}
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No assignments yet</p>
            ) : (
              assignments.map((assignment) => (
                <Card key={assignment.id} className={assignment.status === 'active' ? 'border-green-200' : 'border-gray-200'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-semibold">{assignment.patient_name}</span>
                          </div>
                          <span className="text-muted-foreground">→</span>
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="font-semibold">{assignment.caretaker_name}</span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Patient: {assignment.patient_email}</p>
                          <p>Caretaker: {assignment.caretaker_email}</p>
                          {assignment.notes && (
                            <p className="italic">Note: {assignment.notes}</p>
                          )}
                          <p className="text-xs">
                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()} by {assignment.assigned_by_name || 'System'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleToggleStatus(assignment.id, assignment.status)}
                          variant="outline"
                          size="sm"
                        >
                          {assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteAssignment(assignment.id, assignment.patient_name, assignment.caretaker_name)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Total assignments: {assignments.length} ({assignments.filter((a) => a.status === 'active').length} active)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
