import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts degrees to radians.
 * @param degrees Angle in degrees.
 * @returns Angle in radians.
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees.
 * @param radians Angle in radians.
 * @returns Angle in degrees.
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculates the great-circle distance between two points using the haversine formula
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const phi1 = degreesToRadians(lat1);
  const phi2 = degreesToRadians(lat2);
  const deltaPhi = degreesToRadians(lat2 - lat1);
  const deltaLambda = degreesToRadians(lon2 - lon1);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Improved bearing calculation using great circle path
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Initial bearing in degrees (0-360)
 */
export function calculateBearing(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): number {
  // Convert to radians
  const lat1 = degreesToRadians(startLat);
  const lat2 = degreesToRadians(destLat);
  const dLng = degreesToRadians(destLng - startLng);

  // Calculate bearing
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
           Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let bearing = Math.atan2(y, x);

  // Convert to degrees
  bearing = radiansToDegrees(bearing);
  
  // Normalize to 0-360
  return (bearing + 360) % 360;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate time difference between user's timezone and IST
 * @returns Hours difference (positive if user is ahead of IST)
 */
export function calculateTimeDifference(): number {
  const userTime = new Date();
  const istTime = new Date(userTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return (istTime.getTime() - userTime.getTime()) / (1000 * 60 * 60);
}

/**
 * Get user's detected timezone
 * @returns IANA timezone identifier
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect timezone, defaulting to UTC:', error);
    return 'UTC';
  }
}

/**
 * Convert a time to user's timezone
 * @param date Date to convert
 * @param timezone Target timezone (defaults to user's timezone)
 * @returns Date in the target timezone
 */
export function convertToUserTimezone(date: Date, timezone?: string): Date {
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
}

/**
 * Get current time in a specific timezone
 * @param timezone Target timezone (defaults to user's timezone)
 * @returns Current time in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone?: string): Date {
  const userTimezone = timezone || getUserTimezone();
  
  try {
    return new Date(new Date().toLocaleString('en-US', { timeZone: userTimezone }));
  } catch (error) {
    console.warn('Failed to get current time in timezone, using local time:', error);
    return new Date();
  }
}

/**
 * Schedule a timezone-aware alarm
 * @param targetTime The time to trigger the alarm
 * @param title Notification title
 * @param body Notification body
 * @param timezone Target timezone (defaults to user's timezone)
 * @returns Timer ID for cancellation
 */
export function scheduleTimezoneAwareAlarm(
  targetTime: Date,
  title: string,
  body: string,
  timezone?: string
): number | null {
  try {
    const userTimezone = timezone || getUserTimezone();
    const currentTime = getCurrentTimeInTimezone(userTimezone);
    const alarmTime = convertToUserTimezone(targetTime, userTimezone);
    
    const millisecondsUntilAlarm = alarmTime.getTime() - currentTime.getTime();
    
    if (millisecondsUntilAlarm <= 0) {
      console.warn('Alarm time is in the past, not scheduling');
      return null;
    }
    
    console.log(`Scheduling alarm for ${alarmTime.toLocaleString()} (${userTimezone})`);
    
    return window.setTimeout(() => {
      // Check if browser supports notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: `${body} (${userTimezone})`,
          icon: '/favicon.ico',
          requireInteraction: true,
        });
        
        // Play alarm sound if available
        try {
          const alarmAudio = new Audio('/audio/alarm-tone.mp3');
          alarmAudio.play().catch(e => 
            console.warn("Audio play failed (user interaction might be needed, or file missing):", e)
          );
        } catch (error) {
          console.warn("Error playing alarm sound:", error);
        }
      } else {
        console.warn('Notifications not supported or permission not granted');
      }
    }, millisecondsUntilAlarm);
    
  } catch (error) {
    console.error('Failed to schedule timezone-aware alarm:', error);
    return null;
  }
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
