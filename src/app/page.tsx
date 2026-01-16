'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Header } from '@/components/Header';
import { CycleRing } from '@/components/CycleRing';
import { NextActionCard } from '@/components/NextActionCard';
import { InventoryBadge } from '@/components/InventoryBadge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PlacementSelector } from '@/components/PlacementSelector';
import { useAppStore } from '@/lib/store';
import { getCycleStatus, getSuggestedPlacement, isLateChange } from '@/lib/cycle-utils';
import { Check, RotateCcw, AlertTriangle, Plus, X, ChevronRight } from 'lucide-react';
import { DAY_NAMES, MAX_CYCLE_WEEKS } from '@/lib/constants';
import type { PlacementArea, CycleLength } from '@/types';

function HomePage() {
  const {
    activeCycle,
    inventory,
    settings,
    patchLogs,
    logPatchChange,
    incrementPatch,
    decrementPatch,
    startNewCycle,
    extendCycle,
    cancelCycleExtension
  } = useAppStore();

  const [showLogModal, setShowLogModal] = useState(false);
  const [showLateChangeModal, setShowLateChangeModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementArea | undefined>();
  const [extensionWeeks, setExtensionWeeks] = useState<1 | 2>(1);
  const [pendingLogData, setPendingLogData] = useState<{
    week: 1 | 2 | 3 | 4 | 5 | 6;
    action: 'applied' | 'changed' | 'removed';
    placement?: PlacementArea;
  } | null>(null);

  if (!activeCycle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--sweet-mint-light)] flex items-center justify-center mb-6">
          <RotateCcw className="w-12 h-12 text-[var(--sweet-mint-dark)]" />
        </div>
        <h2 className="font-display font-bold text-xl mb-2">Start a New Cycle</h2>
        <p className="text-[var(--foreground-secondary)] mb-6">
          Ready to begin tracking? Start your new patch cycle today.
        </p>
        <Button onClick={() => startNewCycle()}>
          Start New Cycle
        </Button>
      </div>
    );
  }

  const status = getCycleStatus(activeCycle);
  const lastPatchLog = patchLogs.filter(p => p.cycleId === activeCycle.id).pop();
  const suggestedPlacement = getSuggestedPlacement(lastPatchLog?.placement) as PlacementArea;

  const handleLogPatch = async () => {
    // Don't require placement for patch-free week
    if (!selectedPlacement && !status.isPatchFreeWeek) return;

    const action = status.currentWeek === 1
      ? 'applied'
      : status.isPatchFreeWeek
        ? 'removed'
        : 'changed';

    // Check if we should start a new cycle
    if (status.nextAction === 'start_new_cycle') {
      await startNewCycle();
      setShowLogModal(false);
      setSelectedPlacement(undefined);
      return;
    }

    // Check if this is a late change (on a different day than scheduled)
    if (!status.isPatchFreeWeek && isLateChange(activeCycle, new Date())) {
      // Store pending log data and show late change modal
      setPendingLogData({
        week: status.currentWeek as 1 | 2 | 3 | 4 | 5 | 6,
        action,
        placement: selectedPlacement
      });
      setShowLogModal(false);
      setShowLateChangeModal(true);
      return;
    }

    // Normal patch log (on scheduled day)
    if (!status.isPatchFreeWeek) {
      await logPatchChange(status.currentWeek as 1 | 2 | 3 | 4 | 5 | 6, action, selectedPlacement);
    }

    setShowLogModal(false);
    setSelectedPlacement(undefined);
  };

  const handleLateChangeConfirm = async (updatePatchDay: boolean) => {
    if (pendingLogData) {
      await logPatchChange(
        pendingLogData.week,
        pendingLogData.action,
        pendingLogData.placement,
        new Date(),
        updatePatchDay
      );
    }
    setShowLateChangeModal(false);
    setPendingLogData(null);
    setSelectedPlacement(undefined);
  };

  return (
    <>
      <Header title="PatchPal" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Cycle Ring */}
        <div className="flex justify-center py-4">
          <CycleRing status={status} size="lg" />
        </div>

        {/* Next Action Card */}
        <NextActionCard
          status={status}
          onAction={() => setShowLogModal(true)}
        />

        {/* Inventory */}
        <InventoryBadge
          patchesRemaining={inventory.patchesRemaining}
          lowStockThreshold={settings.lowStockThreshold}
          onIncrement={incrementPatch}
          onDecrement={decrementPatch}
        />

        {/* Extend Cycle Option - shown when in week 3 and can extend */}
        {status.canExtend && (
          <Card
            hoverable
            onClick={() => {
              setExtensionWeeks(1);
              setShowExtendModal(true);
            }}
            className="border border-[var(--dewpoint)]"
          >
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--dewpoint-light)] rounded-xl">
                    <Plus className="w-5 h-5 text-[var(--dewpoint-dark)]" />
                  </div>
                  <div>
                    <p className="font-medium">Extend Cycle</p>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      Delay your period by 1-2 weeks
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Extension Option - shown when in extended week */}
        {status.canCancelExtension && (
          <Card
            hoverable
            onClick={() => cancelCycleExtension()}
            className="border border-[var(--fairy-tale-dream)]"
          >
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--fairy-tale-dream-light)] rounded-xl">
                    <X className="w-5 h-5 text-[var(--fairy-tale-dream-dark)]" />
                  </div>
                  <div>
                    <p className="font-medium">End Extension Early</p>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      Start patch-free week next week
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[var(--background-secondary)] rounded-xl">
                <p className="text-2xl font-display font-bold text-[var(--sweet-mint-dark)]">
                  {status.patchChangeDay}
                </p>
                <p className="text-xs text-[var(--foreground-secondary)]">Change Day</p>
              </div>
              <div className="text-center p-3 bg-[var(--background-secondary)] rounded-xl">
                <p className="text-2xl font-display font-bold text-[var(--foreground)]">
                  {status.daysUntilNextChange}
                </p>
                <p className="text-xs text-[var(--foreground-secondary)]">Days Until Change</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => {
          setShowLogModal(false);
          setSelectedPlacement(undefined);
        }}
        title={status.isPatchFreeWeek ? 'Patch-Free Week' : 'Log Patch Change'}
      >
        {status.isPatchFreeWeek ? (
          <div className="space-y-4">
            <p className="text-[var(--foreground-secondary)]">
              This is your patch-free week. Your period should arrive during this time.
              {status.nextAction === 'start_new_cycle' && (
                <span className="block mt-2 font-medium text-[var(--foreground)]">
                  Ready to start your next cycle?
                </span>
              )}
            </p>
            {status.nextAction === 'start_new_cycle' && (
              <Button fullWidth onClick={handleLogPatch}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Cycle
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <PlacementSelector
              selected={selectedPlacement}
              onChange={setSelectedPlacement}
              suggested={suggestedPlacement}
            />

            <Button
              fullWidth
              onClick={handleLogPatch}
              disabled={!selectedPlacement}
            >
              <Check className="w-4 h-4 mr-2" />
              {status.currentWeek === 1 ? 'Log Patch Applied' : 'Log Patch Changed'}
            </Button>
          </div>
        )}
      </Modal>

      {/* Late Change Confirmation Modal */}
      <Modal
        isOpen={showLateChangeModal}
        onClose={() => {
          setShowLateChangeModal(false);
          setPendingLogData(null);
          setSelectedPlacement(undefined);
        }}
        title="Different Day Detected"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[var(--fairy-tale-dream-light)] rounded-xl">
            <AlertTriangle className="w-5 h-5 text-[var(--fairy-tale-dream-dark)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-[var(--foreground)]">
                You're logging this patch change on <strong>{DAY_NAMES[new Date().getDay()]}</strong>,
                but your scheduled change day is <strong>{status.patchChangeDay}</strong>.
              </p>
            </div>
          </div>

          <p className="text-sm text-[var(--foreground-secondary)]">
            Would you like to update your patch change day to {DAY_NAMES[new Date().getDay()]} for the rest of this cycle?
          </p>

          <div className="space-y-2">
            <Button
              fullWidth
              onClick={() => handleLateChangeConfirm(true)}
            >
              Yes, change my patch day to {DAY_NAMES[new Date().getDay()]}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => handleLateChangeConfirm(false)}
            >
              No, keep {status.patchChangeDay} as my patch day
            </Button>
          </div>

          <p className="text-xs text-[var(--foreground-muted)] text-center">
            Either way, your patch change will be logged for today.
          </p>
        </div>
      </Modal>

      {/* Extend Cycle Modal */}
      <Modal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title="Extend Your Cycle"
      >
        <div className="space-y-4">
          <p className="text-[var(--foreground-secondary)]">
            Delay your period by continuing to wear patches for extra weeks.
          </p>

          <div className="space-y-2">
            <label
              className={`
                flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all
                ${extensionWeeks === 1
                  ? 'border-[var(--dewpoint)] bg-[var(--dewpoint-light)]'
                  : 'border-gray-200 hover:border-gray-300'}
              `}
              onClick={() => setExtensionWeeks(1)}
            >
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${extensionWeeks === 1
                    ? 'border-[var(--dewpoint-dark)] bg-[var(--dewpoint-dark)]'
                    : 'border-gray-300'}
                `}
              >
                {extensionWeeks === 1 && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">1 extra week (5 weeks total)</p>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  Period in ~{7 + status.daysUntilNextChange} days
                </p>
              </div>
            </label>

            {status.totalWeeks < 5 && (
              <label
                className={`
                  flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all
                  ${extensionWeeks === 2
                    ? 'border-[var(--dewpoint)] bg-[var(--dewpoint-light)]'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
                onClick={() => setExtensionWeeks(2)}
              >
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${extensionWeeks === 2
                      ? 'border-[var(--dewpoint-dark)] bg-[var(--dewpoint-dark)]'
                      : 'border-gray-300'}
                  `}
                >
                  {extensionWeeks === 2 && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">2 extra weeks (6 weeks total)</p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Period in ~{14 + status.daysUntilNextChange} days
                  </p>
                </div>
              </label>
            )}
          </div>

          <div className="p-3 bg-[var(--dewpoint-light)] rounded-xl text-sm">
            <p className="text-[var(--foreground-secondary)]">
              You can always cancel the extension and start your patch-free week early.
            </p>
          </div>

          <Button
            fullWidth
            onClick={() => {
              extendCycle(extensionWeeks);
              setShowExtendModal(false);
            }}
          >
            Extend by {extensionWeeks} week{extensionWeeks > 1 ? 's' : ''}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function Home() {
  return (
    <AppShell>
      <HomePage />
    </AppShell>
  );
}
