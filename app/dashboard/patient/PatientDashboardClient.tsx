// app/dashboard/patient/PatientDashboardClient.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getTodayCheckIn, getRecentCheckIns, getCheckInStats, type DailyCheckIn, type CheckInStats } from '@/lib/supabase/checkins';
import { getLatestAIInsight, type AIInsightRecord } from '@/lib/supabase/ai-insights';
import DailyCheckInForm from './DailyCheckInForm';
import AIInsightsSection from './AIInsightsSection';
import PermissionsSettings from './PermissionsSettings';
import { PatientSidebar } from './components/PatientSidebar';
import { PatientHeader } from './components/PatientHeader';
import { PatientStatsCard } from './components/PatientStatsCard';
import { 
  Activity, 
  Brain, 
  Moon, 
  Scale, 
  Smile, 
  Pill,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PatientDashboardClientProps {
  userName: string;
}

export default function PatientDashboardClient({ userName }: PatientDashboardClientProps) {
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<DailyCheckIn[]>([]);
  const [latestInsight, setLatestInsight] = useState<AIInsightRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const [today, statsData, recent, aiInsight] = await Promise.all([
        getTodayCheckIn(),
        getCheckInStats(7),
        getRecentCheckIns(30),
        getLatestAIInsight(),
      ]);

      setTodayCheckIn(today);
      setStats(statsData);
      setRecentCheckIns(recent);
      setLatestInsight(aiInsight.insight);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCheckInComplete = async () => {
    setShowCheckInForm(false);
    await loadDashboardData();
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard Overview';
      case 'trends': return 'Trends & Analytics';
      case 'reports': return 'Health Reports';
      case 'permissions': return 'Caretaker Permissions';
      default: return 'Patient Dashboard';
    }
  };

  if (showCheckInForm) {
    return (
      <div className="flex min-h-screen bg-muted/40 font-sans">
        <PatientSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <PatientHeader 
            userName={userName} 
            title="Daily Check-in" 
          />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DailyCheckInForm
                onComplete={handleCheckInComplete}
                onCancel={() => setShowCheckInForm(false)}
                existingCheckIn={todayCheckIn}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40 font-sans">
      <PatientSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        <PatientHeader 
          userName={userName} 
          title={getPageTitle()} 
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Check-in Status Card */}
                <Card className={`relative overflow-hidden transition-all duration-300 ${
                  todayCheckIn 
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800/50 dark:from-green-950/20 dark:to-emerald-950/20' 
                    : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800/50 dark:from-amber-950/20 dark:to-orange-950/20'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          todayCheckIn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                          {todayCheckIn ? (
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            todayCheckIn ? 'text-green-900 dark:text-green-400' : 'text-amber-900 dark:text-amber-400'
                          }`}>
                            {todayCheckIn ? "Today's Check-in Complete" : "Daily Check-in Pending"}
                          </h3>
                          <p className={`text-sm ${
                            todayCheckIn ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                          }`}>
                            {todayCheckIn 
                              ? `Logged at ${new Date(todayCheckIn.created_at!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                              : "Track your symptoms to monitor your health"
                            }
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setShowCheckInForm(true)} 
                        size="lg"
                        className={todayCheckIn 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                        }
                      >
                        {todayCheckIn ? 'Update Check-in' : 'Start Check-in'}
                      </Button>
                    </div>
                  </CardContent>
                  <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-current opacity-[0.03]" />
                </Card>

                {/* Stats Grid */}
                {stats && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <PatientStatsCard
                      title="Tremor Level"
                      value={`${stats.avgTremor}/10`}
                      description="7-day average"
                      icon={Activity}
                      variant="red"
                      loading={loading}
                    />
                    <PatientStatsCard
                      title="Muscle Stiffness"
                      value={`${stats.avgStiffness}/10`}
                      description="7-day average"
                      icon={Brain}
                      variant="orange"
                      loading={loading}
                    />
                    <PatientStatsCard
                      title="Balance"
                      value={`${stats.avgBalance}/10`}
                      description="7-day average"
                      icon={Scale}
                      variant="teal"
                      loading={loading}
                    />
                    <PatientStatsCard
                      title="Sleep Quality"
                      value={`${stats.avgSleep}/10`}
                      description="7-day average"
                      icon={Moon}
                      variant="blue"
                      loading={loading}
                    />
                    <PatientStatsCard
                      title="Mood"
                      value={`${stats.avgMood}/10`}
                      description="7-day average"
                      icon={Smile}
                      variant="purple"
                      loading={loading}
                    />
                    <PatientStatsCard
                      title="Medication Adherence"
                      value={`${stats.medicationAdherence}%`}
                      description="Last 7 days"
                      icon={Pill}
                      variant="green"
                      loading={loading}
                    />
                  </div>
                )}

                {/* AI Insight Card */}
                {latestInsight && (
                  <Card className="relative overflow-hidden border-2 border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-purple-900 dark:text-purple-100">AI Health Insights</CardTitle>
                            <CardDescription className="text-purple-700 dark:text-purple-300">
                              Generated {new Date(latestInsight.created_at!).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab('trends')}
                          className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/40"
                        >
                          View Full Analysis →
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur rounded-xl p-4 space-y-3 shadow-sm border dark:border-slate-800">
                        <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{latestInsight.summary}</p>
                        
                        <div className="flex flex-wrap gap-3 pt-2">
                          {latestInsight.key_observations.increases.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-sm">
                              <TrendingUp className="h-4 w-4" />
                              <span>{latestInsight.key_observations.increases.length} symptoms worsening</span>
                            </div>
                          )}
                          {latestInsight.key_observations.decreases.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm">
                              <TrendingDown className="h-4 w-4" />
                              <span>{latestInsight.key_observations.decreases.length} improvements</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-purple-500 opacity-[0.03] dark:opacity-[0.05]" />
                  </Card>
                )}
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <AIInsightsSection checkIns={recentCheckIns} />
                <TrendsCharts checkIns={recentCheckIns} />
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <ReportsSection checkIns={recentCheckIns} userName={userName} />
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <PermissionsSettings />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function TrendsCharts({ checkIns }: { checkIns: DailyCheckIn[] }) {
  const [symptomDays, setSymptomDays] = useState<7 | 30 | 90>(30);
  const [medicationDays, setMedicationDays] = useState<7 | 30 | 90>(30);

  const symptomChartData = checkIns
    .slice(0, symptomDays)
    .reverse()
    .map(c => ({
      date: new Date(c.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tremor: c.tremor_score,
      stiffness: c.stiffness_score,
      balance: c.balance_score,
      sleep: c.sleep_score,
      mood: c.mood_score,
    }));

  const medicationData = checkIns
    .slice(0, medicationDays)
    .reverse()
    .map(c => ({
      date: new Date(c.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      taken: c.medication_taken === 'yes' ? 1 : c.medication_taken === 'partially' ? 0.5 : 0,
    }));

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-card">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-blue-900 dark:text-blue-100">Symptom Trends</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">Last {symptomDays} days of tracking</CardDescription>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={symptomDays === d ? 'default' : 'outline'}
                  onClick={() => setSymptomDays(d as 7 | 30 | 90)}
                  className={symptomDays === d ? 'bg-blue-600 hover:bg-blue-700 dark:text-white' : 'bg-transparent border-blue-200 dark:border-blue-800 dark:text-blue-100 dark:hover:bg-blue-900/40'}
                >
                  {d} Days
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={symptomChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="tremor" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Tremor" />
              <Line type="monotone" dataKey="stiffness" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Stiffness" />
              <Line type="monotone" dataKey="balance" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="Balance" />
              <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Sleep" />
              <Line type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Mood" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg dark:bg-card">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-green-900 dark:text-green-100">Medication Adherence</CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">Your medication tracking history</CardDescription>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={medicationDays === d ? 'default' : 'outline'}
                  onClick={() => setMedicationDays(d as 7 | 30 | 90)}
                  className={medicationDays === d ? 'bg-green-600 hover:bg-green-700 dark:text-white' : 'bg-transparent border-green-200 dark:border-green-800 dark:text-green-100 dark:hover:bg-green-900/40'}
                >
                  {d} Days
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={medicationData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} tickFormatter={(v) => v === 1 ? 'Yes' : v === 0.5 ? 'Partial' : 'No'} />
              <Tooltip 
                formatter={(v) => v === 1 ? 'Taken' : v === 0.5 ? 'Partially' : 'Missed'} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="taken" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsSection({ checkIns, userName }: { checkIns: DailyCheckIn[]; userName: string }) {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days');

  const filteredCheckIns = checkIns.slice(
    0,
    dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
  );

  const generateReport = () => {
    const stats = filteredCheckIns.reduce(
      (acc, c) => ({
        tremor: acc.tremor + c.tremor_score,
        stiffness: acc.stiffness + c.stiffness_score,
        balance: acc.balance + c.balance_score,
        sleep: acc.sleep + c.sleep_score,
        mood: acc.mood + c.mood_score,
        medYes: acc.medYes + (c.medication_taken === 'yes' ? 1 : 0),
      }),
      { tremor: 0, stiffness: 0, balance: 0, sleep: 0, mood: 0, medYes: 0 }
    );

    const count = filteredCheckIns.length;
    if (count === 0) return null;

    return {
      avgTremor: (stats.tremor / count).toFixed(1),
      avgStiffness: (stats.stiffness / count).toFixed(1),
      avgBalance: (stats.balance / count).toFixed(1),
      avgSleep: (stats.sleep / count).toFixed(1),
      avgMood: (stats.mood / count).toFixed(1),
      adherence: Math.round((stats.medYes / count) * 100),
      totalCheckIns: count,
    };
  };

  const report = generateReport();

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-card">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-t-xl">
          <CardTitle className="text-slate-900 dark:text-slate-100">Generate Health Report</CardTitle>
          <CardDescription className="text-slate-700 dark:text-slate-400">View your health summary for a specific period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex gap-2">
            {[
              { value: '7days', label: '7 Days' },
              { value: '30days', label: '30 Days' },
              { value: '90days', label: '90 Days' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? 'default' : 'outline'}
                onClick={() => setDateRange(option.value as typeof dateRange)}
              >
                Last {option.label}
              </Button>
            ))}
          </div>

          {report ? (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30 rounded-xl space-y-6">
              <div className="space-y-1">
                <h3 className="font-semibold text-xl dark:text-gray-100">{userName}</h3>
                <p className="text-sm text-muted-foreground">
                  Report Period: Last {dateRange.replace('days', ' days')} • {report.totalCheckIns} check-ins
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Avg Tremor', value: report.avgTremor, suffix: '/10' },
                  { label: 'Avg Stiffness', value: report.avgStiffness, suffix: '/10' },
                  { label: 'Avg Balance', value: report.avgBalance, suffix: '/10' },
                  { label: 'Avg Sleep', value: report.avgSleep, suffix: '/10' },
                  { label: 'Avg Mood', value: report.avgMood, suffix: '/10' },
                  { label: 'Med Adherence', value: report.adherence, suffix: '%' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold dark:text-gray-100">{stat.value}{stat.suffix}</p>
                  </div>
                ))}
              </div>

              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" size="lg" onClick={() => window.print()}>
                Print Report
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No check-in data available for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}