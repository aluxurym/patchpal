import type { CycleLength } from '@/types';

// Default cycle constants (standard 4-week cycle)
export const DEFAULT_CYCLE_LENGTH = 28;
export const CYCLE_LENGTH = 28; // Kept for backwards compatibility
export const PATCH_WEEKS = 3;
export const PATCH_FREE_WEEK = 4;
export const DAYS_PER_WEEK = 7;
export const PATCHES_PER_BOX = 3;

// Extended cycle support
export const MIN_CYCLE_WEEKS = 4;
export const MAX_CYCLE_WEEKS = 6;

// Helper to calculate cycle length in days from total weeks
export const getCycleLengthDays = (totalWeeks: CycleLength): number => totalWeeks * DAYS_PER_WEEK;

// Helper to get number of patch weeks (always totalWeeks - 1)
export const getPatchWeeksCount = (totalWeeks: CycleLength): number => totalWeeks - 1;

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

export const DAY_NAMES_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;

export const PLACEMENT_AREAS = [
  { id: 'arm', label: 'Upper Arm', icon: '💪' },
  { id: 'abdomen', label: 'Abdomen', icon: '🫄' },
  { id: 'buttock', label: 'Buttock', icon: '🍑' },
  { id: 'back', label: 'Back', icon: '🔙' }
] as const;

export const FLOW_OPTIONS = [
  { id: 'none', label: 'None', color: 'var(--dewpoint-light)' },
  { id: 'light', label: 'Light', color: 'var(--fairy-tale-dream-light)' },
  { id: 'medium', label: 'Medium', color: 'var(--fairy-tale-dream)' },
  { id: 'heavy', label: 'Heavy', color: 'var(--fairy-tale-dream-dark)' }
] as const;

export const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'neutral', label: 'Neutral', emoji: '😐' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
  { id: 'irritable', label: 'Irritable', emoji: '😤' }
] as const;

export const SYMPTOM_OPTIONS = [
  { id: 'cramps', label: 'Cramps', icon: '🤕' },
  { id: 'headache', label: 'Headache', icon: '🤯' },
  { id: 'breast_tenderness', label: 'Breast Tenderness', icon: '💔' },
  { id: 'nausea', label: 'Nausea', icon: '🤢' },
  { id: 'bloating', label: 'Bloating', icon: '🎈' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'mood_swings', label: 'Mood Swings', icon: '🎭' },
  { id: 'acne', label: 'Acne', icon: '😣' }
] as const;

// Static week labels (for backwards compatibility)
export const WEEK_LABELS: Record<number, string> = {
  1: 'Week 1 - New Patch',
  2: 'Week 2 - Change Patch',
  3: 'Week 3 - Change Patch',
  4: 'Week 4 - Change Patch', // Extended week OR patch-free depending on cycle
  5: 'Week 5 - Change Patch', // Extended week OR patch-free depending on cycle
  6: 'Week 6 - Patch Free'    // Always patch-free for 6-week cycles
};

// Static week descriptions (for backwards compatibility)
export const WEEK_DESCRIPTIONS: Record<number, string> = {
  1: 'Apply your first patch of the cycle',
  2: 'Change to a new patch',
  3: 'Change to your last patch',
  4: 'No patch this week - period expected',
  5: 'No patch this week - period expected',
  6: 'No patch this week - period expected'
};

// Dynamic week label based on cycle length
export const getWeekLabel = (week: number, totalWeeks: CycleLength): string => {
  const isPatchFreeWeek = week === totalWeeks;

  if (isPatchFreeWeek) {
    return `Week ${week} - Patch Free`;
  }

  if (week === 1) {
    return 'Week 1 - New Patch';
  }

  // Extended weeks (4, 5 in longer cycles)
  if (week > 3) {
    return `Week ${week} - Extended Patch`;
  }

  return `Week ${week} - Change Patch`;
};

// Dynamic week description based on cycle length
export const getWeekDescription = (week: number, totalWeeks: CycleLength): string => {
  const isPatchFreeWeek = week === totalWeeks;

  if (isPatchFreeWeek) {
    return 'No patch this week - period expected';
  }

  if (week === 1) {
    return 'Apply your first patch of the cycle';
  }

  // Check if this is the last patch week before patch-free
  if (week === totalWeeks - 1) {
    return 'Change to your last patch';
  }

  // Extended weeks
  if (week > 3) {
    const weeksUntilPeriod = totalWeeks - week;
    return `Extended patch week - ${weeksUntilPeriod} week${weeksUntilPeriod > 1 ? 's' : ''} until period`;
  }

  return 'Change to a new patch';
};
