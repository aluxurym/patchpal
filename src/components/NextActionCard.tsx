'use client';

import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Calendar, ArrowRight } from 'lucide-react';
import type { CycleStatus } from '@/types';
import { formatDate } from '@/lib/cycle-utils';
import { getWeekDescription } from '@/lib/constants';

interface NextActionCardProps {
  status: CycleStatus;
  onAction?: () => void;
}

export function NextActionCard({ status, onAction }: NextActionCardProps) {
  const { nextAction, nextChangeDate, daysUntilNextChange, currentWeek, isPatchFreeWeek, totalWeeks } = status;
  const isExtendedWeek = currentWeek > 3 && !isPatchFreeWeek;

  const getActionText = () => {
    switch (nextAction) {
      case 'apply':
        return 'Apply New Patch';
      case 'change':
        return 'Change Patch';
      case 'remove':
        return 'Remove Patch';
      case 'start_new_cycle':
        return 'Start New Cycle';
    }
  };

  const getDaysText = () => {
    if (daysUntilNextChange === 0) return 'Today';
    if (daysUntilNextChange === 1) return 'Tomorrow';
    return `in ${daysUntilNextChange} days`;
  };

  return (
    <Card
      className={`
        border-l-4
        ${isPatchFreeWeek
          ? 'border-l-[var(--fairy-tale-dream)]'
          : isExtendedWeek
            ? 'border-l-[var(--dewpoint)]'
            : 'border-l-[var(--sweet-mint)]'
        }
      `}
      hoverable
      onClick={onAction}
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`
                p-2.5 rounded-xl
                ${isPatchFreeWeek
                  ? 'bg-[var(--fairy-tale-dream-light)]'
                  : isExtendedWeek
                    ? 'bg-[var(--dewpoint-light)]'
                    : 'bg-[var(--sweet-mint-light)]'
                }
              `}
            >
              <Calendar
                className={`w-5 h-5 ${
                  isPatchFreeWeek
                    ? 'text-[var(--fairy-tale-dream-dark)]'
                    : isExtendedWeek
                      ? 'text-[var(--dewpoint-dark)]'
                      : 'text-[var(--sweet-mint-dark)]'
                }`}
              />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                {getActionText()}
              </p>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {formatDate(nextChangeDate, 'EEEE, MMM d')} · {getDaysText()}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[var(--foreground-muted)]" />
        </div>

        <p className="mt-3 text-xs text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-3 py-2 rounded-lg">
          {getWeekDescription(currentWeek, totalWeeks)}
        </p>
      </CardContent>
    </Card>
  );
}
