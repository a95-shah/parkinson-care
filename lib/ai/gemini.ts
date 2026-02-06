// lib/ai/gemini.ts
'use server';

import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DailyCheckIn } from '@/lib/supabase/checkins';

// Initialize Gemini with server-side API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export interface AIInsight {
  summary: string;
  keyObservations: {
    increases: string[];
    decreases: string[];
    stable: string[];
  };
  medicationPatterns: string;
  symptomTrends: string;
  wearingOffPatterns: string;
  recommendations: string[];
}

export async function generateParkinsonsInsight(
  checkIns: DailyCheckIn[],
  timeRange: 'today' | '7days' | '30days' | '90days'
): Promise<AIInsight> {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  if (!checkIns || checkIns.length === 0) {
    throw new Error('No check-in data available for analysis');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Prepare the data summary for AI analysis
  const dataSummary = prepareDataForAI(checkIns);

  const prompt = `You are a medical AI assistant specializing in Parkinson's disease symptom analysis. Analyze the following patient data and provide insights.

**Patient Context:**
- Disease: Parkinson's Disease
- Time Range: ${timeRange === 'today' ? 'Today' : timeRange === '7days' ? 'Last 7 days' : timeRange === '30days' ? 'Last 30 days' : 'Last 90 days'}
- Total Check-ins: ${checkIns.length}

**Patient Data:**
${dataSummary}

**Analysis Required:**
1. **Summary**: Provide a brief, empathetic summary (2-3 sentences) of the patient's overall condition during this period.

2. **Key Observations**:
   - List specific symptoms that have INCREASED (gotten worse)
   - List specific symptoms that have DECREASED (improved)
   - List symptoms that remained STABLE

3. **Medication Patterns**: 
   - Analyze medication adherence patterns
   - Identify any days with missed or partially taken medications
   - Note any correlation between medication adherence and symptom severity

4. **Symptom Trends**:
   - Identify trends in tremors, stiffness, balance, sleep quality, and mood
   - Note any concerning patterns or positive improvements
   - Highlight symptom variability

5. **Wearing-Off Patterns** (IMPORTANT: Label as AI Observation):
   - Identify potential medication wearing-off patterns
   - Note any patterns suggesting medication effectiveness issues
   - **CLEARLY LABEL**: This is an AI observation and should be discussed with a healthcare provider

6. **Recommendations**:
   - Provide 3-5 actionable, patient-friendly recommendations
   - Focus on lifestyle modifications, symptom management strategies
   - Encourage medical consultation for any concerning patterns

**Response Format (JSON):**
\`\`\`json
{
  "summary": "Brief empathetic summary here",
  "keyObservations": {
    "increases": ["symptom 1", "symptom 2"],
    "decreases": ["symptom 1", "symptom 2"],
    "stable": ["symptom 1", "symptom 2"]
  },
  "medicationPatterns": "Detailed medication pattern analysis",
  "symptomTrends": "Detailed symptom trends analysis",
  "wearingOffPatterns": "⚠️ AI Observation: [Wearing-off pattern analysis with clear disclaimer]",
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}
\`\`\`

Provide ONLY the JSON response, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const insight: AIInsight = JSON.parse(jsonText);

    return insight;
  } catch (error) {
    console.error('Gemini AI Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate AI insights: ${errorMessage}`);
  }
}

function prepareDataForAI(checkIns: DailyCheckIn[]): string {
  const sortedCheckIns = [...checkIns].sort((a, b) =>
    new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
  );

  let summary = '';

  sortedCheckIns.forEach((checkIn, index) => {
    const date = new Date(checkIn.check_in_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    summary += `\nDay ${index + 1} (${date}):\n`;
    summary += `- Tremor Score: ${checkIn.tremor_score}/10\n`;
    summary += `- Stiffness Score: ${checkIn.stiffness_score}/10\n`;
    summary += `- Balance Score: ${checkIn.balance_score}/10\n`;
    summary += `- Sleep Quality: ${checkIn.sleep_score}/10\n`;
    summary += `- Mood Score: ${checkIn.mood_score}/10\n`;
    summary += `- Medication Taken: ${checkIn.medication_taken}\n`;

    if (checkIn.notes) {
      summary += `- Patient Notes: ${checkIn.notes}\n`;
    }
  });

  // Add statistical summary
  const avgTremor = (sortedCheckIns.reduce((sum, c) => sum + c.tremor_score, 0) / sortedCheckIns.length).toFixed(1);
  const avgStiffness = (sortedCheckIns.reduce((sum, c) => sum + c.stiffness_score, 0) / sortedCheckIns.length).toFixed(1);
  const avgBalance = (sortedCheckIns.reduce((sum, c) => sum + c.balance_score, 0) / sortedCheckIns.length).toFixed(1);
  const avgSleep = (sortedCheckIns.reduce((sum, c) => sum + c.sleep_score, 0) / sortedCheckIns.length).toFixed(1);
  const avgMood = (sortedCheckIns.reduce((sum, c) => sum + c.mood_score, 0) / sortedCheckIns.length).toFixed(1);

  const medicationTaken = sortedCheckIns.filter(c => c.medication_taken === 'yes').length;
  const medicationPartial = sortedCheckIns.filter(c => c.medication_taken === 'partially').length;
  const medicationMissed = sortedCheckIns.filter(c => c.medication_taken === 'missed').length;

  summary += `\n**Statistical Summary:**\n`;
  summary += `- Average Tremor: ${avgTremor}/10\n`;
  summary += `- Average Stiffness: ${avgStiffness}/10\n`;
  summary += `- Average Balance: ${avgBalance}/10\n`;
  summary += `- Average Sleep Quality: ${avgSleep}/10\n`;
  summary += `- Average Mood: ${avgMood}/10\n`;
  summary += `- Medication Adherence: ${medicationTaken} taken, ${medicationPartial} partial, ${medicationMissed} missed\n`;

  return summary;
}
