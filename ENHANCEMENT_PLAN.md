# Enhancement Plan: Smart Cycle Initialization & Flexibility

## Problem Statement

Current app behavior:
- Only logs the initial patch application date
- Doesn't auto-fill historical patch changes
- Doesn't allow changing the patch day mid-cycle
- Calendar doesn't show patch placement locations

## Required Changes

### 1. Auto-Fill Historical Patch Dates

**Scenario**: User downloads app on January 15th, but applied their first patch on December 17th, 2025.

**Expected behavior**:
```
Dec 17 (Week 1) → Patch Applied (auto-filled)
Dec 24 (Week 2) → Patch Changed (auto-filled)
Dec 31 (Week 3) → Patch Changed (auto-filled)
Jan 7-13 (Week 4) → Patch-Free Week (period)
Jan 14 (if new cycle started) → New cycle begins
```

**Logic**:
1. When user sets a start date in the past:
   - Calculate how many weeks have passed
   - Auto-generate patch logs for each week that has passed
   - Mark them as "auto-filled" so user knows they weren't manually logged
   - Correctly identify current week/day in cycle

2. Implementation in `startNewCycle()`:
   ```typescript
   // Calculate weeks since start date
   const daysSinceStart = differenceInDays(today, startDate);
   const weeksSinceStart = Math.floor(daysSinceStart / 7);

   // Auto-fill patch logs for past weeks
   for (let week = 1; week <= Math.min(weeksSinceStart, 3); week++) {
     const patchDate = addDays(startDate, (week - 1) * 7);
     // Create patch log with autoFilled: true
   }
   ```

### 2. Change Patch Day Mid-Cycle

**Scenario**: User normally changes patch on Wednesday, but forgot and changed on Friday instead.

**Options**:
a) **Shift permanently**: New patch day becomes Friday for rest of cycle
b) **One-time exception**: Log the late change but keep original patch day

**Recommended approach**:
- Allow logging patch change on any day
- Ask user: "Do you want to make [new day] your new patch change day?"
- If yes: Update cycle's `patchChangeDay`
- If no: Log as late change, keep calculating from original day

**UI Flow**:
1. User taps "Log Patch Change"
2. If not on patch change day, show options:
   - "I changed my patch today (update my schedule)"
   - "I changed late but want to keep my original day"

### 3. Calendar Placement Notes

**Current**: Calendar shows dots for patch changes
**Enhanced**: Tap on a day to see details including placement

**Implementation**:
- Already showing `patchLog` data on calendar day selection
- Add placement badge/text: "Applied on Upper Arm"
- Use placement icons in the day detail card

### 4. Data Model Changes

```typescript
// PatchLog - add autoFilled flag
interface PatchLog {
  id: string;
  cycleId: string;
  date: string;
  week: 1 | 2 | 3 | 4;
  action: 'applied' | 'changed' | 'removed';
  placement?: PlacementArea;
  onTime: boolean;
  autoFilled?: boolean;  // NEW: true if system-generated
  lateChange?: boolean;  // NEW: true if changed on wrong day
}

// Cycle - patchChangeDay can now be updated
interface Cycle {
  id: string;
  startDate: string;
  patchChangeDay: number;  // Can be updated mid-cycle
  originalPatchChangeDay?: number;  // NEW: preserve original if changed
  isActive: boolean;
  completedAt?: string;
}
```

## Implementation Steps

### Step 1: Update Types
- Add `autoFilled` and `lateChange` to PatchLog
- Add `originalPatchChangeDay` to Cycle

### Step 2: Update `startNewCycle` Logic
- Accept placement for first patch
- Calculate weeks since start date
- Auto-generate historical patch logs (without placement - mark as auto-filled)
- Only decrement inventory for the initial patch (not auto-filled ones)

### Step 3: Create "Change Patch Day" Feature
- Add UI in home page or settings to change patch day
- Update cycle's patchChangeDay
- Recalculate next change dates

### Step 4: Update Onboarding
- After selecting date, if date is in past:
  - Show summary: "Based on your start date, you're currently in Week X"
  - Ask for current patch placement (if in weeks 1-3)
  - Confirm auto-filled history

### Step 5: Update Calendar View
- Show placement info in day details
- Distinguish auto-filled vs manually logged entries
- Add visual indicator for late changes

### Step 6: Update Home Dashboard
- Handle "catching up" scenario where multiple weeks passed
- Show appropriate next action based on current week

## Files to Modify

1. `src/types/index.ts` - Add new fields
2. `src/lib/store.ts` - Update startNewCycle logic
3. `src/lib/cycle-utils.ts` - Add helper functions
4. `src/components/Onboarding.tsx` - Handle past dates
5. `src/app/page.tsx` - Add change patch day option
6. `src/app/calendar/page.tsx` - Show placement in details
7. `src/components/NextActionCard.tsx` - Update for current state

## Edge Cases to Handle

1. **Start date more than 28 days ago**: Start new cycle from today
2. **Multiple cycles in past**: Only create one historical cycle
3. **Period week selected as start**: Invalid - prompt user
4. **Inventory management**: Don't decrement for auto-filled logs
5. **Statistics**: Mark auto-filled entries differently in stats
