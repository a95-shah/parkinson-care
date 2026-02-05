// lib/supabase/ai-insights.ts
import { createClient } from './client';
import type { AIInsight } from '@/lib/ai/gemini';

export interface AIInsightRecord {
  id: string;
  user_id: string;
  insight_type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  date_range_start: string;
  date_range_end: string;
  summary: string;
  key_observations: {
    increases: string[];
    decreases: string[];
    stable: string[];
  };
  medication_patterns: string;
  symptom_trends: string;
  wearing_off_patterns: string;
  recommendations: string[];
  data_points_analyzed: number;
  created_at?: string;
  updated_at?: string;
}

export async function saveAIInsight(
  insightData: AIInsight,
  dateRangeStart: string,
  dateRangeEnd: string,
  insightType: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  dataPointsAnalyzed: number
): Promise<{ success: boolean; error?: string; data?: AIInsightRecord }> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('ai_insights')
      .insert({
        user_id: user.id,
        insight_type: insightType,
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
        summary: insightData.summary,
        key_observations: insightData.keyObservations,
        medication_patterns: insightData.medicationPatterns,
        symptom_trends: insightData.symptomTrends,
        wearing_off_patterns: insightData.wearingOffPatterns,
        recommendations: insightData.recommendations,
        data_points_analyzed: dataPointsAnalyzed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving AI insight:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error saving AI insight:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getLatestAIInsight(): Promise<{
  insight: AIInsightRecord | null;
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { insight: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No insights found
        return { insight: null };
      }
      console.error('Error fetching latest AI insight:', error);
      return { insight: null, error: error.message };
    }

    return { insight: data };
  } catch (error) {
    console.error('Unexpected error fetching AI insight:', error);
    return { 
      insight: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getAIInsightsByDateRange(
  startDate: string,
  endDate: string
): Promise<{
  insights: AIInsightRecord[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { insights: [], error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .gte('date_range_start', startDate)
      .lte('date_range_end', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI insights:', error);
      return { insights: [], error: error.message };
    }

    return { insights: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching AI insights:', error);
    return { 
      insights: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getAllAIInsights(): Promise<{
  insights: AIInsightRecord[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { insights: [], error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all AI insights:', error);
      return { insights: [], error: error.message };
    }

    return { insights: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching AI insights:', error);
    return { 
      insights: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
