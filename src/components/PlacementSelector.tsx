'use client';

import React from 'react';
import { PLACEMENT_AREAS } from '@/lib/constants';
import type { PlacementArea } from '@/types';

interface PlacementSelectorProps {
  selected: PlacementArea | undefined;
  onChange: (placement: PlacementArea) => void;
  suggested?: PlacementArea;
}

export function PlacementSelector({ selected, onChange, suggested }: PlacementSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--foreground)]">Patch Placement</p>

      <div className="grid grid-cols-2 gap-2">
        {PLACEMENT_AREAS.map((area) => {
          const isSelected = selected === area.id;
          const isSuggested = suggested === area.id && !selected;

          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onChange(area.id as PlacementArea)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                text-left transition-all duration-200
                ${isSelected
                  ? 'bg-[var(--sweet-mint)] text-[var(--foreground)]'
                  : isSuggested
                    ? 'bg-[var(--sweet-mint-light)] border-2 border-dashed border-[var(--sweet-mint)]'
                    : 'bg-[var(--background-secondary)] hover:bg-gray-100'
                }
              `}
            >
              <span className="text-xl">{area.icon}</span>
              <div>
                <span className="font-medium">{area.label}</span>
                {isSuggested && (
                  <span className="block text-xs text-[var(--sweet-mint-dark)]">
                    Suggested
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
