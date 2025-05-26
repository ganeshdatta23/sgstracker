'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image'; // Assuming Next.js Image component is used/available
import { CheckCircle, AlertTriangle, VideoOff, Loader2 } from 'lucide-react'; // Assuming lucide-react is a dependency
import { Button } from '@/components/ui/button'; // Assuming a Button component exists here
import { useToast } from '@/hooks/use-toast'; // Assuming a toast hook exists, or implement/replace later
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Assuming Alert components exist here
// import TrishulaIcon from './icons/trishula-icon'; // Commented out: May not exist in GuruTracker
// import CosmicBackground from './cosmic-background'; // Commented out: May not exist in GuruTracker
import { calculateBearing, TARGET_LOCATION } from '@/lib/ar-utils'; // Updated import path

interface ArViewProps {
  // Props to be passed to the AR view, e.g., target location, user location status
  userLocation: { lat: number; lng: number } | null;
  userLocationKnown: boolean;
  targetLocation?: { lat: number; lng: number }; // Optional: if not provided, uses TARGET_LOCATION from ar-utils
}

const ALIGNMENT_THRESHOLD = 5; // degrees

export default function ArView({ userLocation, userLocationKnown, targetLocation }: ArViewProps) {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [orientationPermissionStatus, setOrientationPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported' | 'checking'>('checking');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showAlignedView, setShowAlignedView] = useState(false);
  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [bearingToTarget, setBearingToTarget] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast(); // Placeholder for toast notifications

  // Function to show toasts (implement or replace with actual toast system)
  // const showToast = (options: { title: string; description: string; variant?: string }) => {
  //   console.log(`Toast: ${options.title} - ${options.description}`); // Placeholder
  //   // Replace with actual toast call, e.g., toast(options);
  // };

  useEffect(() => {
    if (userLocation && userLocationKnown) {
      const finalTargetLocation = targetLocation || TARGET_LOCATION;
      const bearing = calculateBearing(userLocation, finalTargetLocation);
      setBearingToTarget(bearing);
    } else {
      setBearingToTarget(null);
    }
  }, [userLocation, userLocationKnown, targetLocation]);

  const requestOrientationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && typeof (window as any).DeviceOrientationEvent !== 'undefined' && typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await (window as any).DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setOrientationPermissionStatus('granted');
        } else {
          setOrientationPermissionStatus('denied');
          toast({ title: 'Sensor Access Denied', description: 'Device orientation sensors are needed for guidance.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Error requesting orientation permission:', error);
        setOrientationPermissionStatus('denied');
        toast({ title: 'Sensor Error', description: 'Could not request sensor access.', variant: 'destructive' });
      }
    } else {
      setOrientationPermissionStatus('granted'); 
    }
  }, [toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof (window as any).DeviceOrientationEvent !== 'undefined') {
      if (typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
        setOrientationPermissionStatus('prompt');
      } else {
        setOrientationPermissionStatus('granted');
      }
    } else {
      setOrientationPermissionStatus('unsupported');
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      toast({ title: 'Camera Not Supported', description: 'Your browser does not support camera access.', variant: 'destructive' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to use AR mode.',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (orientationPermissionStatus === 'granted' && bearingToTarget !== null) {
      requestCameraPermission();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
    };
  }, [orientationPermissionStatus, bearingToTarget, requestCameraPermission]);

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading: number | null = null;
    if (typeof (event as any).webkitCompassHeading === 'number') {
      heading = (event as any).webkitCompassHeading;
    } else if (typeof event.alpha === 'number') {
      if (event.absolute === true) {
        heading = (360 - event.alpha + 360) % 360;
      } else {
        heading = (360 - event.alpha + 360) % 360; 
      }
    }
    if (heading !== null && !isNaN(heading)) {
      setDeviceHeading(heading);
    }
  }, []);

  useEffect(() => {
    if (orientationPermissionStatus === 'granted') {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      };
    }
  }, [orientationPermissionStatus, handleDeviceOrientation]);

  useEffect(() => {
    if (bearingToTarget !== null && deviceHeading !== null) {
      const difference = Math.abs(bearingToTarget - deviceHeading);
      const angularDifference = Math.min(difference, 360 - difference);
      if (angularDifference <= ALIGNMENT_THRESHOLD) {
        setShowAlignedView(true);
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(1500);
          if (vibrationTimeoutRef.current) clearTimeout(vibrationTimeoutRef.current);
          vibrationTimeoutRef.current = setTimeout(() => {
            navigator.vibrate(0); 
          }, 1500);
        }
      } else {
        setShowAlignedView(false);
        if (typeof window !== "undefined" && "vibrate" in navigator) navigator.vibrate(0);
        if (vibrationTimeoutRef.current) {
          clearTimeout(vibrationTimeoutRef.current);
          vibrationTimeoutRef.current = null;
        }
      }
    } else {
      setShowAlignedView(false);
      if (typeof window !== "undefined" && "vibrate" in navigator) navigator.vibrate(0);
      if (vibrationTimeoutRef.current) {
        clearTimeout(vibrationTimeoutRef.current);
        vibrationTimeoutRef.current = null;
      }
    }
    return () => {
      if (vibrationTimeoutRef.current) clearTimeout(vibrationTimeoutRef.current);
      if (typeof window !== "undefined" && "vibrate" in navigator) navigator.vibrate(0);
    };
  }, [bearingToTarget, deviceHeading]);

  if (!userLocationKnown) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2 text-primary" />
        Detecting your location...
      </div>
    );
  }
  
  if (bearingToTarget === null && userLocationKnown) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        Could not determine direction. Ensure location is available.
      </div>
    );
  }

  if (orientationPermissionStatus === 'checking') {
    return <div className="flex flex-col items-center justify-center p-4 h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /> <p className="mt-2">Checking sensor status...</p></div>;
  }
  
  if (orientationPermissionStatus === 'unsupported') {
    return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Unsupported Browser</AlertTitle><AlertDescription>Device orientation sensors are not supported.</AlertDescription></Alert>;
  }

  if (orientationPermissionStatus === 'prompt') {
    return (
      <div className="text-center p-4">
        {/* <TrishulaIcon className="h-12 w-12 mx-auto mb-3 text-primary" /> */}
        <p className="mb-3 text-lg font-medium">Enable Motion Sensors</p>
        <p className="text-muted-foreground mb-4">This feature uses device sensors for guidance.</p>
        <Button onClick={requestOrientationPermission} variant="default" size="lg">
          Enable Sensor Access
        </Button>
      </div>
    );
  }
  
  if (orientationPermissionStatus === 'denied') {
    return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Sensor Access Denied</AlertTitle><AlertDescription>Motion sensor access is required. Please enable it in browser settings.</AlertDescription></Alert>;
  }

  const backgroundStyle: React.CSSProperties = hasCameraPermission === false
    ? { 
        // backgroundColor: '#1a1a1a', // Fallback if CosmicBackground is not used
        // backgroundImage: 'url(/placeholder-background.jpg)' // Placeholder if needed
      }
    : {};

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-md mx-auto overflow-hidden rounded-lg shadow-2xl"
      style={{ aspectRatio: '9 / 16', backgroundColor: '#000', ...backgroundStyle }}
    >
      {/* {hasCameraPermission === false && <CosmicBackground />} */}

      {orientationPermissionStatus === 'granted' && hasCameraPermission === null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-30">
          <Loader2 className="animate-spin h-8 w-8 text-white" />
          <p className="mt-2 text-white">Preparing AR view...</p>
        </div>
      )}

      {hasCameraPermission === true && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ transform: 'scaleX(-1)' }} // Mirror mode for front camera, adjust if using environment
        />
      )}

      {hasCameraPermission === false && orientationPermissionStatus === 'granted' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-800 z-10 p-4">
          <VideoOff className="h-12 w-12 text-neutral-500 mb-4" />
          <AlertTitle className="text-white">Camera Issue</AlertTitle>
          <AlertDescription className="text-neutral-400 text-center">
            Camera access failed or is not available. Displaying fallback view.
          </AlertDescription>
        </div>
      )}
      
      {/* Overlay UI Elements - Compass, Alignment Indicator, etc. */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        {orientationPermissionStatus === 'granted' && deviceHeading !== null && bearingToTarget !== null && (
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white p-2 rounded-md text-sm pointer-events-auto"
          >
            Heading: {Math.round(deviceHeading)}° | Target: {Math.round(bearingToTarget)}°
          </div>
        )}

        {showAlignedView && orientationPermissionStatus === 'granted' ? (
          <div className="p-6 bg-green-500 bg-opacity-80 rounded-full shadow-xl flex flex-col items-center">
            {/* <TrishulaIcon className="h-24 w-24 text-white" /> */}
            <CheckCircle className="h-24 w-24 text-white" />
            <p className="mt-2 text-white font-semibold text-lg">Aligned!</p>
          </div>
        ) : orientationPermissionStatus === 'granted' && deviceHeading !== null && bearingToTarget !== null ? (
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Placeholder for a compass rose or arrow */}
            <div 
              className="absolute w-full h-full border-2 border-red-500 rounded-full transition-transform duration-500 ease-in-out"
              style={{ transform: `rotate(${(bearingToTarget - deviceHeading + 360)%360}deg)` }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-1 bg-red-500 rounded-full"></div> 
            </div>
            <div className="text-white text-2xl font-bold">
               {Math.round(Math.min(Math.abs(bearingToTarget - deviceHeading), 360 - Math.abs(bearingToTarget - deviceHeading)))}°
            </div>
             {/* Simple arrow pointing North of device for calibration assistance */}
            <div className="absolute w-1 h-6 bg-blue-400 top-1/2 left-1/2 -translate-x-1/2 -translate-y-full rounded-sm" title="Device North"></div>
          </div>
        ) : orientationPermissionStatus === 'granted' ? (
          <div className="text-center p-4 text-white">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
            <p>Calibrating sensors...</p>
            <p className="text-xs mt-1">Point your device around to help.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
} 