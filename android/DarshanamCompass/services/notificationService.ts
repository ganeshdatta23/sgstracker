import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { calculateSunTimes, getNextSunEvent } from '../utils/sunCalculator';

// Timezone utility functions
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const convertToUserTimezone = (date: Date, timezone: string): Date => {
  // API already returns times in the location's timezone, so we just need to create
  // a proper Date object that represents the correct time
  return new Date(date.getTime());
};

export const getCurrentTimeInTimezone = (timezone: string): Date => {
  return new Date();
};

// Configure notification settings
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Cancel all scheduled sun-related notifications
export const cancelSunAlarms = async (): Promise<void> => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const sunAlarmIds = scheduledNotifications
      .filter(notif => 
        notif.identifier.includes('sunrise') || 
        notif.identifier.includes('sunset')
      )
      .map(notif => notif.identifier);
    
    if (sunAlarmIds.length > 0) {
      for (const id of sunAlarmIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      console.log(`🗑️  Cancelled ${sunAlarmIds.length} existing sun alarms`);
    }
  } catch (error) {
    console.error('Error cancelling sun alarms:', error);
  }
};

// Schedule a notification for the next sunrise or sunset
export const scheduleSunAlarms = async (
  latitude: number, 
  longitude: number
): Promise<void> => {
  try {
    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions denied');
    }

    // Cancel any existing sun alarms
    await cancelSunAlarms();

    const timezone = getUserTimezone();
    console.log('📍 Scheduling alarms for location:', { latitude, longitude });
    console.log('🕰️  User timezone:', timezone);

    // Get today's and tomorrow's sun times to schedule multiple alarms
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayTimes, tomorrowTimes] = await Promise.all([
      calculateSunTimes(latitude, longitude, today),
      calculateSunTimes(latitude, longitude, tomorrow)
    ]);

    const currentTime = getCurrentTimeInTimezone(timezone);
    
    // Convert sun times to user timezone
    const todaySunrise = convertToUserTimezone(todayTimes.sunrise, timezone);
    const todaySunset = convertToUserTimezone(todayTimes.sunset, timezone);
    const tomorrowSunrise = convertToUserTimezone(tomorrowTimes.sunrise, timezone);
    
    const alarmsToSchedule = [];

    // Check what's still coming today
    if (currentTime < todaySunrise) {
      alarmsToSchedule.push({
        time: todaySunrise,
        type: 'sunrise' as const,
        day: 'today' as const
      });
    }
    
    if (currentTime < todaySunset) {
      alarmsToSchedule.push({
        time: todaySunset,
        type: 'sunset' as const,
        day: 'today' as const
      });
    }
    
    // Always add tomorrow's sunrise
    alarmsToSchedule.push({
      time: tomorrowSunrise,
      type: 'sunrise' as const,
      day: 'tomorrow' as const
    });

    console.log('⏰ Scheduling alarms:', alarmsToSchedule.map(alarm => ({
      type: alarm.type,
      day: alarm.day,
      time: alarm.time.toLocaleString(),
      timezone: alarm.time.toLocaleString('en-US', { timeZoneName: 'short' })
    })));

    // Schedule each alarm
    for (const alarm of alarmsToSchedule) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.type === 'sunrise' ? '🌅 Sunrise Time' : '🌇 Sunset Time',
          body: `${alarm.type === 'sunrise' ? 'Sunrise' : 'Sunset'} is happening now!`,
          sound: true,
        },
        trigger: { date: alarm.time },
      });

      console.log(`✅ Scheduled ${alarm.type} alarm for ${alarm.day} at ${alarm.time.toLocaleString()} (ID: ${identifier})`);
    }

  } catch (error) {
    console.error('❌ Error scheduling sun alarms:', error);
    throw error;
  }
};

// Test function to get next sunrise/sunset
export const getNextSunNotification = async (
  latitude: number,
  longitude: number
): Promise<{ time: Date; type: 'sunrise' | 'sunset' }> => {
  return await getNextSunEvent(latitude, longitude);
}; 