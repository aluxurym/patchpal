'use client';

import React from 'react';
import { SYMPTOM_OPTIONS } from '@/lib/constants';
import type { SymptomEntry, SymptomType } from '@/types';

interface SymptomPickerProps {
  selected: SymptomEntry[];
  onChange: (symptoms: SymptomEntry[]) => void;
}

export function SymptomPicker({ selected, onChange }: SymptomPickerProps) {
  const toggleSymptom = (type: SymptomType) => {
    const existing = selected.find(s => s.type === type);
    if (existing) {
      // Remove if already selected
      onChange(selected.filter(s => s.type !== type));
    } else {
      // Add with default severity of 1
      onChange([...selected, { type, severity: 1 }]);
    }
  };

  const updateSeverity = (type: SymptomType, severity: 1 | 2 | 3) => {
    onChange(
      selected.map(s =>
        s.type === type ? { ...s, severity } : s
      )
    );
  };

  const isSelected = (type: SymptomType) => selected.some(s => s.type === type);
  const getSeverity = (type: SymptomType) => selected.find(s => s.type === type)?.severity || 1;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--foreground)]">Symptoms</p>

      <div className="grid grid-cols-2 gap-2">
        {SYMPTOM_OPTIONS.map((symptom) => {
          const selected = isSelected(symptom.id as SymptomType);
          const severity = getSeverity(symptom.id as SymptomType);

          return (
            <div key={symptom.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSymptom(symptom.id as SymptomType)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
                  text-sm font-medium
                  transition-all duration-200
                  ${selected
                    ? 'bg-[var(--dewpoint)] text-[var(--foreground)]'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-gray-100'
                  }
                `}
              >
                <span>{symptom.icon}</span>
                <span className="truncate">{symptom.label}</span>
              </button>

              {/* Severity selector */}
              {selected && (
                <div className="flex gap-1 px-1">
                  {([1, 2, 3] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateSeverity(symptom.id as SymptomType, level)}
                      className={`
                        flex-1 py-1 rounded text-xs font-medium
                        transition-colors duration-150
                        ${severity === level
                          ? level === 1
                            ? 'bg-[var(--sweet-mint-light)] text-[var(--sweet-mint-dark)]'
                            : level === 2
                              ? 'bg-[var(--fairy-tale-dream-light)] text-[var(--fairy-tale-dream-dark)]'
                              : 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}
                    >
                      {level === 1 ? 'Mild' : level === 2 ? 'Mod' : 'Severe'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
