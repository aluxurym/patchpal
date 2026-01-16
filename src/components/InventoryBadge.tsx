'use client';

import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Package, AlertTriangle, Plus, Minus } from 'lucide-react';

interface InventoryBadgeProps {
  patchesRemaining: number;
  lowStockThreshold: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  compact?: boolean;
}

export function InventoryBadge({
  patchesRemaining,
  lowStockThreshold,
  onIncrement,
  onDecrement,
  compact = false
}: InventoryBadgeProps) {
  const isLowStock = patchesRemaining <= lowStockThreshold;
  const isEmpty = patchesRemaining === 0;

  if (compact) {
    return (
      <div
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-xl
          ${isEmpty
            ? 'bg-red-50 text-red-600'
            : isLowStock
              ? 'bg-[var(--fairy-tale-dream-light)] text-[var(--fairy-tale-dream-dark)]'
              : 'bg-[var(--dewpoint-light)] text-[var(--foreground)]'
          }
        `}
      >
        <Package className="w-4 h-4" aria-hidden="true" />
        <span className="font-semibold">{patchesRemaining}</span>
        <span className="text-sm">left</span>
      </div>
    );
  }

  return (
    <Card className={isEmpty || isLowStock ? 'border border-[var(--fairy-tale-dream)]' : ''}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`
                p-2.5 rounded-xl
                ${isEmpty
                  ? 'bg-red-50'
                  : isLowStock
                    ? 'bg-[var(--fairy-tale-dream-light)]'
                    : 'bg-[var(--dewpoint-light)]'
                }
              `}
            >
              {isEmpty || isLowStock ? (
                <AlertTriangle
                  className={`w-5 h-5 ${isEmpty ? 'text-red-500' : 'text-[var(--fairy-tale-dream-dark)]'}`}
                  aria-hidden="true"
                />
              ) : (
                <Package className="w-5 h-5 text-[var(--dewpoint-dark)]" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                {patchesRemaining} {patchesRemaining === 1 ? 'Patch' : 'Patches'} Left
              </p>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isEmpty
                  ? 'Add a new box to continue tracking'
                  : isLowStock
                    ? 'Time to get a new box soon'
                    : 'You\'re all set for this cycle'
                }
              </p>
            </div>
          </div>

          {(onIncrement || onDecrement) && (
            <div className="flex items-center gap-2">
              {onDecrement && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrement();
                  }}
                  disabled={patchesRemaining === 0}
                  aria-label="Remove one patch"
                  className="w-9 h-9 rounded-full bg-[var(--background-secondary)] flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--dewpoint)] focus:ring-offset-2"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              {onIncrement && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onIncrement();
                  }}
                  aria-label="Add one patch"
                  className="w-9 h-9 rounded-full bg-[var(--sweet-mint-light)] flex items-center justify-center hover:bg-[var(--sweet-mint)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sweet-mint)] focus:ring-offset-2"
                >
                  <Plus className="w-4 h-4 text-[var(--sweet-mint-dark)]" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
