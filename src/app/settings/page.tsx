'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Header } from '@/components/Header';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import {
  Bell,
  Package,
  Trash2,
  Download,
  Info,
  ChevronRight,
  Shield,
  Heart,
  Calendar
} from 'lucide-react';
import { getDatabase } from '@/lib/db';
import { format } from 'date-fns';
import { DAY_NAMES } from '@/lib/constants';

function SettingsPage() {
  const { settings, inventory, activeCycle, updateSettings, updateInventory, changePatchDay, cycles, patchLogs, dailyLogs } = useAppStore();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPatchDayModal, setShowPatchDayModal] = useState(false);
  const [inventoryCount, setInventoryCount] = useState(inventory.patchesRemaining);
  const [selectedDay, setSelectedDay] = useState(activeCycle?.patchChangeDay ?? 0);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await updateSettings({ notificationsEnabled: true });
      }
    } else {
      await updateSettings({ notificationsEnabled: false });
    }
  };

  const handleResetData = async () => {
    const db = getDatabase();
    await db.cycles.clear();
    await db.patchLogs.clear();
    await db.dailyLogs.clear();
    await db.settings.update('default', { onboardingComplete: false });
    await db.inventory.update('default', { patchesRemaining: 3 });
    window.location.reload();
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      cycles,
      patchLogs,
      dailyLogs,
      settings,
      inventory
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patchpal-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInventorySave = async () => {
    await updateInventory(inventoryCount);
    setShowInventoryModal(false);
  };

  const handlePatchDaySave = async () => {
    await changePatchDay(selectedDay);
    setShowPatchDayModal(false);
  };

  return (
    <>
      <Header title="Settings" />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Notifications */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--fairy-tale-dream-light)] rounded-xl">
                  <Bell className="w-5 h-5 text-[var(--fairy-tale-dream-dark)]" />
                </div>
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Patch change reminders
                  </p>
                </div>
              </div>
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card hoverable onClick={() => {
          setInventoryCount(inventory.patchesRemaining);
          setShowInventoryModal(true);
        }}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--sweet-mint-light)] rounded-xl">
                  <Package className="w-5 h-5 text-[var(--sweet-mint-dark)]" />
                </div>
                <div>
                  <p className="font-medium">Inventory</p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    {inventory.patchesRemaining} patches remaining
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
            </div>
          </CardContent>
        </Card>

        {/* Patch Change Day */}
        {activeCycle && (
          <Card hoverable onClick={() => {
            setSelectedDay(activeCycle.patchChangeDay);
            setShowPatchDayModal(true);
          }}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--dewpoint-light)] rounded-xl">
                    <Calendar className="w-5 h-5 text-[var(--dewpoint-dark)]" />
                  </div>
                  <div>
                    <p className="font-medium">Patch Change Day</p>
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      {DAY_NAMES[activeCycle.patchChangeDay]}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Data */}
        <Card hoverable onClick={handleExportData}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--dewpoint-light)] rounded-xl">
                  <Download className="w-5 h-5 text-[var(--dewpoint-dark)]" />
                </div>
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Download your tracking history
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
            </div>
          </CardContent>
        </Card>

        {/* Reset Data */}
        <Card
          hoverable
          onClick={() => setShowResetModal(true)}
          className="border border-red-100"
        >
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-red-600">Reset All Data</p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Delete all tracking data
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <Card className="bg-[var(--dewpoint-light)]">
          <CardContent>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[var(--dewpoint-dark)] mt-0.5" />
              <div>
                <CardTitle className="text-[var(--dewpoint-dark)] text-base">
                  Your Privacy Matters
                </CardTitle>
                <CardDescription className="mt-1">
                  All your data is stored locally on your device. Nothing is sent to any server.
                  Your health information stays completely private.
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[var(--fairy-tale-dream-light)] rounded-xl">
                <Heart className="w-5 h-5 text-[var(--fairy-tale-dream)]" />
              </div>
              <div>
                <p className="font-display font-semibold">PatchPal</p>
                <p className="text-sm text-[var(--foreground-secondary)]">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Made with care to help you track your Evra contraceptive patch cycle.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset All Data?"
      >
        <div className="space-y-4">
          <p className="text-[var(--foreground-secondary)]">
            This will permanently delete all your tracking history, cycles, and logs.
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleResetData}
              className="!bg-red-500 hover:!bg-red-600"
            >
              Reset Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inventory Modal */}
      <Modal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        title="Update Inventory"
      >
        <div className="space-y-4">
          <p className="text-[var(--foreground-secondary)]">
            How many patches do you have?
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setInventoryCount(Math.max(0, inventoryCount - 1))}
              aria-label="Decrease patch count"
              className="w-12 h-12 rounded-full bg-[var(--background-secondary)] text-2xl font-bold tap-target hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dewpoint)] focus-visible:ring-offset-2"
            >
              -
            </button>
            <span className="text-4xl font-display font-bold w-16 text-center">
              {inventoryCount}
            </span>
            <button
              onClick={() => setInventoryCount(inventoryCount + 1)}
              aria-label="Increase patch count"
              className="w-12 h-12 rounded-full bg-[var(--background-secondary)] text-2xl font-bold tap-target hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dewpoint)] focus-visible:ring-offset-2"
            >
              +
            </button>
          </div>

          <Button fullWidth onClick={handleInventorySave}>
            Save
          </Button>
        </div>
      </Modal>

      {/* Patch Day Modal */}
      <Modal
        isOpen={showPatchDayModal}
        onClose={() => setShowPatchDayModal(false)}
        title="Change Patch Day"
      >
        <div className="space-y-4">
          <p className="text-[var(--foreground-secondary)]">
            Select your new patch change day. Future patches will be changed on this day.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {DAY_NAMES.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDay(index)}
                aria-pressed={selectedDay === index}
                className={`
                  p-3 rounded-xl text-sm font-medium transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dewpoint)] focus-visible:ring-offset-2
                  ${selectedDay === index
                    ? 'bg-[var(--dewpoint)] text-white'
                    : 'bg-[var(--background-secondary)] hover:bg-gray-200'
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {activeCycle?.originalPatchChangeDay !== undefined &&
           activeCycle.originalPatchChangeDay !== activeCycle.patchChangeDay && (
            <p className="text-xs text-[var(--foreground-muted)] text-center">
              Your original patch day was {DAY_NAMES[activeCycle.originalPatchChangeDay]}
            </p>
          )}

          <Button fullWidth onClick={handlePatchDaySave}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function Settings() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
