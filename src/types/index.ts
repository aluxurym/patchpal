// Cycle length options (4 = standard, 5-6 = extended to delay period)
export type CycleLength = 4 | 5 | 6;

// Cycle represents one complete cycle (28-42 days depending on extension)
export interface Cycle {
  id: string;
  startDate: string; // ISO date string
  patchChangeDay: number; // 0 = Sunday, 1 = Monday, etc.
  originalPatchChangeDay?: number; // Preserved if user changes patch day mid-cycle
  isActive: boolean;
  completedAt?: string;
  totalWeeks: CycleLength; // 4, 5, or 6 weeks (default: 4)
  extensionCancelledAt?: string; // ISO timestamp if extension was cancelled early
}

// Individual patch application/change log
export interface PatchLog {
  id: string;
  cycleId: string;
  date: string;
  week: 1 | 2 | 3 | 4 | 5 | 6; // Extended to support 6-week cycles
  action: 'applied' | 'changed' | 'removed';
  placement?: PlacementArea;
  onTime: boolean;
  autoFilled?: boolean; // True if system-generated for past dates
  lateChange?: boolean; // True if changed on a different day than scheduled
}

export type PlacementArea = 'arm' | 'abdomen' | 'buttock' | 'back';

// Daily log for symptoms, mood, and flow
export interface DailyLog {
  id: string;
  date: string;
  cycleId?: string;
  flow?: FlowIntensity;
  symptoms: SymptomEntry[];
  mood?: Mood;
  notes?: string;
}

export type FlowIntensity = 'none' | 'light' | 'medium' | 'heavy';

export type Mood = 'happy' | 'neutral' | 'sad' | 'anxious' | 'irritable';

export interface SymptomEntry {
  type: SymptomType;
  severity: 1 | 2 | 3; // 1 = mild, 2 = moderate, 3 = severe
}

export type SymptomType =
  | 'cramps'
  | 'headache'
  | 'breast_tenderness'
  | 'nausea'
  | 'bloating'
  | 'fatigue'
  | 'mood_swings'
  | 'acne'
  | 'other';

// Inventory tracking
export interface Inventory {
  id: string;
  patchesRemaining: number;
  lastUpdated: string;
}

// App settings
export interface Settings {
  id: string;
  notificationsEnabled: boolean;
  reminderTime: string; // "HH:MM" format
  lowStockThreshold: number;
  onboardingComplete: boolean;
}

// Computed cycle status
export interface CycleStatus {
  currentWeek: number; // 1-6 depending on cycle length
  dayInCycle: number; // 1-28/35/42 depending on cycle length
  daysUntilNextChange: number;
  nextChangeDate: Date;
  isPatchFreeWeek: boolean;
  nextAction: 'apply' | 'change' | 'remove' | 'start_new_cycle';
  patchChangeDay: string; // Day name
  isNewCycleNeeded: boolean; // True if cycle has ended and new one needed
  totalWeeks: CycleLength; // Total weeks in this cycle (4, 5, or 6)
  canExtend: boolean; // True if user can extend cycle (week 3, < 6 weeks)
  canCancelExtension: boolean; // True if user can cancel extension early
}

// Statistics
export interface CycleStats {
  totalCycles: number;
  completedCycles: number;
  adherenceRate: number;
  currentStreak: number;
  averagePeriodLength: number;
  commonSymptoms: { type: SymptomType; count: number; percentage: number }[];
}

// Calendar day data
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  patchLog?: PatchLog;
  dailyLog?: DailyLog;
  cycleWeek?: number; // 1-6 depending on cycle length
  isPatchFreeWeek: boolean;
  isExtendedWeek?: boolean; // True for weeks 4+ in extended cycles (not patch-free)
}

// Cycle initialization data (from onboarding)
export interface CycleInitData {
  startDate: Date;
  currentPlacement?: PlacementArea; // Where patch is currently (if in weeks 1-3)
  firstPatchPlacement?: PlacementArea; // Where first patch was placed
  totalWeeks?: CycleLength; // Cycle length (4, 5, or 6 weeks)
}
