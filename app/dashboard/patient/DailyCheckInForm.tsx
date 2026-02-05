'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { saveCheckIn, type DailyCheckIn } from '@/lib/supabase/checkins';
import { toast } from 'sonner';

interface DailyCheckInFormProps {
  onComplete: () => void;
  onCancel: () => void;
  existingCheckIn?: DailyCheckIn | null;
  patientId?: string;
}

const SIDE_EFFECTS = [
  'Dizziness',
  'Nausea',
  'Fatigue',
  'Headache',
  'Dry mouth',
  'Constipation',
];

export default function DailyCheckInForm({ onComplete, onCancel, existingCheckIn, patientId }: DailyCheckInFormProps) {
  const [formData, setFormData] = useState({
    tremor_score: existingCheckIn?.tremor_score ?? 5,
    stiffness_score: existingCheckIn?.stiffness_score ?? 5,
    balance_score: existingCheckIn?.balance_score ?? 5,
    sleep_score: existingCheckIn?.sleep_score ?? 5,
    mood_score: existingCheckIn?.mood_score ?? 5,
    medication_taken: existingCheckIn?.medication_taken ?? 'yes' as 'yes' | 'missed' | 'partially',
    side_effects: existingCheckIn?.side_effects ?? [],
    side_effects_other: existingCheckIn?.side_effects_other ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSliderChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSideEffectToggle = (effect: string) => {
    setFormData(prev => ({
      ...prev,
      side_effects: prev.side_effects.includes(effect)
        ? prev.side_effects.filter(e => e !== effect)
        : [...prev.side_effects, effect],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await saveCheckIn({
        check_in_date: new Date().toISOString().split('T')[0],
        ...formData,
      }, patientId);
      toast.success("Today's check-in added successfully");
      onComplete();
    } catch (err) {
      setError('Failed to save check-in. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Daily Check-in</CardTitle>
          <CardDescription>
            Take a moment to log how you're feeling today. This should take less than 60 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Symptom Sliders */}
            <div className="space-y-6">
              <SliderInput
                label="Tremor"
                description="How would you rate your tremor today?"
                value={formData.tremor_score}
                onChange={(v) => handleSliderChange('tremor_score', v)}
              />

              <SliderInput
                label="Muscle Stiffness"
                description="How stiff do your muscles feel?"
                value={formData.stiffness_score}
                onChange={(v) => handleSliderChange('stiffness_score', v)}
              />

              <SliderInput
                label="Walking / Balance"
                description="How is your balance and walking today?"
                value={formData.balance_score}
                onChange={(v) => handleSliderChange('balance_score', v)}
              />

              <SliderInput
                label="Sleep Quality"
                description="How well did you sleep last night?"
                value={formData.sleep_score}
                onChange={(v) => handleSliderChange('sleep_score', v)}
              />

              <SliderInput
                label="Mood"
                description="How would you rate your mood today?"
                value={formData.mood_score}
                onChange={(v) => handleSliderChange('mood_score', v)}
              />
            </div>

            {/* Medication */}
            <div className="space-y-3">
              <Label className="text-base">Did you take your medication today?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.medication_taken === 'yes' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, medication_taken: 'yes' }))}
                  className="flex-1"
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={formData.medication_taken === 'partially' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, medication_taken: 'partially' }))}
                  className="flex-1"
                >
                  Partially
                </Button>
                <Button
                  type="button"
                  variant={formData.medication_taken === 'missed' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, medication_taken: 'missed' }))}
                  className="flex-1"
                >
                  Missed
                </Button>
              </div>
            </div>

            {/* Side Effects */}
            <div className="space-y-3">
              <Label className="text-base">Any side effects today?</Label>
              <div className="grid grid-cols-2 gap-2">
                {SIDE_EFFECTS.map(effect => (
                  <label
                    key={effect}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={formData.side_effects.includes(effect)}
                      onChange={() => handleSideEffectToggle(effect)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{effect}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="other-side-effects">Other side effects (optional)</Label>
                <Input
                  id="other-side-effects"
                  placeholder="Describe any other side effects..."
                  value={formData.side_effects_other}
                  onChange={(e) => setFormData(prev => ({ ...prev, side_effects_other: e.target.value }))}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Check-in'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SliderInput({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <Label className="text-base">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-2xl font-bold min-w-[3rem] text-right">{value}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">0</span>
        <input
          type="range"
          min="0"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="text-sm text-muted-foreground">10</span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>None</span>
        <span>Severe</span>
      </div>
    </div>
  );
}