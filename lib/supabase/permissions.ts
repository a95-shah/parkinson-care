import { createClient } from './client';

export interface CaretakerPermissions {
    can_view_data: boolean;
    can_log_on_behalf: boolean;
    can_generate_reports: boolean;
}

// Get the active assignment for the current patient
export async function getMyCaretakerAssignment(): Promise<{
    assignment: any | null;
    error?: string;
}> {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { assignment: null, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('patient_caretaker_assignments_view')
            .select('*')
            .eq('patient_id', user.id)
            .eq('status', 'active')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
            throw error;
        }

        return { assignment: data };
    } catch (error) {
        console.error('Error fetching caretaker assignment:', error);
        return {
            assignment: null,
            error: error instanceof Error ? error.message : 'Failed to fetch assignment',
        };
    }
}

// Update permissions for an assignment
export async function updateCaretakerPermissions(
    assignmentId: string,
    permissions: Partial<CaretakerPermissions>
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createClient();

        // Security check: Ensure the current user owns this assignment (as patient)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        // Verify ownership
        const { data: verifyData, error: verifyError } = await supabase
            .from('patient_caretaker_assignments')
            .select('patient_id')
            .eq('id', assignmentId)
            .single();

        if (verifyError || verifyData.patient_id !== user.id) {
            return { success: false, error: 'Unauthorized to update this assignment' };
        }

        const { data, error } = await supabase
            .from('patient_caretaker_assignments')
            .update(permissions)
            .eq('id', assignmentId)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return { success: false, error: 'Update failed - no changes saved (check permissions)' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating permissions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update permissions',
        };
    }
}
