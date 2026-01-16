'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { BottomNav } from './BottomNav';
import { Onboarding } from './Onboarding';
import type { PlacementArea, CycleLength } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const {
    isInitialized,
    isLoading,
    settings,
    initialize,
    startNewCycle,
    completeOnboarding
  } = useAppStore();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !settings.onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [isInitialized, settings.onboardingComplete]);

  const handleOnboardingComplete = async (startDate: Date, placement?: PlacementArea, totalWeeks?: CycleLength) => {
    // Start new cycle with auto-fill for historical dates
    await startNewCycle(startDate, placement, totalWeeks);
    await completeOnboarding();
    setShowOnboarding(false);
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--sweet-mint-light)] animate-pulse" />
          <p className="text-[var(--foreground-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
