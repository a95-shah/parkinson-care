// File: lib/supabase/checkins.ts
import { createClient } from './client';

export interface DailyCheckIn {
  id?: string;
  user_id?: string;
  check_in_date: string;
  tremor_score: number;
  stiffness_score: number;
  balance_score: number;
  sleep_score: number;
  mood_score: number;
  medication_taken: 'yes' | 'missed' | 'partially';
  side_effects: string[];
  side_effects_other?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckInStats {
  avgTremor: number;
  avgStiffness: number;
  avgBalance: number;
  avgSleep: number;
  avgMood: number;
  medicationAdherence: number;
}

/**
 * Get today's check-in for the currently logged-in user
 */
export async function getTodayCheckIn(): Promise<DailyCheckIn | null> {
  const supabase = createClient();

  // Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error in getTodayCheckIn:', authError);
    return null;
  }
  if (!user) {
    console.error('No user found in getTodayCheckIn');
    return null;
  }

  console.log('getTodayCheckIn - User ID:', user.id);

  const today = new Date().toISOString().split('T')[0];
  console.log('getTodayCheckIn - Today:', today);

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('check_in_date', today)
    .maybeSingle();

  if (error) {
    console.error('Error fetching today\'s check-in:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  console.log('getTodayCheckIn - Data found:', !!data);
  return data;
}

/**
 * Create or update daily check-in
 */
export async function saveCheckIn(checkIn: Omit<DailyCheckIn, 'id' | 'user_id' | 'created_at' | 'updated_at'>, patientId?: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Auth error in saveCheckIn:', authError);
    throw new Error('Authentication error');
  }
  if (!user) {
    console.error('No user found in saveCheckIn');
    throw new Error('Not authenticated');
  }

  // Use patientId if provided (logging on behalf), otherwise use current user
  const targetUserId = patientId || user.id;

  console.log('saveCheckIn - User ID:', targetUserId);
  console.log('saveCheckIn - Logged by:', user.id);
  console.log('saveCheckIn - Check-in data:', checkIn);

  const { data, error } = await supabase
    .from('daily_checkins')
    .upsert({
      user_id: targetUserId,
      ...checkIn,
    }, {
      onConflict: 'user_id,check_in_date'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving check-in:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }
  console.log('saveCheckIn - Success:', data);
  return data;
}

/**
 * Get check-ins for the logged-in user within a date range
 */
export async function getCheckIns(startDate: string, endDate: string): Promise<DailyCheckIn[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('check_in_date', startDate)
    .lte('check_in_date', endDate)
    .order('check_in_date', { ascending: false });

  if (error) {
    console.error('Error fetching check-ins:', error);
    return [];
  }

  return data || [];
}

/**
 * Get last N days of check-ins for a specific user (or current user)
 */
export async function getRecentCheckIns(days: number = 7, userId?: string): Promise<DailyCheckIn[]> {
  const supabase = createClient();

  let targetUserId = userId;

  // If no userId provided, attempt to get current logged-in user
  if (!targetUserId) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error in getRecentCheckIns:', authError);
      return [];
    }
    targetUserId = user?.id;
  }

  if (!targetUserId) {
    console.error('No user ID found in getRecentCheckIns');
    return [];
  }

  console.log('getRecentCheckIns - User ID:', targetUserId);

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  console.log('getRecentCheckIns - Date range:', startDate, 'to', endDate);

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', targetUserId)
    .gte('check_in_date', startDate)
    .lte('check_in_date', endDate)
    .order('check_in_date', { ascending: true });

  if (error) {
    console.error('Error fetching recent check-ins:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  console.log('getRecentCheckIns - Found', data?.length || 0, 'check-ins');
  return data || [];
}

/**
 * Calculate averages for the dashboard cards
 */
export async function getCheckInStats(days: number = 7): Promise<CheckInStats | null> {
  const checkIns = await getRecentCheckIns(days);

  if (!checkIns || checkIns.length === 0) return null;

  const stats = checkIns.reduce(
    (acc, checkIn) => ({
      tremor: acc.tremor + checkIn.tremor_score,
      stiffness: acc.stiffness + checkIn.stiffness_score,
      balance: acc.balance + checkIn.balance_score,
      sleep: acc.sleep + checkIn.sleep_score,
      mood: acc.mood + checkIn.mood_score,
      medicationYes: acc.medicationYes + (checkIn.medication_taken === 'yes' ? 1 : 0),
    }),
    { tremor: 0, stiffness: 0, balance: 0, sleep: 0, mood: 0, medicationYes: 0 }
  );

  const count = checkIns.length;

  return {
    avgTremor: Number((stats.tremor / count).toFixed(1)),
    avgStiffness: Number((stats.stiffness / count).toFixed(1)),
    avgBalance: Number((stats.balance / count).toFixed(1)),
    avgSleep: Number((stats.sleep / count).toFixed(1)),
    avgMood: Number((stats.mood / count).toFixed(1)),
    medicationAdherence: Math.round((stats.medicationYes / count) * 100),
  };
}

/**
 * Get statistics for the caretaker dashboard
 */
export async function getCaretakerStats(): Promise<{
  totalCheckIns: number;
  weekCheckIns: number;
  monthReports: number;
}> {
  const supabase = createClient();

  // Get start of week (Sunday)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  // Fetch total check-ins (all time)
  const { count: totalCount, error: totalError } = await supabase
    .from('daily_checkins')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('Error fetching caretaker total stats:', totalError);
  }

  // Fetch this week's check-ins
  const { count: weekCount, error: weekError } = await supabase
    .from('daily_checkins')
    .select('*', { count: 'exact', head: true })
    .gte('check_in_date', startOfWeekStr);

  if (weekError) {
    console.error('Error fetching caretaker week stats:', weekError);
  }

  return {
    totalCheckIns: totalCount || 0,
    weekCheckIns: weekCount || 0,
    monthReports: 0 // Placeholder
  };
}