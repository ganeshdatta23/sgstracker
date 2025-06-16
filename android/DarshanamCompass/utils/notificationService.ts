import * as Notifications from 'expo-notifications';
import { Coordinates } from './locationUtils';
import { calculateSunTimes, getNextSunEvent, formatSunTime } from './sunCalculator';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface AlarmSettings {
  enableSunrise: boolean;
  enableSunset: boolean;
  sunriseOffsetMinutes: number; // minutes before/after sunrise
  sunsetOffsetMinutes: number;  // minutes before/after sunset
  timezone?: string; // User's timezone (e.g., 'America/New_York', 'Asia/Kolkata')
}

const DEFAULT_SETTINGS: AlarmSettings = {
  enableSunrise: true,
  enableSunset: true,
  sunriseOffsetMinutes: -5, // 15 minutes before sunrise
  sunsetOffsetMinutes: -5,  // 15 minutes before sunset
  timezone: undefined, // Will auto-detect
};

// Get user's timezone
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect timezone, defaulting to UTC:', error);
    return 'UTC';
  }
};

// Convert time to user's timezone
export const convertToUserTimezone = (date: Date, timezone?: string): Date => {
  const userTimezone = timezone || getUserTimezone();
  
  try {
    // Create a date in the user's timezone
    const timeInUserTimezone = new Date(date.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Calculate the timezone offset difference
    const userTimezoneOffset = timeInUserTimezone.getTime() - date.getTime();
    
    // Apply the offset to get the correct local time
    return new Date(date.getTime() + userTimezoneOffset);
  } catch (error) {
    console.warn('Failed to convert timezone, using original time:', error);
    return date;
  }
};

// Get current time in user's timezone
export const getCurrentTimeInTimezone = (timezone?: string): Date => {
  const userTimezone = timezone || getUserTimezone();
  
  try {
    return new Date(new Date().toLocaleString('en-US', { timeZone: userTimezone }));
  } catch (error) {
    console.warn('Failed to get current time in timezone, using local time:', error);
    return new Date();
  }
};

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Schedule sunrise/sunset alarms
export const scheduleSunAlarms = async (
  targetLocation: Coordinates,
  settings: AlarmSettings = DEFAULT_SETTINGS
): Promise<{ success: boolean; scheduledCount: number; errors: string[]; timezone: string }> => {
  try {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const errors: string[] = [];
    let scheduledCount = 0;
    
    // Get user's timezone
    const userTimezone = settings.timezone || getUserTimezone();
    console.log(`Scheduling alarms for timezone: ${userTimezone}`);
    
    // Schedule for the next 7 days
    for (let day = 0; day < 7; day++) {
      // Create date in user's timezone
      const currentTime = getCurrentTimeInTimezone(userTimezone);
      const date = new Date(currentTime);
      date.setDate(date.getDate() + day);
      
      try {
        const sunTimes = calculateSunTimes(targetLocation, date);
        
        // Schedule sunrise alarm
        if (settings.enableSunrise) {
          const sunriseTime = convertToUserTimezone(sunTimes.sunrise, userTimezone);
          const sunriseAlarmTime = new Date(sunriseTime);
          sunriseAlarmTime.setMinutes(sunriseAlarmTime.getMinutes() + settings.sunriseOffsetMinutes);
          
          const currentTimeNow = getCurrentTimeInTimezone(userTimezone);
          if (sunriseAlarmTime > currentTimeNow) { // Only schedule future times
            const secondsUntilSunrise = Math.floor((sunriseAlarmTime.getTime() - currentTimeNow.getTime()) / 1000);
            
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🌅 Sunrise Darshanam',
                body: `Time for morning darshan! Sunrise at ${formatSunTime(sunriseTime)} (${userTimezone})`,
                sound: 'default',
                data: { 
                  type: 'sunrise', 
                  location: targetLocation,
                  timezone: userTimezone,
                  scheduledTime: sunriseAlarmTime.toISOString()
                },
              },
              trigger: { seconds: secondsUntilSunrise },
            });
            scheduledCount++;
            console.log(`Scheduled sunrise alarm for ${sunriseAlarmTime.toLocaleString()} (${userTimezone})`);
          }
        }
        
        // Schedule sunset alarm
        if (settings.enableSunset) {
          const sunsetTime = convertToUserTimezone(sunTimes.sunset, userTimezone);
          const sunsetAlarmTime = new Date(sunsetTime);
          sunsetAlarmTime.setMinutes(sunsetAlarmTime.getMinutes() + settings.sunsetOffsetMinutes);
          
          const currentTimeNow = getCurrentTimeInTimezone(userTimezone);
          if (sunsetAlarmTime > currentTimeNow) { // Only schedule future times
            const secondsUntilSunset = Math.floor((sunsetAlarmTime.getTime() - currentTimeNow.getTime()) / 1000);
            
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🌇 Sunset Darshanam',
                body: `Time for evening darshan! Sunset at ${formatSunTime(sunsetTime)} (${userTimezone})`,
                sound: 'default',
                data: { 
                  type: 'sunset', 
                  location: targetLocation,
                  timezone: userTimezone,
                  scheduledTime: sunsetAlarmTime.toISOString()
                },
              },
              trigger: { seconds: secondsUntilSunset },
            });
            scheduledCount++;
            console.log(`Scheduled sunset alarm for ${sunsetAlarmTime.toLocaleString()} (${userTimezone})`);
          }
        }
      } catch (dayError) {
        errors.push(`Day ${day}: ${dayError instanceof Error ? dayError.message : String(dayError)}`);
      }
    }
    
    return { success: true, scheduledCount, errors, timezone: userTimezone };
  } catch (error) {
    return { 
      success: false, 
      scheduledCount: 0, 
      errors: [error instanceof Error ? error.message : String(error)],
      timezone: getUserTimezone()
    };
  }
};

// Get next scheduled sun event with timezone consideration
export const getNextScheduledEvent = (targetLocation: Coordinates, timezone?: string) => {
  const userTimezone = timezone || getUserTimezone();
  const currentTime = getCurrentTimeInTimezone(userTimezone);
  return getNextSunEvent(targetLocation, currentTime);
};

// Cancel all sun alarms
export const cancelSunAlarms = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Get current alarm settings from storage (placeholder - could use AsyncStorage)
export const getAlarmSettings = (): AlarmSettings => {
  // In a real app, you'd load this from AsyncStorage
  return {
    ...DEFAULT_SETTINGS,
    timezone: getUserTimezone()
  };
};

// Save alarm settings (placeholder - could use AsyncStorage)
export const saveAlarmSettings = async (settings: AlarmSettings): Promise<void> => {
  // In a real app, you'd save this to AsyncStorage
  const settingsWithTimezone = {
    ...settings,
    timezone: settings.timezone || getUserTimezone()
  };
  console.log('Alarm settings saved:', settingsWithTimezone);
}; 