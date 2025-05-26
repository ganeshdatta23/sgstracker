import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

interface UseDeviceOrientationResult {
  heading: number | null;
  tiltX: number | null;  // beta
  tiltY: number | null;  // gamma
  error: string | null;
  isCalibrating: boolean;
  permissionState: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';
  requestPermission: () => Promise<boolean>;
}

export function useDeviceOrientation(): UseDeviceOrientationResult {
  const [heading, setHeading] = useState<number | null>(null);
  const [tiltX, setTiltX] = useState<number | null>(null);
  const [tiltY, setTiltY] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');

  // Smooth heading with Kalman filter
  const kalmanFilter = useCallback((measurement: number, prevEstimate: number | null) => {
    const R = 0.1; // measurement noise
    const Q = 0.1; // process noise
    const K = 0.5; // Kalman gain

    if (prevEstimate === null) return measurement;

    // Handle wrap-around for compass degrees (0-360)
    let diff = measurement - prevEstimate;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    return prevEstimate + K * diff;
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    try {
      let newHeading: number | null = null;
      
      // iOS devices
      if ('webkitCompassHeading' in event) {
        const iosEvent = event as any;
        if (iosEvent.webkitCompassAccuracy < 0) {
          setIsCalibrating(true);
          return;
        }
        newHeading = iosEvent.webkitCompassHeading;
        setIsCalibrating(false);
      } 
      // Android devices
      else if (event.alpha !== null) {
        // Convert alpha angle to compass heading
        newHeading = 360 - event.alpha; // Convert to clockwise rotation

        // Apply screen orientation compensation
        if (window.screen.orientation) {
          const screenAngle = window.screen.orientation.angle;
          newHeading = (newHeading + screenAngle) % 360;
        }
      }

      if (newHeading !== null) {
        setHeading(prev => kalmanFilter(newHeading!, prev));
        setError(null);
      }

      // Handle device tilt
      if (event.beta !== null && event.gamma !== null) {
        setTiltX(event.beta);
        setTiltY(event.gamma);
      }
    } catch (err) {
      setError('Error processing orientation data');
    }
  }, [kalmanFilter]);

  const requestPermission = async (): Promise<boolean> => {
    setPermissionState('requesting');
    setError(null);

    try {
      // Force enable sensors on Android Chrome
      if ('DeviceOrientationEvent' in window) {
        // @ts-ignore - Android Chrome specific API
        if (DeviceOrientationEvent.requestPermission) {
          try {
            // iOS permission request
            const permission = await (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission?.();
            if (permission === 'granted') {
              setPermissionState('granted');
              return true;
            }
          } catch (e) {
            // Fall through to try alternative methods
          }
        }

        // Force enable on Android
        window.addEventListener('deviceorientation', handleOrientation, true);
        
        // Verify we're actually getting data
        const timeoutId = setTimeout(() => {
          if (heading === null) {
            setError('No orientation data received. Please ensure sensors are enabled.');
            setPermissionState('denied');
          }
        }, 3000);

        // Cleanup timeout
        setTimeout(() => clearTimeout(timeoutId), 3500);
        
        setPermissionState('granted');
        return true;
      }
    } catch (err) {
      setError('Failed to request sensor permissions');
      setPermissionState('denied');
    }

    return false;
  };

  useEffect(() => {
    if (permissionState === 'granted') {
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    }
  }, [permissionState, handleOrientation]);

  return {
    heading,
    tiltX,
    tiltY,
    error,
    isCalibrating,
    permissionState,
    requestPermission
  };
} 