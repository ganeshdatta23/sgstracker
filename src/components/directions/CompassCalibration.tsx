'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CompassView } from '@/components/compass/CompassView';

interface CompassCalibrationProps {
  isVisible: boolean;
}

export function CompassCalibration({ isVisible }: CompassCalibrationProps) {
  const [hasPermission, setHasPermission] = useState(true);
  const [angle, setAngle] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  const handleOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null) {
      setAngle(event.alpha);
    }
  };

  const requestSensorAccess = async () => {
    const DOE = DeviceOrientationEvent as any; // Assign to an any typed variable
    if (
      typeof DOE !== 'undefined' &&
      typeof DOE.requestPermission === 'function'
    ) {
      try {
        const permission = await DOE.requestPermission();
        if (permission !== 'granted') {
          setHasPermission(false);
          return;
        }
      } catch (error) {
        console.error('Sensor permission error:', error);
        setHasPermission(false);
      }
    }

    window.addEventListener('deviceorientation', handleOrientation, true);
    setStarted(true);
  };

  useEffect(() => {
    const DOE = DeviceOrientationEvent as any; // Assign to an any typed variable
    if (
      typeof DOE !== 'undefined' &&
      typeof DOE.requestPermission !== 'function'
    ) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      setStarted(true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Alert className="mt-4 bg-yellow-50 border-yellow-200">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Compass Calibration</AlertTitle>
      </div>
      <AlertDescription className="mt-2 text-yellow-700">
        {!hasPermission && (
          <p className="text-red-600 mb-2">
            Motion sensor permission denied. Please enable it in browser settings.
          </p>
        )}

        {!started && hasPermission && (
          <Button onClick={requestSensorAccess} className="mb-3">
            Start Calibration
          </Button>
        )}

        {started && angle === null && (
          <p className="mb-2">Waiting for compass data... Move device in figure-8 motion.</p>
        )}

        {angle !== null && (
          <p className="mb-2">
            <strong>Compass Heading (α):</strong> {Math.round(angle)}°
          </p>
        )}

        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Hold your device upright</li>
          <li>Move it in a figure-8 pattern several times</li>
          <li>Rotate it 360° while keeping it level</li>
          <li>Stay away from metal or magnetic fields</li>
        </ol>
      </AlertDescription>
    </Alert>
  );
}
