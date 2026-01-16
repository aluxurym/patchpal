'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, format, isSameDay } from 'date-fns';
import { generateCalendarDays } from '@/lib/cycle-utils';
import { DAY_NAMES_SHORT } from '@/lib/constants';
import type { Cycle, PatchLog, DailyLog } from '@/types';

interface CalendarViewProps {
  cycles: Cycle[];
  patchLogs: PatchLog[];
  dailyLogs: DailyLog[];
  onDaySelect: (date: Date) => void;
  selectedDate?: Date | null;
}

export function CalendarView({
  cycles,
  patchLogs,
  dailyLogs,
  onDaySelect,
  selectedDate
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    return generateCalendarDays(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      cycles,
      patchLogs,
      dailyLogs
    );
  }, [currentMonth, cycles, patchLogs, dailyLogs]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="bg-white rounded-2xl shadow-[var(--card-shadow)] p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors tap-target"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-semibold text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors tap-target"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES_SHORT.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-[var(--foreground-muted)] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          const hasPatchLog = !!day.patchLog;
          const hasDailyLog = !!day.dailyLog;
          const hasFlow = day.dailyLog?.flow && day.dailyLog.flow !== 'none';

          return (
            <button
              key={index}
              onClick={() => onDaySelect(day.date)}
              className={`
                relative aspect-square flex flex-col items-center justify-center
                rounded-xl text-sm font-medium
                transition-all duration-200 tap-target
                ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                ${day.isToday ? 'ring-2 ring-[var(--dewpoint)]' : ''}
                ${isSelected ? 'bg-[var(--fairy-tale-dream)] text-white' : ''}
                ${day.isPatchFreeWeek && day.isCurrentMonth && !isSelected
                  ? 'bg-[var(--fairy-tale-dream-light)]'
                  : day.isExtendedWeek && day.isCurrentMonth && !isSelected
                    ? 'bg-[var(--dewpoint-light)]'
                    : ''
                }
                ${!isSelected && day.isCurrentMonth ? 'hover:bg-gray-100' : ''}
              `}
            >
              <span>{day.date.getDate()}</span>

              {/* Indicators */}
              <div className="absolute bottom-1 flex gap-0.5">
                {hasPatchLog && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[var(--sweet-mint)]'
                    }`}
                  />
                )}
                {hasFlow && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[var(--fairy-tale-dream-dark)]'
                    }`}
                  />
                )}
                {hasDailyLog && !hasFlow && day.dailyLog!.symptoms.length > 0 && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[var(--dewpoint-dark)]'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--foreground-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--sweet-mint)]" />
          <span>Patch change</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--fairy-tale-dream-dark)]" />
          <span>Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[var(--dewpoint-light)]" />
          <span>Extended week</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[var(--fairy-tale-dream-light)]" />
          <span>Patch-free week</span>
        </div>
      </div>
    </div>
  );
}
