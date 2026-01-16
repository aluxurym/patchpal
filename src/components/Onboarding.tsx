'use client';

import React, { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { PlacementSelector } from './PlacementSelector';
import { Card, CardContent } from './ui/Card';
import { ChevronRight, Sparkles, Calendar, Bell, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { getCycleSummary, formatDate } from '@/lib/cycle-utils';
import { addDays, format, differenceInDays } from 'date-fns';
import { DAY_NAMES, getPatchWeeksCount } from '@/lib/constants';
import type { PlacementArea, CycleLength } from '@/types';

interface OnboardingProps {
  onComplete: (startDate: Date, placement?: PlacementArea, totalWeeks?: CycleLength) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [placement, setPlacement] = useState<PlacementArea | undefined>();
  const [totalWeeks, setTotalWeeks] = useState<CycleLength>(4);

  // Calculate cycle info based on selected start date and total weeks
  const cycleInfo = useMemo(() => {
    const selectedDate = new Date(startDate);
    const today = new Date();
    const daysSinceStart = differenceInDays(today, selectedDate);

    // Check if date is too far in the past (more than cycle length = need new cycle)
    const cycleDays = totalWeeks * 7;
    const isTooOld = daysSinceStart > cycleDays;

    // Get cycle summary with totalWeeks
    const summary = getCycleSummary(selectedDate, totalWeeks);
    const patchWeeks = getPatchWeeksCount(totalWeeks);

    // Calculate the dates for each week dynamically
    const weekDates: { [key: string]: string } = {};
    for (let w = 1; w <= totalWeeks; w++) {
      if (w < totalWeeks) {
        weekDates[`week${w}`] = format(addDays(selectedDate, (w - 1) * 7), 'MMM d');
      } else {
        // Last week (patch-free) shows range
        weekDates[`week${w}Start`] = format(addDays(selectedDate, (w - 1) * 7), 'MMM d');
        weekDates[`week${w}End`] = format(addDays(selectedDate, w * 7 - 1), 'MMM d');
      }
    }

    return {
      ...summary,
      isTooOld,
      daysSinceStart,
      patchChangeDay: DAY_NAMES[selectedDate.getDay()],
      dates: weekDates,
      patchWeeks
    };
  }, [startDate, totalWeeks]);

  // Determine if we need placement (only if in a patch week, not patch-free)
  const needsPlacement = cycleInfo.currentWeek <= cycleInfo.patchWeeks && !cycleInfo.isTooOld;

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to PatchPal',
      description: 'Your personal companion for tracking your Evra contraceptive patch cycle.',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, text: 'Track your 28-day cycle' },
              { icon: Bell, text: 'Get timely reminders' },
              { icon: Shield, text: '100% private & local' },
              { icon: Sparkles, text: 'Beautiful & simple' }
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 bg-[var(--background-secondary)] rounded-xl"
              >
                <item.icon className="w-5 h-5 text-[var(--sweet-mint-dark)]" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'date',
      title: 'When did you apply your first patch?',
      description: 'Select the date you started this cycle (can be in the past).',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="
              w-full px-4 py-3 rounded-xl
              border-2 border-[var(--dewpoint)]
              focus:border-[var(--sweet-mint)] focus:outline-none
              font-medium text-center text-lg
            "
          />

          {/* Show cycle summary */}
          {startDate && (
            <Card className={`mt-4 ${cycleInfo.isTooOld ? 'border-2 border-[var(--fairy-tale-dream)]' : ''}`}>
              <CardContent>
                {cycleInfo.isTooOld ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--fairy-tale-dream-dark)] mt-0.5" />
                    <div>
                      <p className="font-medium text-[var(--fairy-tale-dream-dark)]">
                        That cycle has ended
                      </p>
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                        It's been more than 28 days. Please select the start date of your current cycle, or select today to start fresh.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[var(--sweet-mint-dark)]" />
                      <p className="font-medium">{cycleInfo.message}</p>
                    </div>

                    {/* Week timeline - dynamic based on totalWeeks */}
                    <div className="space-y-2 mt-3">
                      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
                        const isPast = week < cycleInfo.currentWeek;
                        const isCurrent = week === cycleInfo.currentWeek;
                        const isPatchFreeWeek = week === totalWeeks;
                        const isExtendedWeek = week > 3 && !isPatchFreeWeek;
                        const dateLabel = isPatchFreeWeek
                          ? `${cycleInfo.dates[`week${week}Start`]} - ${cycleInfo.dates[`week${week}End`]}`
                          : cycleInfo.dates[`week${week}`];

                        return (
                          <div
                            key={week}
                            className={`
                              flex items-center gap-3 p-2 rounded-lg text-sm
                              ${isCurrent
                                ? isPatchFreeWeek
                                  ? 'bg-[var(--fairy-tale-dream-light)] font-medium'
                                  : isExtendedWeek
                                    ? 'bg-[var(--dewpoint-light)] font-medium'
                                    : 'bg-[var(--sweet-mint-light)] font-medium'
                                : isPast
                                  ? 'text-[var(--foreground-muted)]'
                                  : 'text-[var(--foreground-secondary)]'
                              }
                            `}
                          >
                            <div
                              className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${isCurrent
                                  ? isPatchFreeWeek
                                    ? 'bg-[var(--fairy-tale-dream)] text-white'
                                    : isExtendedWeek
                                      ? 'bg-[var(--dewpoint)] text-white'
                                      : 'bg-[var(--sweet-mint)] text-white'
                                  : isPast
                                    ? 'bg-gray-200'
                                    : 'bg-[var(--dewpoint-light)]'
                                }
                              `}
                            >
                              {week}
                            </div>
                            <span className="flex-1">
                              {isPatchFreeWeek ? 'Patch-free (period)' : week === 1 ? 'Applied' : isExtendedWeek ? 'Extended' : 'Changed'}
                              {isPast && !isPatchFreeWeek && ' (auto-filled)'}
                            </span>
                            <span className="text-xs">{dateLabel}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cycle length selector */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-xs text-[var(--foreground-secondary)] mb-2">Cycle length:</p>
                      <div className="flex gap-2">
                        {[4, 5, 6].map((weeks) => (
                          <button
                            key={weeks}
                            onClick={() => setTotalWeeks(weeks as CycleLength)}
                            className={`
                              flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                              ${totalWeeks === weeks
                                ? 'bg-[var(--dewpoint)] text-white'
                                : 'bg-gray-100 text-[var(--foreground-secondary)] hover:bg-gray-200'}
                            `}
                          >
                            {weeks}w
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-2">
                        {totalWeeks === 4
                          ? 'Standard cycle - period every 4 weeks'
                          : `Extended cycle - delays period by ${totalWeeks - 4} week${totalWeeks > 5 ? 's' : ''}`}
                      </p>
                    </div>

                    <p className="text-xs text-[var(--foreground-muted)] mt-2">
                      Your patch change day will be: <strong>{cycleInfo.patchChangeDay}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      id: 'placement',
      title: 'Where is your current patch?',
      description: 'This helps us suggest rotation for your next patch.',
      icon: Sparkles,
      content: (
        <PlacementSelector
          selected={placement}
          onChange={setPlacement}
        />
      ),
      // Only show this step if user needs to select placement
      skip: !needsPlacement
    }
  ];

  // Filter out skipped steps
  const activeSteps = steps.filter(s => !s.skip);
  const currentStepIndex = Math.min(step, activeSteps.length - 1);
  const currentStep = activeSteps[currentStepIndex];
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  const canProceed = () => {
    if (currentStep.id === 'welcome') return true;
    if (currentStep.id === 'date') return startDate && !cycleInfo.isTooOld;
    if (currentStep.id === 'placement') return !!placement;
    return true;
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(new Date(startDate), placement, totalWeeks);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--dewpoint-light)] to-white flex flex-col">
      {/* Progress */}
      <div className="p-6">
        <div className="flex gap-2">
          {activeSteps.map((_, i) => (
            <div
              key={i}
              className={`
                h-1 flex-1 rounded-full transition-colors duration-300
                ${i <= currentStepIndex ? 'bg-[var(--sweet-mint)]' : 'bg-white'}
              `}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pb-6 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-start text-center pt-4">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-[var(--sweet-mint-light)] flex items-center justify-center mb-6">
            <currentStep.icon className="w-10 h-10 text-[var(--sweet-mint-dark)]" />
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-2xl mb-2">
            {currentStep.title}
          </h1>
          <p className="text-[var(--foreground-secondary)] mb-6">
            {currentStep.description}
          </p>

          {/* Step content */}
          <div className="w-full max-w-sm">
            {currentStep.content}
          </div>
        </div>

        {/* Button */}
        <div className="mt-6 pt-4">
          <Button
            fullWidth
            size="lg"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {isLastStep ? 'Start Tracking' : 'Continue'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>

          {currentStepIndex > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full mt-3 py-2 text-[var(--foreground-secondary)] text-sm"
            >
              Go back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
