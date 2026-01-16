'use client';

import React, { useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { Header } from '@/components/Header';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAppStore } from '@/lib/store';
import { SYMPTOM_OPTIONS } from '@/lib/constants';
import { Trophy, Target, TrendingUp, Activity, Droplets, Calendar } from 'lucide-react';
import type { SymptomType } from '@/types';

function StatsPage() {
  const { cycles, patchLogs, dailyLogs } = useAppStore();

  const stats = useMemo(() => {
    const completedCycles = cycles.filter(c => !c.isActive);
    const totalCycles = cycles.length;

    // Calculate adherence rate
    const onTimeLogs = patchLogs.filter(l => l.onTime).length;
    const adherenceRate = patchLogs.length > 0
      ? Math.round((onTimeLogs / patchLogs.length) * 100)
      : 100;

    // Calculate current streak (consecutive on-time cycles)
    let currentStreak = 0;
    for (let i = completedCycles.length - 1; i >= 0; i--) {
      const cycleLogs = patchLogs.filter(l => l.cycleId === completedCycles[i].id);
      if (cycleLogs.every(l => l.onTime)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate average period length
    const periodLogs = dailyLogs.filter(l => l.flow && l.flow !== 'none');
    const cyclesWithPeriod = [...new Set(periodLogs.map(l => l.cycleId))].length;
    const averagePeriodLength = cyclesWithPeriod > 0
      ? Math.round(periodLogs.length / cyclesWithPeriod)
      : 0;

    // Calculate symptom frequency
    const symptomCounts: Record<string, number> = {};
    dailyLogs.forEach(log => {
      log.symptoms.forEach(s => {
        symptomCounts[s.type] = (symptomCounts[s.type] || 0) + 1;
      });
    });

    const totalSymptomDays = dailyLogs.filter(l => l.symptoms.length > 0).length;
    const commonSymptoms = Object.entries(symptomCounts)
      .map(([type, count]) => ({
        type: type as SymptomType,
        count,
        percentage: totalSymptomDays > 0 ? Math.round((count / totalSymptomDays) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCycles,
      completedCycles: completedCycles.length,
      adherenceRate,
      currentStreak,
      averagePeriodLength,
      commonSymptoms,
      totalLogsCount: dailyLogs.length
    };
  }, [cycles, patchLogs, dailyLogs]);

  return (
    <>
      <Header title="Statistics" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Adherence Card */}
        <Card className="bg-gradient-to-br from-[var(--sweet-mint-light)] to-white">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Target className="w-8 h-8 text-[var(--sweet-mint-dark)]" />
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-[var(--sweet-mint-dark)]">
                  {stats.adherenceRate}%
                </p>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  On-time patch changes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="text-center">
              <Trophy className="w-6 h-6 text-[var(--fairy-tale-dream-dark)] mx-auto mb-2" />
              <p className="text-2xl font-display font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-[var(--foreground-secondary)]">Perfect Cycles</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center">
              <Calendar className="w-6 h-6 text-[var(--dewpoint-dark)] mx-auto mb-2" />
              <p className="text-2xl font-display font-bold">{stats.totalCycles}</p>
              <p className="text-xs text-[var(--foreground-secondary)]">Total Cycles</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center">
              <Droplets className="w-6 h-6 text-[var(--fairy-tale-dream)] mx-auto mb-2" />
              <p className="text-2xl font-display font-bold">
                {stats.averagePeriodLength || '-'}
              </p>
              <p className="text-xs text-[var(--foreground-secondary)]">Avg Period Days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center">
              <TrendingUp className="w-6 h-6 text-[var(--sweet-mint)] mx-auto mb-2" />
              <p className="text-2xl font-display font-bold">{stats.totalLogsCount}</p>
              <p className="text-xs text-[var(--foreground-secondary)]">Days Logged</p>
            </CardContent>
          </Card>
        </div>

        {/* Symptom Patterns */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[var(--dewpoint-dark)]" />
              <CardTitle>Common Symptoms</CardTitle>
            </div>

            {stats.commonSymptoms.length > 0 ? (
              <div className="space-y-3">
                {stats.commonSymptoms.map((symptom) => {
                  const symptomInfo = SYMPTOM_OPTIONS.find(s => s.id === symptom.type);
                  return (
                    <div key={symptom.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{symptomInfo?.icon}</span>
                          <span>{symptomInfo?.label}</span>
                        </span>
                        <span className="text-[var(--foreground-secondary)]">
                          {symptom.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--dewpoint)] rounded-full transition-all duration-500"
                          style={{ width: `${symptom.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                Start logging symptoms to see patterns
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-[var(--fairy-tale-dream-light)]">
          <CardContent>
            <CardTitle className="text-[var(--fairy-tale-dream-dark)] mb-2">
              Keep it up!
            </CardTitle>
            <CardDescription>
              Consistent tracking helps you understand your body better.
              Log your symptoms daily for the most accurate insights.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function Stats() {
  return (
    <AppShell>
      <StatsPage />
    </AppShell>
  );
}
