import {
  differenceInDays,
  addDays,
  startOfDay,
  format,
  getDay,
  isSameDay,
  isAfter,
  isBefore,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subDays,
  isToday
} from 'date-fns';
import type { Cycle, CycleStatus, PatchLog, CalendarDay, DailyLog, PlacementArea, CycleLength } from '@/types';
import { CYCLE_LENGTH, DAYS_PER_WEEK, DAY_NAMES, getCycleLengthDays, getPatchWeeksCount, MAX_CYCLE_WEEKS } from './constants';

/**
 * Calculate the current status of a cycle
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function getCycleStatus(cycle: Cycle, referenceDate: Date = new Date()): CycleStatus {
  const startDate = new Date(cycle.startDate);
  const today = startOfDay(referenceDate);
  const cycleStart = startOfDay(startDate);

  // Use cycle's totalWeeks (default to 4 for backwards compatibility)
  const totalWeeks: CycleLength = cycle.totalWeeks || 4;
  const cycleLength = getCycleLengthDays(totalWeeks);

  // Calculate day in cycle (1 to cycleLength)
  let dayInCycle = differenceInDays(today, cycleStart) + 1;

  // Check if cycle has ended (more than cycle length days)
  const isNewCycleNeeded = dayInCycle > cycleLength;

  // Handle if we're past cycle length
  if (dayInCycle > cycleLength) {
    dayInCycle = ((dayInCycle - 1) % cycleLength) + 1;
  }
  if (dayInCycle < 1) {
    dayInCycle = 1;
  }

  // Calculate current week (1 to totalWeeks)
  const currentWeek = Math.ceil(dayInCycle / DAYS_PER_WEEK);

  // Patch-free week is always the LAST week
  const isPatchFreeWeek = currentWeek === totalWeeks;

  // Can extend if in week 3 and cycle length is less than 6
  const canExtend = currentWeek === 3 && totalWeeks < MAX_CYCLE_WEEKS;

  // Can cancel extension if in an extended patch week (week 4+ but not the last week)
  const canCancelExtension = totalWeeks > 4 && currentWeek > 3 && currentWeek < totalWeeks;

  // Calculate day within the current week (1-7)
  const dayInWeek = ((dayInCycle - 1) % DAYS_PER_WEEK) + 1;

  // Calculate next change date based on the patch change day setting
  const todayDayOfWeek = getDay(today);
  let daysUntilNextChange = cycle.patchChangeDay - todayDayOfWeek;
  if (daysUntilNextChange < 0) {
    daysUntilNextChange += 7; // Move to next week
  }
  const nextChangeDate = addDays(today, daysUntilNextChange);

  // Determine next action
  let nextAction: 'apply' | 'change' | 'remove' | 'start_new_cycle';
  if (isNewCycleNeeded || (currentWeek === totalWeeks && dayInWeek >= 7)) {
    nextAction = 'start_new_cycle';
  } else if (currentWeek === totalWeeks - 1 && dayInWeek === 7) {
    // Last patch week - remove patch
    nextAction = 'remove';
  } else if (currentWeek === 1 && dayInWeek === 1) {
    nextAction = 'apply';
  } else {
    nextAction = 'change';
  }

  return {
    currentWeek,
    dayInCycle,
    daysUntilNextChange: daysUntilNextChange > 7 ? 0 : daysUntilNextChange,
    nextChangeDate,
    isPatchFreeWeek,
    nextAction,
    patchChangeDay: DAY_NAMES[cycle.patchChangeDay],
    isNewCycleNeeded,
    totalWeeks,
    canExtend,
    canCancelExtension
  };
}

/**
 * Calculate how many complete weeks have passed since a date
 */
export function getWeeksSinceDate(startDate: Date, referenceDate: Date = new Date()): number {
  const days = differenceInDays(startOfDay(referenceDate), startOfDay(startDate));
  return Math.floor(days / 7);
}

