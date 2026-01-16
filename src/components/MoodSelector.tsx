'use client';

import React from 'react';
import { MOOD_OPTIONS } from '@/lib/constants';
import type { Mood } from '@/types';

interface MoodSelectorProps {
  selected: Mood | undefined;
  onChange: (mood: Mood) => void;
}

export function MoodSelector({ selected, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--foreground)]">How are you feeling?</p>

      <div className="flex justify-between gap-2">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id as Mood)}
              className={`
                flex flex-col items-center gap-1
                py-2 px-3 rounded-xl
                transition-all duration-200
                ${isSelected
                  ? 'bg-[var(--dewpoint)] scale-105'
                  : 'bg-[var(--background-secondary)] hover:bg-gray-100'
                }
              `}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span
                className={`
                  text-[10px] font-medium
                  ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}
                `}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
