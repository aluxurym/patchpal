'use client';

import React, { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Header } from '@/components/Header';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAppStore } from '@/lib/store';
import { SYMPTOM_OPTIONS, PLACEMENT_AREAS } from '@/lib/constants';
import { formatDate } from '@/lib/cycle-utils';
import { Trophy, Target, TrendingUp, Activity, Droplets, Calendar, ChevronRight, History } from 'lucide-react';
import type { SymptomType, Cycle, PatchLog, DailyLog } from '@/types';

interface CycleHistoryData {
  cycle: Cycle;
  dateRange: string;
  adherence: number;
  logs: PatchLog[];
  placements: string[];
  periodDays: number;
  symptoms: { type: SymptomType; count: number }[];
}

function CycleHistoryCard({
  data,
  isExpanded,
  onToggle,
}: {
  data: CycleHistoryData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { cycle, dateRange, adherence, logs, placements, periodDays, symptoms } = data;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dewpoint)] rounded-2xl"
      >
        <CardContent className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium truncate">{dateRange}</p>
              <span className="text-xs px-2 py-0.5 bg-[var(--background-secondary)] rounded-full whitespace-nowrap">
                {cycle.totalWeeks || 4} weeks
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className={adherence === 100 ? 'text-[var(--sweet-mint-dark)]' : 'text-[var(--foreground-secondary)]'}>
                {adherence === 100 ? '✓' : '○'}
              </span>
              <span className="text-[var(--foreground-secondary)]">
                {adherence}% adherence
              </span>
            </div>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-[var(--foreground-muted)] transition-transform duration-200 flex-shrink-0 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </CardContent>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] space-y-4">
          {/* Patch Timeline */}
          {logs.length > 0 && (
            <div className="pt-4">
              <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-2">
                Patch Changes
              </p>
              <div className="space-y-2">
                {logs.map((log) => {
                  const placementInfo = PLACEMENT_AREAS.find((p) => p.id === log.placement);
                  return (
                    <div key={log.id} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${log.onTime ? 'bg-[var(--sweet-mint)]' : 'bg-[var(--fairy-tale-dream)]'}`} />
                      <span className="text-[var(--foreground-secondary)]">
                        Week {log.week}
                      </span>
                      <span>·</span>
                      <span>{formatDate(log.date, 'MMM d')}</span>
                      {placementInfo && (
                        <>
                          <span>·</span>
                          <span className="text-[var(--foreground-secondary)]">
                            {placementInfo.icon} {placementInfo.label}
                          </span>
                        </>
                      )}
                      {!log.onTime && (
                        <span className="text-xs text-[var(--fairy-tale-dream-dark)]">
                          (late)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Placements Used */}
          {placements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-2">
                Placements Used
              </p>
              <div className="flex flex-wrap gap-2">
                {placements.map((placement) => {
                  const placementInfo = PLACEMENT_AREAS.find((p) => p.id === placement);
                  return placementInfo ? (
                    <span
                      key={placement}
                      className="text-sm px-2 py-1 bg-[var(--background-secondary)] rounded-lg"
                    >
                      {placementInfo.icon} {placementInfo.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Period Summary */}
          {periodDays > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-2">
                Period
              </p>
              <p className="text-sm">
                <Droplets className="w-4 h-4 inline text-[var(--fairy-tale-dream)] mr-1" />
                {periodDays} days logged
              </p>
            </div>
          )}

          {/* Common Symptoms */}
          {symptoms.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-2">
                Symptoms
              </p>
              <div className="flex flex-wrap gap-2">
                {symptoms.slice(0, 5).map((symptom) => {
                  const symptomInfo = SYMPTOM_OPTIONS.find((s) => s.id === symptom.type);
                  return symptomInfo ? (
                    <span
                      key={symptom.type}
                      className="text-sm px-2 py-1 bg-[var(--background-secondary)] rounded-lg"
                    >
                      {symptomInfo.icon} {symptomInfo.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {logs.length === 0 && placements.length === 0 && periodDays === 0 && symptoms.length === 0 && (
            <p className="text-sm text-[var(--foreground-muted)] pt-4">
              No detailed data logged for this cycle
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function StatsPage() {
  const { cycles, patchLogs, dailyLogs } = useAppStore();
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  // Calculate cycle history data
  const cycleHistory = useMemo((): CycleHistoryData[] => {
    const completedCycles = cycles
      .filter((c) => !c.isActive)
      .sort((a, b) => {
        // Sort by completedAt descending (most recent first)
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });

    return completedCycles.map((cycle) => {
      // Get logs for this cycle
      const cycleLogs = patchLogs.filter((l) => l.cycleId === cycle.id);
      const cycleDailyLogs = dailyLogs.filter((l) => l.cycleId === cycle.id);

      // Calculate adherence
      const onTimeLogs = cycleLogs.filter((l) => l.onTime).length;
      const adherence =
        cycleLogs.length > 0 ? Math.round((onTimeLogs / cycleLogs.length) * 100) : 100;

      // Get date range
      const startDate = formatDate(cycle.startDate, 'MMM d');
      const endDate = cycle.completedAt
        ? formatDate(cycle.completedAt, 'MMM d, yyyy')
        : formatDate(cycle.startDate, 'yyyy');
      const dateRange = `${startDate} - ${endDate}`;

      // Get unique placements
      const placements = [...new Set(cycleLogs.map((l) => l.placement).filter(Boolean))] as string[];

      // Count period days
      const periodDays = cycleDailyLogs.filter((l) => l.flow && l.flow !== 'none').length;

      // Get symptom counts
      const symptomCounts: Record<string, number> = {};
      cycleDailyLogs.forEach((log) => {
        log.symptoms.forEach((s) => {
          symptomCounts[s.type] = (symptomCounts[s.type] || 0) + 1;
        });
      });
      const symptoms = Object.entries(symptomCounts)
        .map(([type, count]) => ({ type: type as SymptomType, count }))
        .sort((a, b) => b.count - a.count);

      return {
        cycle,
        dateRange,
        adherence,
        logs: cycleLogs.sort((a, b) => a.week - b.week),
        placements,
        periodDays,
        symptoms,
      };
    });
  }, [cycles, patchLogs, dailyLogs]);

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

        {/* Past Cycles */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-[var(--dewpoint-dark)]" />
              <CardTitle>Past Cycles</CardTitle>
            </div>

            {cycleHistory.length > 0 ? (
              <div className="space-y-3">
                {cycleHistory.map((data) => (
                  <CycleHistoryCard
                    key={data.cycle.id}
                    data={data}
                    isExpanded={expandedCycleId === data.cycle.id}
                    onToggle={() =>
                      setExpandedCycleId(
                        expandedCycleId === data.cycle.id ? null : data.cycle.id
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                No completed cycles yet. Your cycle history will appear here.
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
