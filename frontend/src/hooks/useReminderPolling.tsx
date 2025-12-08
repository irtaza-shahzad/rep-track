import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { reminderService, Reminder } from '@/services/reminderService';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '@/infrastructure/storage/LocalStorageAdapter';
import { usePreferences } from '@/contexts/PreferencesContext';

const POLLING_INTERVAL = 60000; // 60 seconds
const ACTIVE_CHECK_CACHE_DURATION = 30000; // Cache active reminders check for 30 seconds
const SNOOZE_DURATION = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY_SNOOZED = 'reminder_snoozed_state';
const STORAGE_KEY_DISMISSED = 'reminder_dismissed_state';

// Helper: Load snoozed reminders from localStorage
const loadSnoozedState = (): Map<number, number> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SNOOZED);
    if (!stored) return new Map();
    const parsed = JSON.parse(stored) as Array<[number, number]>;
    const now = Date.now();
    // Filter out expired snoozes
    const active = parsed.filter(([_, snoozeUntil]) => now < snoozeUntil);
    return new Map(active);
  } catch {
    return new Map();
  }
};

// Helper: Save snoozed state to localStorage
const saveSnoozedState = (snoozedMap: Map<number, number>) => {
  try {
    const now = Date.now();
    // Only save non-expired snoozes
    const active = Array.from(snoozedMap.entries()).filter(([_, snoozeUntil]) => now < snoozeUntil);
    localStorage.setItem(STORAGE_KEY_SNOOZED, JSON.stringify(active));
  } catch (error) {
    console.error('Failed to save snooze state:', error);
  }
};

// Helper: Load dismissed reminders from localStorage
const loadDismissedState = (): Set<number> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored) as number[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
};

// Helper: Save dismissed state to localStorage
const saveDismissedState = (dismissedSet: Set<number>) => {
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(Array.from(dismissedSet)));
  } catch (error) {
    console.error('Failed to save dismissed state:', error);
  }
};

/**
 * Custom hook that polls the backend for active reminders and displays them as toast notifications.
 * 
 * Features:
 * - Polls /reminders/active every 60 seconds (only when authenticated)
 * - Shows each reminder only once per session (unless snoozed)
 * - Displays reminders as toast notifications with icons
 * - Provides snooze (15 min) and dismiss buttons
 * - Automatically clears shown reminders on logout (via cleanup function)
 */
