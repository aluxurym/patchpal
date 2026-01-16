'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { Header } from '@/components/Header';
import { CalendarView } from '@/components/CalendarView';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PlacementSelector } from '@/components/PlacementSelector';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { Droplets, Activity, MessageSquare, MapPin, Clock, Sparkles } from 'lucide-react';
import { SYMPTOM_OPTIONS, MOOD_OPTIONS, FLOW_OPTIONS, PLACEMENT_AREAS } from '@/lib/constants';
import type { PlacementArea } from '@/types';

function CalendarPage() {
  const { cycles, patchLogs, dailyLogs, updatePatchLogPlacement } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementArea | undefined>();

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDailyLog = dailyLogs.find(l => l.date === selectedDateStr);
  const selectedPatchLog = patchLogs.find(l => l.date === selectedDateStr);

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
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

        {/* Selected Day Details */}
        {selectedDate && (
          <Card className="animate-fade-in">
            <CardContent>
              <CardTitle className="mb-4">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>

              {/* Patch Log */}
              {selectedPatchLog && (
                <div className="mb-4 p-3 bg-[var(--sweet-mint-light)] rounded-xl">
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

              {/* Daily Log */}
              {selectedDailyLog ? (
                <div className="space-y-3">
                  {/* Flow */}
                  {selectedDailyLog.flow && selectedDailyLog.flow !== 'none' && (
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-[var(--fairy-tale-dream-dark)]" />
                      <span className="text-sm">
                        Flow: {FLOW_OPTIONS.find(f => f.id === selectedDailyLog.flow)?.label}
                      </span>
                    </div>
                  )}

                  {/* Mood */}
                  {selectedDailyLog.mood && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {MOOD_OPTIONS.find(m => m.id === selectedDailyLog.mood)?.emoji}
                      </span>
                      <span className="text-sm">
                        {MOOD_OPTIONS.find(m => m.id === selectedDailyLog.mood)?.label}
                      </span>
                    </div>
                  )}

                  {/* Symptoms */}
                  {selectedDailyLog.symptoms.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-[var(--dewpoint-dark)]" />
                        <span className="text-sm font-medium">Symptoms</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedDailyLog.symptoms.map((symptom, i) => (
                          <Badge key={i} variant="info" size="sm">
                            {SYMPTOM_OPTIONS.find(s => s.id === symptom.type)?.icon}{' '}
                            {SYMPTOM_OPTIONS.find(s => s.id === symptom.type)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedDailyLog.notes && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-[var(--foreground-muted)]" />
                        <span className="text-sm font-medium">Notes</span>
                      </div>
                      <p className="text-sm text-[var(--foreground-secondary)] bg-[var(--background-secondary)] p-3 rounded-lg">
                        {selectedDailyLog.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : !selectedPatchLog ? (
                <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                  No entries for this day
                </p>
              ) : null}
            </CardContent>
          </Card>
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
