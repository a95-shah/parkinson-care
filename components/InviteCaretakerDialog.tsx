'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inviteCaretaker } from '@/app/actions/invite';
import { toast } from 'sonner';

interface InviteCaretakerDialogProps {
  role: 'patient' | 'admin';
  onInviteSuccess?: () => void;
}

export function InviteCaretakerDialog({ role, onInviteSuccess }: InviteCaretakerDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);



  const [inviteLink, setInviteLink] = useState('');
  const [warning, setWarning] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarning('');
    setSuccess(false);
    setInviteLink('');

    try {
      const result = await inviteCaretaker(email, role);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      toast.success('Invitation sent successfully');
      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
      }
      if (result.warning) {
        setWarning(result.warning);
        toast.warning(result.warning);
      }
      
      if (onInviteSuccess) onInviteSuccess();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite Caretaker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite a Caretaker</DialogTitle>
          <DialogDescription>
            Enter the email address of the caretaker. They will receive an email invitation to set up their account.
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleInvite} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="caretaker@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="text-green-800 font-medium mb-2">Invitation Sent!</p>
              <p className="text-sm text-green-700 mb-4">
                We've sent an email to <strong>{email}</strong> with instructions to join.
              </p>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => {
                setOpen(false);
                setSuccess(false);
                setEmail('');
              }}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
