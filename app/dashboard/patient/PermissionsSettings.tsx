'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getMyCaretakerAssignment, updateCaretakerPermissions } from '@/lib/supabase/permissions';
import { toast } from 'sonner';

export default function PermissionsSettings() {
  const [assignment, setAssignment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    can_view_data: false,
    can_log_on_behalf: false,
    can_generate_reports: false,
  });

  useEffect(() => {
    loadAssignment();
  }, []);

  const loadAssignment = async () => {
    setLoading(true);
    const { assignment, error } = await getMyCaretakerAssignment();
    
    if (error) {
        // toast.error(error); // Optional: suppress if no assignment found just means no caretaker
        console.error(error);
    }

    if (assignment) {
      setAssignment(assignment);
      setPermissions({
        can_view_data: assignment.can_view_data || false,
        can_log_on_behalf: assignment.can_log_on_behalf || false,
        can_generate_reports: assignment.can_generate_reports || false,
      });
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof typeof permissions, value: boolean) => {
    if (!assignment) return;

    // Optimistic update
    setPermissions(prev => ({ ...prev, [key]: value }));

    const { success, error } = await updateCaretakerPermissions(assignment.id, {
      [key]: value
    });

    if (success) {
      toast.success('Permissions updated successfully');
    } else {
      toast.error(error || 'Failed to update permissions');
      // Revert on failure
      setPermissions(prev => ({ ...prev, [key]: !value }));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading permissions...</div>;
  }

  if (!assignment) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          You currently do not have an active caretaker assigned. Once a caretaker is assigned, you can manage their permissions here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Caretaker Permissions</CardTitle>
          <CardDescription>
            Manage what access your assigned caretaker ({assignment.caretaker_name}) has to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* View Patient Data */}
            <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <Label htmlFor="view-data" className="text-base font-semibold">
                  View Patient Data
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow caretaker to view your daily check-ins and health trends.
                </p>
              </div>
              <Switch
                id="view-data"
                checked={permissions.can_view_data}
                onCheckedChange={(checked) => handleToggle('can_view_data', checked)}
              />
            </div>

            {/* Log Entries on Behalf */}
            <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <Label htmlFor="log-on-behalf" className="text-base font-semibold">
                  Log Entries on Behalf
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow caretaker to submit daily check-ins for you if you miss them.
                </p>
              </div>
              <Switch
                id="log-on-behalf"
                checked={permissions.can_log_on_behalf}
                onCheckedChange={(checked) => handleToggle('can_log_on_behalf', checked)}
              />
            </div>

            {/* Generate Reports */}
            <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <Label htmlFor="generate-reports" className="text-base font-semibold">
                  Generate Reports
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow caretaker to generate and download health summary reports.
                </p>
              </div>
              <Switch
                id="generate-reports"
                checked={permissions.can_generate_reports}
                onCheckedChange={(checked) => handleToggle('can_generate_reports', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