/**
 * Generate auto-fill patch logs for past weeks
 * Returns array of patch logs that should be created
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function generateHistoricalPatchLogs(
  cycleId: string,
  startDate: Date,
  currentPlacement?: PlacementArea,
  totalWeeks: CycleLength = 4
): Omit<PatchLog, 'id'>[] {
  const today = startOfDay(new Date());
  const cycleStart = startOfDay(startDate);
  const weeksSinceStart = getWeeksSinceDate(startDate, today);

  // Patch weeks = totalWeeks - 1 (last week is always patch-free)
  const patchWeeks = getPatchWeeksCount(totalWeeks);

  const logs: Omit<PatchLog, 'id'>[] = [];

  // Generate logs for all patch weeks (1 to patchWeeks) that have passed
  for (let week = 1; week <= Math.min(weeksSinceStart + 1, patchWeeks); week++) {
    const patchDate = addDays(cycleStart, (week - 1) * 7);

    // Only create log if the date is in the past or today
    if (isBefore(patchDate, today) || isSameDay(patchDate, today)) {
      const isCurrentWeek = week === weeksSinceStart + 1;

      logs.push({
        cycleId,
        date: format(patchDate, 'yyyy-MM-dd'),
        week: week as 1 | 2 | 3 | 4 | 5 | 6,
        action: week === 1 ? 'applied' : 'changed',
        // Only set placement for current week if provided
        placement: isCurrentWeek ? currentPlacement : undefined,
        onTime: true,
        autoFilled: !isCurrentWeek // Mark past weeks as auto-filled
      });
    }
  }

  return logs;
}

/**
 * Get the week number for a specific date in a cycle
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function getWeekForDate(cycle: Cycle, date: Date): number | null {
  const startDate = new Date(cycle.startDate);
  const targetDate = startOfDay(date);
  const cycleStart = startOfDay(startDate);

  // Use cycle's totalWeeks (default to 4 for backwards compatibility)
  const totalWeeks = cycle.totalWeeks || 4;
  const cycleLength = getCycleLengthDays(totalWeeks);
  const cycleEnd = addDays(cycleStart, cycleLength - 1);

  if (isBefore(targetDate, cycleStart) || isAfter(targetDate, cycleEnd)) {
    return null;
  }

  const dayInCycle = differenceInDays(targetDate, cycleStart) + 1;
  return Math.ceil(dayInCycle / DAYS_PER_WEEK);
}

/**
 * Check if a date is a patch change day
 */
export function isPatchChangeDay(cycle: Cycle, date: Date): boolean {
  const dayOfWeek = getDay(date);
  return dayOfWeek === cycle.patchChangeDay;
}

/**
 * Get all patch change dates for a cycle
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function getPatchChangeDates(cycle: Cycle): Date[] {
  const startDate = new Date(cycle.startDate);
  const totalWeeks = cycle.totalWeeks || 4;
  const patchWeeks = getPatchWeeksCount(totalWeeks);
  const dates: Date[] = [];

  // Generate dates for each patch week
  for (let week = 1; week <= patchWeeks; week++) {
    dates.push(addDays(startOfDay(startDate), (week - 1) * 7));
  }

  // Add the start of patch-free week (remove date)
  dates.push(addDays(startOfDay(startDate), patchWeeks * 7));

  return dates;
}

/**
 * Calculate cycle end date
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function getCycleEndDate(cycle: Cycle): Date {
  const totalWeeks = cycle.totalWeeks || 4;
  const cycleLength = getCycleLengthDays(totalWeeks);
  return addDays(new Date(cycle.startDate), cycleLength - 1);
}

/**
 * Generate calendar days for a month with cycle data
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function generateCalendarDays(
  year: number,
  month: number,
  cycles: Cycle[],
  patchLogs: PatchLog[],
  dailyLogs: DailyLog[]
): CalendarDay[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));

  // Get the start of the calendar (include days from previous month to fill the week)
  const calendarStart = subDays(monthStart, getDay(monthStart));
  // Get the end of the calendar (include days from next month to fill the week)
  const daysToAdd = 6 - getDay(monthEnd);
  const calendarEnd = addDays(monthEnd, daysToAdd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = startOfDay(new Date());

  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Find which cycle this date belongs to
    let cycleWeek: number | undefined;
    let isPatchFreeWeek = false;
    let isExtendedWeek = false;

    for (const cycle of cycles) {
      const week = getWeekForDate(cycle, date);
      if (week !== null) {
        const totalWeeks = cycle.totalWeeks || 4;
        cycleWeek = week;
        isPatchFreeWeek = week === totalWeeks;
        // Extended week is any week 4+ that's not the patch-free week
        isExtendedWeek = week > 3 && !isPatchFreeWeek;
        break;
      }
    }

    // Find patch log for this date
    const patchLog = patchLogs.find(log => log.date === dateStr);

    // Find daily log for this date
    const dailyLog = dailyLogs.find(log => log.date === dateStr);

    return {
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      patchLog,
      dailyLog,
      cycleWeek,
      isPatchFreeWeek,
      isExtendedWeek
    };
  });
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr);
}

/**
 * Get the next cycle start date based on current cycle
 */