export const useReminderPolling = () => {
  const navigate = useNavigate();
  const { formatTime } = usePreferences();
  const shownRemindersRef = useRef<Set<number>>(new Set());
  const dismissedRemindersRef = useRef<Set<number>>(loadDismissedState()); // Load from localStorage
  const snoozedRemindersRef = useRef<Map<number, number>>(loadSnoozedState()); // Load from localStorage
  const toastIdsRef = useRef<Map<number, string | number>>(new Map()); // reminderId -> toastId
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const handleSnooze = (reminderId: number) => {
    const snoozeUntil = Date.now() + SNOOZE_DURATION;
    snoozedRemindersRef.current.set(reminderId, snoozeUntil);
    saveSnoozedState(snoozedRemindersRef.current); // Persist to localStorage
    shownRemindersRef.current.delete(reminderId); // Remove from shown so it can appear again
  };

  const handleDismiss = (reminderId: number) => {
    // Mark as dismissed so it won't appear again in this active window
    dismissedRemindersRef.current.add(reminderId);
    saveDismissedState(dismissedRemindersRef.current); // Persist to localStorage
    shownRemindersRef.current.add(reminderId);
  };

  const displayReminderNotification = (reminder: Reminder) => {
    const toastId = toast(
      <div className="flex flex-col items-center gap-3 w-full py-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
          <Bell className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <h4 className="font-semibold text-base mb-1">{reminder.title}</h4>
          {reminder.scheduled_time && (
            <p className="text-xs text-primary font-medium mb-1">{formatTime(reminder.scheduled_time)}</p>
          )}
          {reminder.description && (
            <p className="text-xs text-muted-foreground">{reminder.description}</p>
          )}
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={() => {
              const thisToastId = toastIdsRef.current.get(reminder.id);
              if (thisToastId) {
                toast.dismiss(thisToastId);
                toastIdsRef.current.delete(reminder.id);
              }
              handleSnooze(reminder.id);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            Snooze 15min
          </button>
          <button
            onClick={() => {
              const thisToastId = toastIdsRef.current.get(reminder.id);
              if (thisToastId) {
                toast.dismiss(thisToastId);
                toastIdsRef.current.delete(reminder.id);
              }
              handleDismiss(reminder.id);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>,
      {
        duration: Infinity, // Don't auto-dismiss, let user choose
        position: 'top-center',
        className: 'w-80',
      }
    );
    
    // Store the toast ID for this reminder
    toastIdsRef.current.set(reminder.id, toastId);
  };

  const checkActiveReminders = async () => {
    // Only poll if user is authenticated
    if (!authStorage.isAuthenticated()) {
      return;
    }

    // Rate limiting: Don't check more frequently than cache duration
    const now = Date.now();
    if (now - lastCheckRef.current < ACTIVE_CHECK_CACHE_DURATION) {
      return; // Skip this check, too soon
    }
    lastCheckRef.current = now;

    try {
      const activeReminders = await reminderService.getActiveReminders();
      
      if (activeReminders && activeReminders.length > 0) {
        const now = Date.now();
        
        // Get current active reminder IDs
        const activeReminderIds = new Set(activeReminders.map(r => r.id));
        
        // Clean up dismissed reminders that are no longer in active window
        const dismissedToKeep = Array.from(dismissedRemindersRef.current).filter(id => 
          activeReminderIds.has(id)
        );
        if (dismissedToKeep.length !== dismissedRemindersRef.current.size) {
          dismissedRemindersRef.current = new Set(dismissedToKeep);
          saveDismissedState(dismissedRemindersRef.current);
        }
        
        activeReminders.forEach((reminder) => {
          // Skip if already dismissed in this session
          if (dismissedRemindersRef.current.has(reminder.id)) {
            return;
          }

          // Check if snoozed and still within snooze period
          const snoozeUntil = snoozedRemindersRef.current.get(reminder.id);
          if (snoozeUntil && now < snoozeUntil) {
            return; // Still snoozed, skip
          }
          
          // Remove from snoozed map if snooze period expired
          if (snoozeUntil && now >= snoozeUntil) {
            snoozedRemindersRef.current.delete(reminder.id);
            saveSnoozedState(snoozedRemindersRef.current);
          }

          // Only show if not already shown this session (or was snoozed and period expired)
          if (!shownRemindersRef.current.has(reminder.id)) {
            displayReminderNotification(reminder);
            shownRemindersRef.current.add(reminder.id);
          }
        });
      }
    } catch (error) {
      // Silently fail - don't show error toasts for reminder polling
      // This prevents spam if the user is offline or the server is down
      console.debug('Failed to check reminders:', error);
    }
  };

  useEffect(() => {
    // Only start polling if authenticated
    if (!authStorage.isAuthenticated()) {
      return;
    }

    // Check immediately on mount
    checkActiveReminders();

    // Then check every 60 seconds
    pollingIntervalRef.current = setInterval(checkActiveReminders, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [navigate]);

  // Return a function to clear shown reminders (useful for logout)
  return {
    clearShownReminders: () => {
      shownRemindersRef.current.clear();
      dismissedRemindersRef.current.clear(); // Clear dismissed data
      snoozedRemindersRef.current.clear(); // Clear snooze data
      toastIdsRef.current.clear(); // Clear toast ID mapping
      lastCheckRef.current = 0; // Reset rate limit on logout
      reminderService.invalidateCache(); // Clear reminder cache
      // Clear localStorage
      try {
        localStorage.removeItem(STORAGE_KEY_DISMISSED);
        localStorage.removeItem(STORAGE_KEY_SNOOZED);
      } catch (error) {
        console.error('Failed to clear reminder state from storage:', error);
      }
    },
    checkNow: async () => {
      lastCheckRef.current = 0; // Bypass rate limit for manual check
      await checkActiveReminders();
    },
  };
};
