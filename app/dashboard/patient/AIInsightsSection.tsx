'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DailyCheckIn } from '@/lib/supabase/checkins';
import { generateParkinsonsInsight, type AIInsight } from '@/lib/ai/gemini';
import { saveAIInsight } from '@/lib/supabase/ai-insights';

interface AIInsightsSectionProps {
  checkIns: DailyCheckIn[];
}

export default function AIInsightsSection({ checkIns }: AIInsightsSectionProps) {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | '90days'>('7days');
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotification, setSavedNotification] = useState(false);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'today':
        return { start: end, end, days: 1 };
      case '7days':
        start.setDate(end.getDate() - 7);
        return { start, end, days: 7 };
      case '30days':
        start.setDate(end.getDate() - 30);
        return { start, end, days: 30 };
      case '90days':
        start.setDate(end.getDate() - 90);
        return { start, end, days: 90 };
    }
  };

  const handleGenerateInsight = async () => {
    setLoading(true);
    setError(null);
    setSavedNotification(false);

    try {
      const { start, end, days } = getDateRange();
      const filteredCheckIns = checkIns.slice(0, days);

      if (filteredCheckIns.length === 0) {
        setError('No check-in data available for the selected time range.');
        setLoading(false);
        return;
      }

      const generatedInsight = await generateParkinsonsInsight(filteredCheckIns, timeRange);
      setInsight(generatedInsight);

      // Save insight to database
      const insightType = 
        timeRange === 'today' ? 'daily' :
        timeRange === '7days' ? 'weekly' :
        timeRange === '30days' ? 'monthly' : 'quarterly';

      const { success, error: saveError } = await saveAIInsight(
        generatedInsight,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
        insightType,
        filteredCheckIns.length
      );

      if (!success) {
        console.error('Failed to save insight:', saveError);
      } else {
        setSavedNotification(true);
        setTimeout(() => setSavedNotification(false), 3000);
      }
    } catch (err) {
      console.error('Error generating insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-linear-to-br from-purple-50 to-indigo-50 dark:border-purple-800/50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl text-purple-900 dark:text-purple-300">AI-Powered Health Insights</CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-400">
              Get personalized insights about your Parkinson's symptoms and patterns
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Time Range Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-purple-900 dark:text-purple-300">Select Time Range:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: '90days', label: 'Last 90 Days' },
            ].map(({ id, label }) => (
              <Button
                key={id}
                size="sm"
                variant={timeRange === id ? 'default' : 'outline'}
                onClick={() => setTimeRange(id as any)}
                disabled={loading}
                className={timeRange === id 
                  ? "bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
                  : "bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/40"
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateInsight} 
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white"
          size="lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Your Health Data...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate AI Insights
            </>
          )}
        </Button>

        {/* Saved Notification */}
        {savedNotification && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50">
            <AlertDescription className="text-green-800 dark:text-green-300">
              ✓ Insights saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50">
            <AlertDescription className="text-red-800 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Insights Display */}
        {insight && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-purple-100 dark:border-purple-800/50">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summary
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{insight.summary}</p>
            </div>

            {/* Key Observations */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-purple-100 dark:border-purple-800/50">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Key Observations
              </h3>
              
              <div className="grid gap-4">
                {insight.keyObservations.increases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Increases (Symptoms Worsening)
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-5">
                      {insight.keyObservations.increases.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insight.keyObservations.decreases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Improvements (Symptoms Decreasing)
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-5">
                      {insight.keyObservations.decreases.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insight.keyObservations.stable.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18" />
                      </svg>
                      Stable
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-5">
                      {insight.keyObservations.stable.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Medication Patterns */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-purple-100 dark:border-purple-800/50">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Medication Patterns
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{insight.medicationPatterns}</p>
            </div>

            {/* Symptom Trends */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-purple-100 dark:border-purple-800/50">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Symptom Trends
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{insight.symptomTrends}</p>
            </div>

            {/* Wearing-Off Patterns (with disclaimer) */}
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-6 shadow-sm border-2 border-amber-200 dark:border-amber-800/30">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-400 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Wearing-Off Patterns
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded p-4 mb-3 border border-amber-300 dark:border-amber-800/50">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-400 mb-1">⚠️ IMPORTANT DISCLAIMER:</p>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  The following observations are generated by AI and should NOT be used as medical advice. 
                  Please discuss any concerns with your healthcare provider.
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{insight.wearingOffPatterns}</p>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-purple-100 dark:border-purple-800/50">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Recommendations
              </h3>
              <ul className="space-y-3">
                {insight.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink:0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Medical Disclaimer */}
            <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30">
              <AlertDescription className="text-blue-900 dark:text-blue-300 text-sm">
                <strong>Medical Disclaimer:</strong> These AI-generated insights are for informational purposes only 
                and should not replace professional medical advice. Always consult with your healthcare provider 
                about your Parkinson's disease management.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
