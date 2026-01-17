'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, eachDayOfInterval, parseISO, addDays } from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { Header } from '@/components/Header';
import { CalendarView } from '@/components/CalendarView';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PlacementSelector } from '@/components/PlacementSelector';
import { FlowSelector } from '@/components/FlowSelector';
import { MoodSelector } from '@/components/MoodSelector';
import { SymptomPicker } from '@/components/SymptomPicker';
import { useAppStore } from '@/lib/store';
import { getCycleStatus } from '@/lib/cycle-utils';
import { SYMPTOM_OPTIONS, MOOD_OPTIONS, FLOW_OPTIONS, PLACEMENT_AREAS } from '@/lib/constants';
import { Droplets, Activity, MessageSquare, MapPin, Clock, Sparkles, Check } from 'lucide-react';
import type { PlacementArea, FlowIntensity, Mood, SymptomEntry } from '@/types';

function CalendarPage() {
  const {
    cycles,
    patchLogs,
    dailyLogs,
    activeCycle,
    updatePatchLogPlacement,
    saveDailyLog,
    getDailyLog,
    markPeriodEnded,
    getLastFlowDate
  } = useAppStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementArea | undefined>();

  // Log form state
  const [flow, setFlow] = useState<FlowIntensity | undefined>();
  const [mood, setMood] = useState<Mood | undefined>();
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showPeriodEndedModal, setShowPeriodEndedModal] = useState(false);
  const [periodEndFlow, setPeriodEndFlow] = useState<FlowIntensity>('light');

  const logFormRef = useRef<HTMLDivElement>(null);

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDailyLog = dailyLogs.find(l => l.date === selectedDateStr);
  const selectedPatchLog = patchLogs.find(l => l.date === selectedDateStr);
  const isToday = selectedDateStr === format(new Date(), 'yyyy-MM-dd');
  const status = activeCycle && selectedDate ? getCycleStatus(activeCycle, selectedDate) : null;

  // Load existing log for selected date
  useEffect(() => {
    if (selectedDateStr) {
      const existingLog = getDailyLog(selectedDateStr);
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
    }
  }, [selectedDateStr, getDailyLog]);

  // Scroll to log form when date is selected
  useEffect(() => {
    if (selectedDate && logFormRef.current) {
      setTimeout(() => {
        logFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDate]);

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    setShowSaved(false);
  };

  const handleEditPlacement = (logId: string, currentPlacement?: PlacementArea) => {
    setEditingLogId(logId);
    setSelectedPlacement(currentPlacement);
    setShowPlacementModal(true);
  };

  const handleSavePlacement = async () => {
    if (editingLogId && selectedPlacement) {
      await updatePatchLogPlacement(editingLogId, selectedPlacement);
    }
    setShowPlacementModal(false);
    setEditingLogId(null);
    setSelectedPlacement(undefined);
  };

  const getPlacementLabel = (placement?: PlacementArea) => {
    if (!placement) return null;
    return PLACEMENT_AREAS.find(p => p.id === placement);
  };

  const handleSave = async () => {
    if (!selectedDateStr) return;

    setIsSaving(true);
    await saveDailyLog(selectedDateStr, {
      flow,
      mood,
      symptoms,
      notes: notes.trim() || undefined
    });
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // Calculate days to fill for period ended feature
  const lastFlowInfo = getLastFlowDate();
  const daysToFill = useMemo(() => {
    if (!lastFlowInfo || !selectedDate) return [];
    const lastDate = parseISO(lastFlowInfo.date);
    const startFill = addDays(lastDate, 1);
    if (startFill > selectedDate) return [];
    return eachDayOfInterval({ start: startFill, end: selectedDate });
  }, [lastFlowInfo, selectedDate]);

  const handlePeriodEnded = async () => {
    if (!selectedDateStr) return;

    setIsSaving(true);
    await markPeriodEnded(selectedDateStr, periodEndFlow);
    setShowPeriodEndedModal(false);
    setIsSaving(false);
    setShowSaved(true);
    // Reload the current day's data
    const existingLog = getDailyLog(selectedDateStr);
    if (existingLog) {
      setFlow(existingLog.flow);
    }
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <>
      <Header title="Calendar" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <CalendarView
          cycles={cycles}
          patchLogs={patchLogs}
          dailyLogs={dailyLogs}
          onDaySelect={handleDaySelect}
          selectedDate={selectedDate}
        />

        {/* Selected Day Details & Log Form */}
        {selectedDate && (
          <div ref={logFormRef} className="space-y-4 animate-fade-in">
            {/* Date Header Card */}
            <Card>
              <CardContent>
                <CardTitle className="mb-2">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                {status && (
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Week {status.currentWeek} · Day {status.dayInCycle}
                  </p>
                )}

                {/* Patch Log */}
                {selectedPatchLog && (
                  <div className="mt-4 p-3 bg-[var(--sweet-mint-light)] rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">
                          Patch {selectedPatchLog.action}
                        </Badge>
                        {selectedPatchLog.autoFilled && (
                          <Badge variant="info" size="sm">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Auto-filled
                          </Badge>
                        )}
                        {selectedPatchLog.lateChange && (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Late
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Placement info */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-[var(--sweet-mint-dark)]" />
                        {selectedPatchLog.placement ? (
                          <span>
                            {getPlacementLabel(selectedPatchLog.placement)?.icon}{' '}
                            {getPlacementLabel(selectedPatchLog.placement)?.label}
                          </span>
                        ) : (
                          <span className="text-[var(--foreground-muted)]">
                            No placement recorded
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleEditPlacement(selectedPatchLog.id, selectedPatchLog.placement)}
                        className="text-xs text-[var(--sweet-mint-dark)] font-medium hover:underline"
                      >
                        {selectedPatchLog.placement ? 'Edit' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Flow */}
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
        )}
      </div>

      {/* Placement Edit Modal */}
      <Modal
        isOpen={showPlacementModal}
        onClose={() => {
          setShowPlacementModal(false);
          setEditingLogId(null);
          setSelectedPlacement(undefined);
        }}
        title="Update Patch Placement"
      >
        <div className="space-y-4">
          <PlacementSelector
            selected={selectedPlacement}
            onChange={setSelectedPlacement}
          />
          <Button
            fullWidth
            onClick={handleSavePlacement}
            disabled={!selectedPlacement}
          >
            Save Placement
          </Button>
        </div>
      </Modal>

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

export default function Calendar() {
  return (
    <AppShell>
      <CalendarPage />
    </AppShell>
  );
}
