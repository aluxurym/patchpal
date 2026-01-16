'use client';

import React, { memo } from 'react';
import type { CycleStatus } from '@/types';

interface CycleRingProps {
  status: CycleStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const CycleRing = memo(function CycleRing({ status, size = 'lg' }: CycleRingProps) {
  const { currentWeek, dayInCycle, isPatchFreeWeek, totalWeeks } = status;

  const sizes = {
    sm: { ring: 120, stroke: 8, fontSize: 'text-lg' },
    md: { ring: 180, stroke: 10, fontSize: 'text-2xl' },
    lg: { ring: 220, stroke: 12, fontSize: 'text-3xl' }
  };

  const { ring, stroke, fontSize } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (0-1) based on day in cycle (dynamic cycle length)
  const cycleLength = totalWeeks * 7;
  const progress = dayInCycle / cycleLength;
  const offset = circumference * (1 - progress);

  // Dynamic week positions around the ring
  const weekPositions = Array.from({ length: totalWeeks }, (_, i) => (360 / totalWeeks) * i);

  return (
    <div className="relative flex items-center justify-center" style={{ width: ring, height: ring }}>
      {/* Background ring */}
      <svg
        className="absolute transform -rotate-90"
        width={ring}
        height={ring}
        aria-hidden="true"
        role="presentation"
      >
        {/* Track */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="var(--dewpoint-light)"
          strokeWidth={stroke}
        />

        {/* Progress */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke={isPatchFreeWeek ? 'var(--fairy-tale-dream)' : 'var(--sweet-mint)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Week indicators - dynamic based on totalWeeks */}
      {weekPositions.map((angle, index) => {
        const weekNum = index + 1;
        const isCurrentWeek = weekNum === currentWeek;
        const isPastWeek = weekNum < currentWeek;
        const isExtendedWeek = weekNum > 3 && weekNum < totalWeeks;
        const isPatchFree = weekNum === totalWeeks;
        const radian = ((angle - 90) * Math.PI) / 180;
        const x = ring / 2 + (radius + stroke + 8) * Math.cos(radian);
        const y = ring / 2 + (radius + stroke + 8) * Math.sin(radian);

        return (
          <div
            key={weekNum}
            className={`
              absolute w-6 h-6 rounded-full flex items-center justify-center
              text-xs font-semibold transition-all duration-300
              ${isCurrentWeek
                ? isPatchFree
                  ? 'bg-[var(--fairy-tale-dream)] text-white scale-110'
                  : isExtendedWeek
                    ? 'bg-[var(--dewpoint)] text-white scale-110'
                    : 'bg-[var(--sweet-mint)] text-white scale-110'
                : isPastWeek
                  ? 'bg-[var(--sweet-mint-light)] text-[var(--sweet-mint-dark)]'
                  : isPatchFree
                    ? 'bg-[var(--fairy-tale-dream-light)] text-[var(--fairy-tale-dream-dark)]'
                    : isExtendedWeek
                      ? 'bg-[var(--dewpoint-light)] text-[var(--dewpoint-dark)]'
                      : 'bg-[var(--dewpoint-light)] text-[var(--foreground-muted)]'
              }
            `}
            style={{
              left: x - 12,
              top: y - 12
            }}
          >
            {weekNum}
          </div>
        );
      })}

      {/* Center content */}
      <div className="flex flex-col items-center justify-center z-10">
        <span className="text-sm font-medium text-[var(--foreground-secondary)] uppercase tracking-wide">
          Week {currentWeek} of {totalWeeks}
        </span>
        <span className={`font-display font-bold ${fontSize} text-[var(--foreground)]`}>
          Day {dayInCycle}
        </span>
        <span
          className={`
            mt-1 px-3 py-1 rounded-full text-xs font-semibold
            ${isPatchFreeWeek
              ? 'bg-[var(--fairy-tale-dream-light)] text-[var(--fairy-tale-dream-dark)]'
              : currentWeek > 3
                ? 'bg-[var(--dewpoint-light)] text-[var(--dewpoint-dark)]'
                : 'bg-[var(--sweet-mint-light)] text-[var(--sweet-mint-dark)]'
            }
          `}
        >
          {isPatchFreeWeek ? 'Patch Free' : currentWeek > 3 ? 'Extended' : 'Patch On'}
        </span>
      </div>
    </div>
  );
});
