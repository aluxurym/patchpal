'use client';

import React from 'react';
import { FLOW_OPTIONS } from '@/lib/constants';
import type { FlowIntensity } from '@/types';

interface FlowSelectorProps {
  selected: FlowIntensity | undefined;
  onChange: (flow: FlowIntensity) => void;
}

export function FlowSelector({ selected, onChange }: FlowSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--foreground)]">Flow Intensity</p>

      <div className="flex gap-2">
        {FLOW_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id as FlowIntensity)}
              aria-pressed={isSelected}
              className={`
                flex-1 flex flex-col items-center gap-1.5
                py-3 px-2 rounded-xl
                transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fairy-tale-dream)] focus-visible:ring-offset-2
                ${isSelected
                  ? 'ring-2 ring-[var(--fairy-tale-dream)] bg-white shadow-sm'
                  : 'bg-[var(--background-secondary)] hover:bg-gray-100'
                }
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-full
                  transition-transform duration-200
                  ${isSelected ? 'scale-110' : ''}
                `}
                style={{
                  backgroundColor: option.id === 'none'
                    ? 'var(--dewpoint-light)'
                    : option.id === 'light'
                      ? 'var(--fairy-tale-dream-light)'
                      : option.id === 'medium'
                        ? 'var(--fairy-tale-dream)'
                        : 'var(--fairy-tale-dream-dark)'
                }}
              />
              <span
                className={`
                  text-xs font-medium
                  ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground-secondary)]'}
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
