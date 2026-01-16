'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { Header } from '@/components/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FlowSelector } from '@/components/FlowSelector';
import { MoodSelector } from '@/components/MoodSelector';
import { SymptomPicker } from '@/components/SymptomPicker';
import { useAppStore } from '@/lib/store';
import { getCycleStatus } from '@/lib/cycle-utils';
import { FLOW_OPTIONS } from '@/lib/constants';
import { Check, ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import type { FlowIntensity, Mood, SymptomEntry } from '@/types';

function LogPage() {
  const { activeCycle, saveDailyLog, getDailyLog, markPeriodEnded, getLastFlowDate } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [flow, setFlow] = useState<FlowIntensity | undefined>();
  const [mood, setMood] = useState<Mood | undefined>();
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showPeriodEndedModal, setShowPeriodEndedModal] = useState(false);
  const [periodEndFlow, setPeriodEndFlow] = useState<FlowIntensity>('light');

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  // Load existing log for selected date
  useEffect(() => {
    const existingLog = getDailyLog(dateStr);
    if (existingLog) {
      setFlow(existingLog.flow);
      setMood(existingLog.mood);
      setSymptoms(existingLog.symptoms || []);
      setNotes(existingLog.notes || '');
    } else {
      setFlow(undefined);
      setMood(undefined);
      setSymptoms([]);
      setNotes('');
    }
  }, [dateStr, getDailyLog]);

  const status = activeCycle ? getCycleStatus(activeCycle, currentDate) : null;

  const handleSave = async () => {
    setIsSaving(true);
    await saveDailyLog(dateStr, {
      flow,
      mood,
      symptoms,
      notes: notes.trim() || undefined
    });
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => {
    if (!isToday) {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  // Calculate days to fill for period ended feature
  const lastFlowInfo = getLastFlowDate();
  const daysToFill = useMemo(() => {
    if (!lastFlowInfo) return [];
    const lastDate = parseISO(lastFlowInfo.date);
    const startFill = addDays(lastDate, 1);
    if (startFill > currentDate) return [];
    return eachDayOfInterval({ start: startFill, end: currentDate });
  }, [lastFlowInfo, currentDate]);

  const handlePeriodEnded = async () => {
    setIsSaving(true);
    await markPeriodEnded(dateStr, periodEndFlow);
    setShowPeriodEndedModal(false);
    setIsSaving(false);
    setShowSaved(true);
    // Reload the current day's data
    const existingLog = getDailyLog(dateStr);
    if (existingLog) {
      setFlow(existingLog.flow);
    }
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <>
      <Header title="Daily Log" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Date selector */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousDay}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors tap-target"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <p className="font-display font-semibold text-lg">
                  {format(currentDate, 'EEEE')}
                </p>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  {format(currentDate, 'MMMM d, yyyy')}
                </p>
                {status && (
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    Week {status.currentWeek} · Day {status.dayInCycle}
                  </p>
                )}
              </div>

              <button
                onClick={goToNextDay}
                disabled={isToday}
                className={`
                  p-2 rounded-full transition-colors tap-target
                  ${isToday ? 'opacity-30' : 'hover:bg-gray-100'}
                `}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Flow (show prominently during patch-free week) */}
        <Card className={status?.isPatchFreeWeek ? 'ring-2 ring-[var(--fairy-tale-dream)]' : ''}>
          <CardContent>
            <FlowSelector selected={flow} onChange={setFlow} />

            {/* Period Ended button - shown when there's a previous flow to auto-fill from */}
            {lastFlowInfo && daysToFill.length > 0 && (
              <button
                onClick={() => {
                  setPeriodEndFlow('light');
                  setShowPeriodEndedModal(true);
                }}
                className="
                  mt-4 w-full flex items-center justify-center gap-2
                  py-2.5 px-4 rounded-xl
                  bg-[var(--fairy-tale-dream-light)]
                  text-[var(--fairy-tale-dream-dark)]
                  text-sm font-medium
                  hover:bg-[var(--fairy-tale-dream)] hover:text-white
                  transition-colors
                "
              >
                <Droplets className="w-4 h-4" />
                Mark Period Ended
              </button>
            )}
          </CardContent>
        </Card>

        {/* Mood */}
        <Card>
          <CardContent>
            <MoodSelector selected={mood} onChange={setMood} />
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card>
          <CardContent>
            <SymptomPicker selected={symptoms} onChange={setSymptoms} />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent>
            <label className="block">
              <span className="text-sm font-medium text-[var(--foreground)]">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about today..."
                rows={3}
                className="
                  mt-2 w-full px-4 py-3 rounded-xl
                  bg-[var(--background-secondary)]
                  border-2 border-transparent
                  focus:border-[var(--dewpoint)] focus:outline-none
                  resize-none
                  text-[var(--foreground)]
                  placeholder:text-[var(--foreground-muted)]
                "
              />
            </label>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          variant={showSaved ? 'secondary' : 'primary'}
        >
          {showSaved ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Saved!
            </>
          ) : isSaving ? (
            'Saving...'
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Save Entry
            </>
          )}
        </Button>
      </div>

      {/* Period Ended Modal */}
      <Modal
        isOpen={showPeriodEndedModal}
        onClose={() => setShowPeriodEndedModal(false)}
        title="Mark Period Ended"
      >
        <div className="space-y-4">
          {lastFlowInfo && (
            <p className="text-[var(--foreground-secondary)]">
              Your last logged flow was on{' '}
              <span className="font-medium text-[var(--foreground)]">
                {format(parseISO(lastFlowInfo.date), 'MMM d')}
              </span>
              .
            </p>
          )}

          {daysToFill.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Auto-fill these days:</p>
              <div className="bg-[var(--background-secondary)] rounded-xl p-3 max-h-32 overflow-y-auto">
                {daysToFill.map((date, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-1 text-sm"
                  >
                    <Droplets className="w-3 h-3 text-[var(--fairy-tale-dream)]" />
                    <span>{format(date, 'EEE, MMM d')}</span>
                    {i === daysToFill.length - 1 && (
                      <span className="text-xs text-[var(--foreground-muted)]">(period ended)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Fill with flow intensity:</p>
            <div className="grid grid-cols-3 gap-2">
              {FLOW_OPTIONS.filter(opt => opt.id !== 'none').map((option) => (
                <button
                  key={option.id}
                  onClick={() => setPeriodEndFlow(option.id as FlowIntensity)}
                  className={`
                    py-2 px-3 rounded-xl text-sm font-medium transition-all
                    ${periodEndFlow === option.id
                      ? 'ring-2 ring-[var(--fairy-tale-dream)] bg-[var(--fairy-tale-dream-light)]'
                      : 'bg-[var(--background-secondary)] hover:bg-gray-200'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            fullWidth
            onClick={handlePeriodEnded}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : `Fill ${daysToFill.length} day${daysToFill.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function Log() {
  return (
    <AppShell>
      <LogPage />
    </AppShell>
  );
}
