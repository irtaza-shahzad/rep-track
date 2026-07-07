import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useReminderPolling } from '@/hooks/useReminderPolling';
import { authStorage } from '@/infrastructure/storage/LocalStorageAdapter';

/**
 * Component that enables reminder polling for authenticated users on all screens.
 * Should be placed at the app root level to enable global reminder notifications.
 */
const ReminderPollingProvider = () => {
  const location = useLocation();
  const { clearShownReminders } = useReminderPolling();

  useEffect(() => {
    // Clear shown reminders when user navigates to login/welcome page
    const isAuthPage = location.pathname === '/' || location.pathname === '/login';
    
    // Check if user is authenticated
    const isAuthenticated = authStorage.isAuthenticated();

    if (isAuthPage || !isAuthenticated) {
      clearShownReminders();
    }
  }, [location.pathname, clearShownReminders]);

  return null; // This component doesn't render anything
};

export default ReminderPollingProvider;
