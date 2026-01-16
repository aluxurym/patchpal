import Dexie, { Table } from 'dexie';
import type { Cycle, PatchLog, DailyLog, Inventory, Settings } from '@/types';

class PatchPalDB extends Dexie {
  cycles!: Table<Cycle>;
  patchLogs!: Table<PatchLog>;
  dailyLogs!: Table<DailyLog>;
  inventory!: Table<Inventory>;
  settings!: Table<Settings>;

  constructor() {
    super('patchpal');

    // Version 1 - original schema
    this.version(1).stores({
      cycles: 'id, startDate, isActive',
      patchLogs: 'id, cycleId, date, week',
      dailyLogs: 'id, date, cycleId',
      inventory: 'id',
      settings: 'id'
    });

    // Version 2 - add totalWeeks for extended cycles
    this.version(2).stores({
      cycles: 'id, startDate, isActive, totalWeeks',
      patchLogs: 'id, cycleId, date, week',
      dailyLogs: 'id, date, cycleId',
      inventory: 'id',
      settings: 'id'
    }).upgrade(tx => {
      // Set default totalWeeks: 4 for existing cycles
      return tx.table('cycles').toCollection().modify(cycle => {
        if (cycle.totalWeeks === undefined) {
          cycle.totalWeeks = 4;
        }
      });
    });
  }
}

// Only create database instance in browser
let db: PatchPalDB;

function getDB(): PatchPalDB {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in browser');
  }
  if (!db) {
    db = new PatchPalDB();
  }
  return db;
}

// Export a proxy that lazily initializes the database
export { getDB as db };

// For direct access when we know we're in browser
export function getDatabase(): PatchPalDB {
  return getDB();
}

// Initialize default settings if not exists
export async function initializeDB() {
  if (typeof window === 'undefined') {
    return;
  }

  const database = getDB();

  try {
    const settingsCount = await database.settings.count();
    if (settingsCount === 0) {
      await database.settings.add({
        id: 'default',
        notificationsEnabled: false,
        reminderTime: '09:00',
        lowStockThreshold: 1,
        onboardingComplete: false
      });
    }

    const inventoryCount = await database.inventory.count();
    if (inventoryCount === 0) {
      await database.inventory.add({
        id: 'default',
        patchesRemaining: 3,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to initialize DB:', error);
    throw error;
  }
}

// Helper functions
export async function getActiveCycle(): Promise<Cycle | undefined> {
  const database = getDB();
  return await database.cycles.where('isActive').equals(1).first();
}

export async function getSettings(): Promise<Settings> {
  const database = getDB();
  const settings = await database.settings.get('default');
  if (!settings) {
    await initializeDB();
    return (await database.settings.get('default'))!;
  }
  return settings;
}

export async function getInventory(): Promise<Inventory> {
  const database = getDB();
  const inventory = await database.inventory.get('default');
  if (!inventory) {
    await initializeDB();
    return (await database.inventory.get('default'))!;
  }
  return inventory;
}

export async function getPatchLogsForCycle(cycleId: string): Promise<PatchLog[]> {
  const database = getDB();
  return await database.patchLogs.where('cycleId').equals(cycleId).toArray();
}

export async function getDailyLogsForDateRange(startDate: string, endDate: string): Promise<DailyLog[]> {
  const database = getDB();
  return await database.dailyLogs
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getDailyLogForDate(date: string): Promise<DailyLog | undefined> {
  const database = getDB();
  return await database.dailyLogs.where('date').equals(date).first();
}

export async function getAllCycles(): Promise<Cycle[]> {
  const database = getDB();
  return await database.cycles.orderBy('startDate').reverse().toArray();
}

export async function getAllPatchLogs(): Promise<PatchLog[]> {
  const database = getDB();
  return await database.patchLogs.orderBy('date').reverse().toArray();
}

export async function getAllDailyLogs(): Promise<DailyLog[]> {
  const database = getDB();
  return await database.dailyLogs.orderBy('date').reverse().toArray();
}
