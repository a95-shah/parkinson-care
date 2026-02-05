'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllPatients, updateUserProfile, deleteUserProfile } from '@/lib/supabase/admin';
import type { UserProfile } from '@/lib/supabase/config';
import { toast } from 'sonner';

interface PatientsManagementProps {
  onUpdate: () => void;
}

export default function PatientsManagement({ onUpdate }: PatientsManagementProps) {
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const loadPatients = async () => {
    setLoading(true);
    const { patients: data, error } = await getAllPatients();
    if (!error) {
      setPatients(data);
      setFilteredPatients(data);
    }
    setLoading(false);
  };

  const handleEdit = (patient: UserProfile) => {
    setEditingPatient(patient);
    setEditForm({
      full_name: patient.full_name,
      email: patient.email,
      phone: patient.phone || '',
    });
    setMessage(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPatient) return;

    const { success, error } = await updateUserProfile(editingPatient.id, {
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone || undefined,
    });

    if (success) {
      toast.success('Patient updated successfully');
      setMessage({ type: 'success', text: 'Patient updated successfully' });
      setEditingPatient(null);
      loadPatients();
      onUpdate();
    } else {
      toast.error(error || 'Failed to update patient');
      setMessage({ type: 'error', text: error || 'Failed to update patient' });
    }
  };

  const handleDelete = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to delete ${patientName}? This action cannot be undone.`)) {
      return;
    }

    const { success, error } = await deleteUserProfile(patientId);

    if (success) {
      toast.success('Patient deleted successfully');
      setMessage({ type: 'success', text: 'Patient deleted successfully' });
      loadPatients();
      onUpdate();
    } else {
      toast.error(error || 'Failed to delete patient');
      setMessage({ type: 'error', text: error || 'Failed to delete patient' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading patients...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patients Management</CardTitle>
          <CardDescription>View and manage all registered patients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" onClick={() => setSearchTerm('')}>Clear</Button>
          </div>

          {/* Patients List */}
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No patients found</p>
            ) : (
              filteredPatients.map((patient) => (
                <Card key={patient.id} className="border-blue-100">
                  <CardContent className="pt-6">
                    {editingPatient?.id === patient.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Full Name</Label>
                            <Input
                              value={editForm.full_name}
                              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdit} size="sm">Save</Button>
                          <Button onClick={() => setEditingPatient(null)} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                          {patient.phone && (
                            <p className="text-sm text-muted-foreground">📞 {patient.phone}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(patient.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(patient)} variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(patient.id, patient.full_name)}
                            variant="destructive"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
