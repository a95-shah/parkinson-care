// lib/supabase/admin.ts
import { createClient } from './client';
import type { UserProfile } from './config';

export interface DashboardStats {
  totalPatients: number;
  totalCaretakers: number;
  totalAssignments: number;
  activeAssignments: number;
  recentCheckIns: number;
}

export interface PatientCaretakerAssignment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  caretaker_id: string;
  caretaker_name: string;
  caretaker_email: string;
  assigned_by: string | null;
  assigned_by_name: string | null;
  assigned_at: string;
  status: 'active' | 'inactive';
  notes: string | null;
  can_view_data: boolean;
  can_log_on_behalf: boolean;
  can_generate_reports: boolean;
  created_at: string;
  updated_at: string;
}

// Get dashboard statistics
export async function getAdminDashboardStats(): Promise<{
  stats: DashboardStats | null;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Get counts in parallel
    const [patientsResult, caretakersResult, assignmentsResult, activeAssignmentsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'caretaker'),
      supabase.from('patient_caretaker_assignments').select('id', { count: 'exact', head: true }),
      supabase.from('patient_caretaker_assignments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    // Get recent check-ins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: recentCheckIns } = await supabase
      .from('daily_checkins')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    return {
      stats: {
        totalPatients: patientsResult.count || 0,
        totalCaretakers: caretakersResult.count || 0,
        totalAssignments: assignmentsResult.count || 0,
        activeAssignments: activeAssignmentsResult.count || 0,
        recentCheckIns: recentCheckIns || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    };
  }
}

// Get all patients
export async function getAllPatients(): Promise<{
  patients: UserProfile[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { patients: data || [] };
  } catch (error) {
    console.error('Error fetching patients:', error);
    return {
      patients: [],
      error: error instanceof Error ? error.message : 'Failed to fetch patients',
    };
  }
}

// Get all caretakers
export async function getAllCaretakers(): Promise<{
  caretakers: UserProfile[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'caretaker')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { caretakers: data || [] };
  } catch (error) {
    console.error('Error fetching caretakers:', error);
    return {
      caretakers: [],
      error: error instanceof Error ? error.message : 'Failed to fetch caretakers',
    };
  }
}

// Get all assignments with details
export async function getAllAssignments(): Promise<{
  assignments: PatientCaretakerAssignment[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('patient_caretaker_assignments_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { assignments: data || [] };
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return {
      assignments: [],
      error: error instanceof Error ? error.message : 'Failed to fetch assignments',
    };
  }
}

// Create assignment
export async function createAssignment(
  patientId: string,
  caretakerId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('patient_caretaker_assignments')
      .insert({
        patient_id: patientId,
        caretaker_id: caretakerId,
        assigned_by: user.id,
        notes: notes || null,
        status: 'active',
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error creating assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create assignment',
    };
  }
}

// Update assignment status
export async function updateAssignmentStatus(
  assignmentId: string,
  status: 'active' | 'inactive'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('patient_caretaker_assignments')
      .update({ status })
      .eq('id', assignmentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update assignment',
    };
  }
}

// Delete assignment
export async function deleteAssignment(assignmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('patient_caretaker_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete assignment',
    };
  }
}

// Update user profile (admin can update any profile)
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

// Delete user profile
export async function deleteUserProfile(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete profile',
    };
  }
}

// Get assignments for a specific caretaker
export async function getCaretakerAssignments(caretakerId: string): Promise<{
  assignments: PatientCaretakerAssignment[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('patient_caretaker_assignments_view')
      .select('*')
      .eq('caretaker_id', caretakerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { assignments: data || [] };
  } catch (error) {
    console.error('Error fetching caretaker assignments:', error);
    return {
      assignments: [],
      error: error instanceof Error ? error.message : 'Failed to fetch assignments',
    };
  }
}