export function getNextCycleStartDate(currentCycle: Cycle): Date {
  const currentEnd = getCycleEndDate(currentCycle);
  return addDays(currentEnd, 1);
}

/**
 * Create a new cycle starting from a date
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function createNewCycle(startDate: Date, id: string, totalWeeks: CycleLength = 4): Cycle {
  return {
    id,
    startDate: format(startOfDay(startDate), 'yyyy-MM-dd'),
    patchChangeDay: getDay(startDate),
    isActive: true,
    totalWeeks
  };
}

/**
 * Check if it's time to start a new cycle
 */
export function shouldStartNewCycle(cycle: Cycle): boolean {
  const status = getCycleStatus(cycle);
  return status.isNewCycleNeeded;
}

/**
 * Get suggested next placement (rotation)
 */
export function getSuggestedPlacement(lastPlacement?: string): PlacementArea {
  const placements: PlacementArea[] = ['arm', 'abdomen', 'buttock', 'back'];
  if (!lastPlacement) return 'arm';

  const currentIndex = placements.indexOf(lastPlacement as PlacementArea);
  const nextIndex = (currentIndex + 1) % placements.length;
  return placements[nextIndex];
}

/**
 * Check if a patch change is late (not on the scheduled day)
 */
export function isLateChange(cycle: Cycle, changeDate: Date): boolean {
  const dayOfWeek = getDay(changeDate);
  return dayOfWeek !== cycle.patchChangeDay;
}

/**
 * Calculate new patch change day if user changes on a different day
 */
export function getNewPatchChangeDay(changeDate: Date): number {
  return getDay(changeDate);
}

/**
 * Get summary of cycle status for display
 * Supports extended cycles (4, 5, or 6 weeks)
 */
export function getCycleSummary(startDate: Date, totalWeeks: CycleLength = 4): {
  currentWeek: number;
  weeksCompleted: number;
  isPatchFreeWeek: boolean;
  isExtendedWeek: boolean;
  message: string;
  totalWeeks: CycleLength;
} {
  const weeksSinceStart = getWeeksSinceDate(startDate);
  const patchWeeks = getPatchWeeksCount(totalWeeks);
  const currentWeek = Math.min(weeksSinceStart + 1, totalWeeks);
  const isPatchFreeWeek = currentWeek === totalWeeks;
  const isExtendedWeek = currentWeek > 3 && !isPatchFreeWeek;

  let message = '';
  if (currentWeek === 1) {
    message = "You're in Week 1 - patch applied";
  } else if (currentWeek === 2) {
    message = "You're in Week 2 - first patch change done";
  } else if (currentWeek === 3) {
    message = "You're in Week 3 - second patch change done";
  } else if (isExtendedWeek) {
    const weeksUntilPeriod = totalWeeks - currentWeek;
    message = `You're in Week ${currentWeek} (extended) - ${weeksUntilPeriod} week${weeksUntilPeriod > 1 ? 's' : ''} until period`;
  } else {
    message = `You're in Week ${currentWeek} - patch-free week (period)`;
  }

  return {
    currentWeek,
    weeksCompleted: Math.min(weeksSinceStart, patchWeeks),
    isPatchFreeWeek,
    isExtendedWeek,
    message,
    totalWeeks
  };
}
