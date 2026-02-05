'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllCaretakers, updateUserProfile, deleteUserProfile } from '@/lib/supabase/admin';
import type { UserProfile } from '@/lib/supabase/config';
import { toast } from 'sonner';

interface CaretakersManagementProps {
  onUpdate: () => void;
}

export default function CaretakersManagement({ onUpdate }: CaretakersManagementProps) {
  const [caretakers, setCaretakers] = useState<UserProfile[]>([]);
  const [filteredCaretakers, setFilteredCaretakers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCaretaker, setEditingCaretaker] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCaretakers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = caretakers.filter(
        (c) =>
          c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCaretakers(filtered);
    } else {
      setFilteredCaretakers(caretakers);
    }
  }, [searchTerm, caretakers]);

  const loadCaretakers = async () => {
    setLoading(true);
    const { caretakers: data, error } = await getAllCaretakers();
    if (!error) {
      setCaretakers(data);
      setFilteredCaretakers(data);
    }
    setLoading(false);
  };

  const handleEdit = (caretaker: UserProfile) => {
    setEditingCaretaker(caretaker);
    setEditForm({
      full_name: caretaker.full_name,
      email: caretaker.email,
      phone: caretaker.phone || '',
    });
    setMessage(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCaretaker) return;

    const { success, error } = await updateUserProfile(editingCaretaker.id, {
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone || undefined,
    });

    if (success) {
      toast.success('Caretaker updated successfully');
      setMessage({ type: 'success', text: 'Caretaker updated successfully' });
      setEditingCaretaker(null);
      loadCaretakers();
      onUpdate();
    } else {
      toast.error(error || 'Failed to update caretaker');
      setMessage({ type: 'error', text: error || 'Failed to update caretaker' });
    }
  };

  const handleDelete = async (caretakerId: string, caretakerName: string) => {
    if (!confirm(`Are you sure you want to delete ${caretakerName}? This will also remove all their patient assignments.`)) {
      return;
    }

    const { success, error } = await deleteUserProfile(caretakerId);

    if (success) {
      toast.success('Caretaker deleted successfully');
      setMessage({ type: 'success', text: 'Caretaker deleted successfully' });
      loadCaretakers();
      onUpdate();
    } else {
      toast.error(error || 'Failed to delete caretaker');
      setMessage({ type: 'error', text: error || 'Failed to delete caretaker' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading caretakers...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Caretakers Management</CardTitle>
          <CardDescription>View and manage all registered caretakers</CardDescription>
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

          {/* Caretakers List */}
          <div className="space-y-3">
            {filteredCaretakers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No caretakers found</p>
            ) : (
              filteredCaretakers.map((caretaker) => (
                <Card key={caretaker.id} className="border-green-100">
                  <CardContent className="pt-6">
                    {editingCaretaker?.id === caretaker.id ? (
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
                          <Button onClick={() => setEditingCaretaker(null)} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {caretaker.full_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{caretaker.email}</p>
                          {caretaker.phone && (
                            <p className="text-sm text-muted-foreground">📞 {caretaker.phone}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(caretaker.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(caretaker)} variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(caretaker.id, caretaker.full_name)}
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
            Showing {filteredCaretakers.length} of {caretakers.length} caretakers
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
