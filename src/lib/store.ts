'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format, getDay } from 'date-fns';
import type {
  Cycle,
  PatchLog,
  DailyLog,
  Inventory,
  Settings,
  PlacementArea,
  FlowIntensity,
  Mood,
  SymptomEntry,
  CycleLength
} from '@/types';
import { getDatabase, initializeDB } from './db';
import { createNewCycle, generateHistoricalPatchLogs, isLateChange, getCycleSummary, getCycleStatus } from './cycle-utils';
import { PATCHES_PER_BOX, MAX_CYCLE_WEEKS, getPatchWeeksCount } from './constants';

interface AppState {
  // Data
  activeCycle: Cycle | null;
  cycles: Cycle[];
  patchLogs: PatchLog[];
  dailyLogs: DailyLog[];
  inventory: Inventory;
  settings: Settings;

  // UI State
  isLoading: boolean;
  isInitialized: boolean;
  selectedDate: string | null;

  // Actions
  initialize: () => Promise<void>;

  // Cycle actions
  startNewCycle: (startDate?: Date, currentPlacement?: PlacementArea, totalWeeks?: CycleLength) => Promise<void>;
  completeCycle: (cycleId: string) => Promise<void>;
  changePatchDay: (newDay: number) => Promise<void>;
  extendCycle: (additionalWeeks: 1 | 2) => Promise<void>;
  cancelCycleExtension: () => Promise<void>;

  // Patch log actions
  logPatchChange: (
    week: 1 | 2 | 3 | 4 | 5 | 6,
    action: 'applied' | 'changed' | 'removed',
    placement?: PlacementArea,
    date?: Date,
    updatePatchDay?: boolean
  ) => Promise<void>;
  updatePatchLogPlacement: (logId: string, placement: PlacementArea) => Promise<void>;

  // Daily log actions
  saveDailyLog: (
    date: string,
    data: {
      flow?: FlowIntensity;
      symptoms?: SymptomEntry[];
      mood?: Mood;
      notes?: string;
    }
  ) => Promise<void>;
  getDailyLog: (date: string) => DailyLog | undefined;
  markPeriodEnded: (endDate: string, flowIntensity: FlowIntensity) => Promise<{ filledDates: string[] }>;
  getLastFlowDate: () => { date: string; flow: FlowIntensity } | null;

  // Inventory actions
  updateInventory: (count: number) => Promise<void>;
  addNewBox: () => Promise<void>;
  incrementPatch: () => Promise<void>;
  decrementPatch: () => Promise<void>;

  // Settings actions
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // UI actions
  setSelectedDate: (date: string | null) => void;

  // Data refresh
  refreshData: () => Promise<void>;
}

const defaultSettings: Settings = {
  id: 'default',
  notificationsEnabled: false,
  reminderTime: '09:00',
  lowStockThreshold: 1,
  onboardingComplete: false
};

const defaultInventory: Inventory = {
  id: 'default',
  patchesRemaining: 3,
  lastUpdated: new Date().toISOString()
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeCycle: null,
      cycles: [],
      patchLogs: [],
      dailyLogs: [],
      inventory: defaultInventory,
      settings: defaultSettings,
      isLoading: true,
      isInitialized: false,
      selectedDate: null,

      // Initialize from IndexedDB
      initialize: async () => {
        if (typeof window === 'undefined') {
          return;
        }

        try {
          await initializeDB();
          const db = getDatabase();

          const [cycles, patchLogs, dailyLogs, settings, inventory] = await Promise.all([
            db.cycles.toArray(),
            db.patchLogs.toArray(),
            db.dailyLogs.toArray(),
            db.settings.get('default'),
            db.inventory.get('default')
          ]);

          const activeCycle = cycles.find(c => c.isActive) || null;

          set({
            cycles,
            patchLogs,
            dailyLogs,
            activeCycle,
            settings: settings || defaultSettings,
            inventory: inventory || defaultInventory,
            isLoading: false,
            isInitialized: true
          });
        } catch (error) {
          console.error('Failed to initialize:', error);
          set({ isLoading: false, isInitialized: true });
        }
      },

      // Start a new cycle with auto-fill for past dates
      // Supports extended cycles (4, 5, or 6 weeks)
      startNewCycle: async (startDate = new Date(), currentPlacement?: PlacementArea, totalWeeks: CycleLength = 4) => {
        const db = getDatabase();
        const state = get();

        // Complete any active cycle
        if (state.activeCycle) {
          await db.cycles.update(state.activeCycle.id, {
            isActive: false,
            completedAt: new Date().toISOString()
          });
        }

        // Create the new cycle with specified length
        const newCycle = createNewCycle(startDate, uuidv4(), totalWeeks);
        await db.cycles.add(newCycle);

        // Generate historical patch logs (auto-fill for past dates)
        const historicalLogs = generateHistoricalPatchLogs(
          newCycle.id,
          startDate,
          currentPlacement,
          totalWeeks
        );

        // Add all historical logs to database
        for (const logData of historicalLogs) {
          const patchLog: PatchLog = {
            ...logData,
            id: uuidv4()
          };
          await db.patchLogs.add(patchLog);
        }

        // Only decrement inventory by 1 (for the current patch)
        // Auto-filled past patches don't affect inventory
        const patchWeeks = getPatchWeeksCount(totalWeeks);
        const cycleSummary = getCycleSummary(startDate, totalWeeks);
        if (cycleSummary.currentWeek <= patchWeeks) {
          // Only decrement if we're in a patch week (not period week)
          const inventory = get().inventory;
          const newCount = Math.max(0, inventory.patchesRemaining - 1);
          await db.inventory.update('default', {
            patchesRemaining: newCount,
            lastUpdated: new Date().toISOString()
          });
        }

        await get().refreshData();
      },

      // Complete a cycle
      completeCycle: async (cycleId: string) => {
        const db = getDatabase();
        await db.cycles.update(cycleId, {
          isActive: false,
          completedAt: new Date().toISOString()
        });
        await get().refreshData();
      },

      // Change the patch day for the current cycle
      changePatchDay: async (newDay: number) => {
        const db = getDatabase();
        const state = get();
        if (!state.activeCycle) return;

        // Preserve original patch day if not already set
        const updateData: Partial<Cycle> = {
          patchChangeDay: newDay
        };

        if (state.activeCycle.originalPatchChangeDay === undefined) {
          updateData.originalPatchChangeDay = state.activeCycle.patchChangeDay;
        }

        await db.cycles.update(state.activeCycle.id, updateData);
        await get().refreshData();
      },

      // Extend the current cycle by 1 or 2 weeks
      extendCycle: async (additionalWeeks: 1 | 2) => {
        const db = getDatabase();
        const state = get();
        if (!state.activeCycle) return;

        const currentWeeks = state.activeCycle.totalWeeks || 4;
        const newTotalWeeks = Math.min(currentWeeks + additionalWeeks, MAX_CYCLE_WEEKS) as CycleLength;

        await db.cycles.update(state.activeCycle.id, {
          totalWeeks: newTotalWeeks
        });

        await get().refreshData();
      },

      // Cancel cycle extension - skip to patch-free week
      cancelCycleExtension: async () => {
        const db = getDatabase();
        const state = get();
        if (!state.activeCycle) return;

        const status = getCycleStatus(state.activeCycle);

        // Only cancel if we're in an extended patch week (canCancelExtension)
        if (status.canCancelExtension) {
          // Set cycle to end at next week (make next week the patch-free week)
          const newTotalWeeks = (status.currentWeek + 1) as CycleLength;

          await db.cycles.update(state.activeCycle.id, {
            totalWeeks: newTotalWeeks,
            extensionCancelledAt: new Date().toISOString()
          });
        }

        await get().refreshData();
      },

      // Log patch change with option to update patch day
      logPatchChange: async (week, action, placement, date = new Date(), updatePatchDay = false) => {
        const db = getDatabase();
        const state = get();
        if (!state.activeCycle) return;

        // Check if this is a late change
        const lateChange = isLateChange(state.activeCycle, date);

        const patchLog: PatchLog = {
          id: uuidv4(),
          cycleId: state.activeCycle.id,
          date: format(date, 'yyyy-MM-dd'),
          week,
          action,
          placement,
          onTime: !lateChange,
          lateChange
        };

        await db.patchLogs.add(patchLog);

        // Update patch day if requested
        if (updatePatchDay && lateChange) {
          await get().changePatchDay(getDay(date));
        }

        // Decrement inventory for new patches
        if (action === 'applied' || action === 'changed') {
          await get().decrementPatch();
        }

        await get().refreshData();
      },

      // Update placement for an existing patch log
      updatePatchLogPlacement: async (logId: string, placement: PlacementArea) => {
        const db = getDatabase();
        await db.patchLogs.update(logId, { placement });
        await get().refreshData();
      },

      // Save daily log
      saveDailyLog: async (date, data) => {
        const db = getDatabase();
        const state = get();
        const existingLog = state.dailyLogs.find(l => l.date === date);

        if (existingLog) {
          await db.dailyLogs.update(existingLog.id, {
            ...data,
            symptoms: data.symptoms || existingLog.symptoms
          });
        } else {
          const newLog: DailyLog = {
            id: uuidv4(),
            date,
            cycleId: state.activeCycle?.id,
            flow: data.flow,
            symptoms: data.symptoms || [],
            mood: data.mood,
            notes: data.notes
          };
          await db.dailyLogs.add(newLog);
        }

        await get().refreshData();
      },

      // Get daily log for date
      getDailyLog: (date: string) => {
        return get().dailyLogs.find(l => l.date === date);
      },

      // Get the last date with flow logged (not 'none')
      getLastFlowDate: () => {
        const state = get();
        const logsWithFlow = state.dailyLogs
          .filter(l => l.flow && l.flow !== 'none')
          .sort((a, b) => b.date.localeCompare(a.date));

        if (logsWithFlow.length === 0) return null;
        return { date: logsWithFlow[0].date, flow: logsWithFlow[0].flow! };
      },

      // Mark period ended and auto-fill days since last flow
      markPeriodEnded: async (endDate: string, flowIntensity: FlowIntensity) => {
        const db = getDatabase();
        const state = get();
        const lastFlowInfo = get().getLastFlowDate();

        if (!lastFlowInfo) {
          // No previous flow, just save the end date with the selected flow
          await get().saveDailyLog(endDate, { flow: flowIntensity });
          return { filledDates: [endDate] };
        }

        // Generate all dates between last flow date (exclusive) and end date (inclusive)
        const startDate = new Date(lastFlowInfo.date);
        const end = new Date(endDate);
        const filledDates: string[] = [];

        // Start from the day after last flow date
        let current = new Date(startDate);
        current.setDate(current.getDate() + 1);

        while (current <= end) {
          const dateStr = format(current, 'yyyy-MM-dd');
          const existingLog = state.dailyLogs.find(l => l.date === dateStr);

          if (existingLog) {
            // Update existing log with flow
            await db.dailyLogs.update(existingLog.id, { flow: flowIntensity });
          } else {
            // Create new log
            const newLog: DailyLog = {
              id: uuidv4(),
              date: dateStr,
              cycleId: state.activeCycle?.id,
              flow: flowIntensity,
              symptoms: []
            };
            await db.dailyLogs.add(newLog);
          }

          filledDates.push(dateStr);
          current.setDate(current.getDate() + 1);
        }

        await get().refreshData();
        return { filledDates };
      },

      // Update inventory count
      updateInventory: async (count: number) => {
        const db = getDatabase();
        await db.inventory.update('default', {
          patchesRemaining: Math.max(0, count),
          lastUpdated: new Date().toISOString()
        });
        await get().refreshData();
      },

      // Add new box of patches
      addNewBox: async () => {
        const db = getDatabase();
        const currentCount = get().inventory.patchesRemaining;
        await db.inventory.update('default', {
          patchesRemaining: currentCount + PATCHES_PER_BOX,
          lastUpdated: new Date().toISOString()
        });
        await get().refreshData();
      },

      // Increment patch count by 1
      incrementPatch: async () => {
        const db = getDatabase();
        const currentCount = get().inventory.patchesRemaining;
        await db.inventory.update('default', {
          patchesRemaining: currentCount + 1,
          lastUpdated: new Date().toISOString()
        });
        await get().refreshData();
      },

      // Decrement patch count
      decrementPatch: async () => {
        const db = getDatabase();
        const currentCount = get().inventory.patchesRemaining;
        await db.inventory.update('default', {
          patchesRemaining: Math.max(0, currentCount - 1),
          lastUpdated: new Date().toISOString()
        });
        await get().refreshData();
      },

      // Update settings
      updateSettings: async (newSettings: Partial<Settings>) => {
        const db = getDatabase();
        await db.settings.update('default', newSettings);
        await get().refreshData();
      },

      // Complete onboarding
      completeOnboarding: async () => {
        const db = getDatabase();
        await db.settings.update('default', { onboardingComplete: true });
        await get().refreshData();
      },

      // Set selected date
      setSelectedDate: (date: string | null) => {
        set({ selectedDate: date });
      },

      // Refresh all data from IndexedDB
      refreshData: async () => {
        const db = getDatabase();
        const [cycles, patchLogs, dailyLogs, settings, inventory] = await Promise.all([
          db.cycles.toArray(),
          db.patchLogs.toArray(),
          db.dailyLogs.toArray(),
          db.settings.get('default'),
          db.inventory.get('default')
        ]);

        const activeCycle = cycles.find(c => c.isActive) || null;

        set({
          cycles,
          patchLogs,
          dailyLogs,
          activeCycle,
          settings: settings || defaultSettings,
          inventory: inventory || defaultInventory
        });
      }
    }),
    {
      name: 'patchpal-store',
      partialize: (state) => ({
        selectedDate: state.selectedDate
      })
    }
  )
);
