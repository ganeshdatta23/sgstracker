"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Compass,
  Navigation,
  CheckCircle,
  AlertTriangle,
  VideoOff,
  Loader2,
  X,
  ArrowLeft,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter } from 'next/navigation';

import "@/styles/compass.css";
import { useSwamijiLocation } from "@/hooks/useSwamijiLocation";
import { calculateBearing } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ALIGNMENT_THRESHOLD = 15; // Increased to 20 degrees on each side
const FACING_THRESHOLD_DEGREES = ALIGNMENT_THRESHOLD;

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">;
}

// Helper function to get cardinal direction
function getCardinalDirection(angle: number | null): string {
  if (angle === null) return "--";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(angle / 22.5) % 16;
  return directions[index];
}

export default function DarshanamView() {
  const router = useRouter();
  const {
    locationData: swamijiLocation,
    loading: swamijiLocationLoading,
    error: swamijiLocationError,
  } = useSwamijiLocation();
  const { toast } = useToast();

  const [userGeoLocation, setUserGeoLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [orientationPermissionStatus, setOrientationPermissionStatus] = useState<
    "prompt" | "granted" | "denied" | "unsupported" | "checking"
  >("checking");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const [bearingToSwamiji, setBearingToSwamiji] = useState<number | null>(null);
  const [showDarshan, setShowDarshan] = useState(false);

  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const darshanAudioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const requestOrientationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        setOrientationPermissionStatus(permissionState);
        if (permissionState === "granted") {
          toast({ title: "Sensor Access Granted", description: "Device orientation sensors are now active." });
        } else {
          toast({ title: "Sensor Access Denied", description: "Device orientation sensors are needed for guidance.", variant: "destructive" });
        }
      } catch (error) {
        // console.error("Error requesting orientation permission:", error); // Optional log
        setOrientationPermissionStatus("denied");
        toast({ title: "Sensor Error", description: "Could not request sensor access.", variant: "destructive" });
      }
    } else {
      setOrientationPermissionStatus("granted");
    }
  }, [toast]);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof DeviceOrientationEvent !== "undefined") {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        setOrientationPermissionStatus("prompt");
      } else {
        setOrientationPermissionStatus("granted");
      }
    } else {
      setOrientationPermissionStatus("unsupported");
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setHasCameraPermission(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserGeoLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          // console.error("Error getting user location:", err); // Optional log
          toast({ title: "Location Error", description: "Could not get your location. Guidance may be inaccurate.", variant: "destructive"});
          setUserGeoLocation(null);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
        toast({ title: "Location Error", description: "Geolocation is not supported.", variant: "destructive"});
        setUserGeoLocation(null);
    }
  }, [toast]);

  useEffect(() => {
    if (orientationPermissionStatus === "granted" && hasCameraPermission === null) {
      requestCameraPermission();
    }
  }, [orientationPermissionStatus, hasCameraPermission, requestCameraPermission]);

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading: number | null = null;
    const webkitCompassHeading = (event as any).webkitCompassHeading; // For iOS
    if (typeof webkitCompassHeading === "number") {
      heading = webkitCompassHeading;
    } else if (event.alpha !== null) { // For other browsers
      // If event.absolute is true, alpha is already North-referenced.
      // If false, it's device-referenced, not ideal but a fallback.
      heading = (360 - event.alpha + 360) % 360;
    }
    // Add smoothing if heading is too jumpy, basic smoothing:
    if (heading !== null && !isNaN(heading)) {
        setDeviceHeading(prevHeading => {
            if (prevHeading === null) return heading;
            // Simple low-pass filter
            let diff = heading - prevHeading;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            return (prevHeading + diff * 0.3 + 360) % 360; // Adjust 0.1 for more/less smoothing
        });
    }
  }, []);
  
  useEffect(() => {
    if (orientationPermissionStatus === "granted") {
      window.addEventListener("deviceorientationabsolute", handleDeviceOrientation, true);
      window.addEventListener("deviceorientation", handleDeviceOrientation, true); // Fallback for non-absolute
      return () => {
        window.removeEventListener("deviceorientationabsolute", handleDeviceOrientation, true);
        window.removeEventListener("deviceorientation", handleDeviceOrientation, true);
      };
    } 
  }, [orientationPermissionStatus, handleDeviceOrientation]);

  useEffect(() => {
    if (userGeoLocation && swamijiLocation) {
      const bearing = calculateBearing(
        userGeoLocation.latitude, userGeoLocation.longitude,
        swamijiLocation.latitude, swamijiLocation.longitude
      );
      setBearingToSwamiji(bearing);
    } else {
      setBearingToSwamiji(null);
    }
  }, [userGeoLocation, swamijiLocation]);

  useEffect(() => {
    if (bearingToSwamiji !== null && deviceHeading !== null) {
      const relativeBearingToSwamiji = (bearingToSwamiji - deviceHeading + 360) % 360;
      const angularDifference = Math.min(relativeBearingToSwamiji, 360 - relativeBearingToSwamiji);

      if (angularDifference <= FACING_THRESHOLD_DEGREES) {
        // Show darshan view and play audio when aligned
        setShowDarshan(true);
        if (darshanAudioRef.current && !isAudioPlaying) {
          darshanAudioRef.current.play()
            .then(() => setIsAudioPlaying(true))
            .catch(error => console.error("Error playing audio:", error));
        }
        // Provide haptic feedback for 1 second
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([1000]); // 1 second vibration to indicate alignment
        }
      } else {
        // Hide darshan view and stop audio when not aligned
        setShowDarshan(false);
        if (darshanAudioRef.current && isAudioPlaying) {
          darshanAudioRef.current.pause();
          setIsAudioPlaying(false);
        }
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(0); // Stop vibration
        }
      }
    }
  }, [bearingToSwamiji, deviceHeading, isAudioPlaying]);

  useEffect(() => {
    if (showDarshan && darshanAudioRef.current) {
      if (darshanAudioRef.current.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        darshanAudioRef.current.play()
          .then(() => setIsAudioPlaying(true))
          .catch(error => {
            console.error("Error attempting to play Darshan audio:", error);
            setIsAudioPlaying(false); 
          });
      } else {
        setIsAudioPlaying(false); 
      }
    } else if (!showDarshan && darshanAudioRef.current) {
      darshanAudioRef.current.pause();
      setIsAudioPlaying(false);
    }
  }, [showDarshan]);

  const closeDarshanView = () => {
    setShowDarshan(false);
    if (darshanAudioRef.current) {
      darshanAudioRef.current.pause();
      darshanAudioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
    router.push('/');
  };

  const toggleAudio = () => {
    if (darshanAudioRef.current) {
      if (isAudioPlaying) {
        darshanAudioRef.current.pause();
      } else {
        darshanAudioRef.current.play().catch(console.error);
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  useEffect(() => {
    const audio = darshanAudioRef.current;
    if (audio) {
      const handleAudioPlay = () => setIsAudioPlaying(true);
      const handleAudioPause = () => setIsAudioPlaying(false);
      audio.addEventListener('play', handleAudioPlay);
      audio.addEventListener('pause', handleAudioPause);
      return () => {
        audio.removeEventListener('play', handleAudioPlay);
        audio.removeEventListener('pause', handleAudioPause);
      };
    }
  }, []);

  if (swamijiLocationLoading || orientationPermissionStatus === 'checking') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white p-4 z-[60]">
        <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
        <p className="text-center">{swamijiLocationLoading ? "Fetching Guru's location..." : "Checking sensor status..."}</p>
      </div>
    );
  }
  
  if (orientationPermissionStatus === "unsupported" || swamijiLocationError) {
     return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white p-4 z-[60] text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-xl font-semibold mb-2">Guidance Unavailable</h3>
        {orientationPermissionStatus === "unsupported" && <p className="mb-2">Device orientation sensors are not supported by your browser or device.</p>}
        {swamijiLocationError && <p>Could not fetch Guru's location: {swamijiLocationError instanceof Error ? swamijiLocationError.message : String(swamijiLocationError)}</p>}
        <Button onClick={() => router.push('/')} variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
    );
  }

  if (orientationPermissionStatus === 'prompt') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white p-6 z-[60] text-center">
        <Compass className="h-16 w-16 mx-auto mb-6 text-primary" />
        <h3 className="text-xl font-semibold mb-3">Sensor Access Required</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          To guide you towards Sadguru, this feature needs access to your device's orientation sensors.
        </p>
        <Button onClick={requestOrientationPermission} variant="default" size="lg">
          Grant Sensor Access
        </Button>
         <Button onClick={() => router.push('/')} variant="link" className="mt-8 text-sm text-muted-foreground">
            Cancel and Go Home
        </Button>
      </div>
    );
  }
  
  if (orientationPermissionStatus === "denied") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white p-6 z-[60] text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-destructive" />
        <h3 className="text-xl font-semibold mb-3">Sensor Access Denied</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Device orientation sensor access was denied. This feature cannot work without it. You may need to grant permission in your browser or device settings.
        </p>
        <Button onClick={requestOrientationPermission} variant="default" size="lg" className="mb-4">
          Retry Permission Request
        </Button>
        <Button onClick={() => router.push('/')} variant="outline">
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black text-white z-[50]">
      {showDarshan ? (
        <div id="darshan-view-container" className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Background Video */}
          <video
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="/videos/darshan-background.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          {/* Darshan Image - Centered on top of video */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <Image 
              src="/images/swamiji-darshan.png"
              alt="Sadguru Darshanam"
              layout="fill"
              style={{ objectFit: "contain" }}
              priority
              className="max-w-full max-h-full"
            />
          </div>
          {/* Darshan Audio */}
          <audio ref={darshanAudioRef} src="/audio/background-music.mp3" loop />

          {/* Controls Overlay for Darshan View */}
          <div className="absolute top-4 right-4 z-[20]">
            <Button 
              onClick={closeDarshanView} 
              variant="ghost" 
              size="icon"
              className="bg-black/50 hover:bg-black/75 text-white rounded-full w-12 h-12"
              aria-label="Close Darshan"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
           <div className="absolute bottom-4 right-4 z-[20]">
                <Button 
                  onClick={toggleAudio}
                  variant="ghost" 
                  size="icon"
                  className="bg-black/50 hover:bg-black/75 text-white rounded-full w-12 h-12"
                  aria-label={isAudioPlaying ? "Mute Audio" : "Unmute Audio"}
                >
                  {isAudioPlaying ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </Button>
            </div>

          {/* Optional: Message or blessing text over Darshan image */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[15] p-4 bg-black/40 rounded-lg max-w-md text-center backdrop-blur-sm">
            <p className="text-sm sm:text-base text-gray-200 line-clamp-2">
              Pujya Sri Swamiji's Darshan Aligned.
            </p>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[55] p-4 text-white">
          {/* Animated Star Background Layers */}
          <div className="stars-layer1"></div>
          <div className="stars-layer2"></div>
          <div className="stars-layer3"></div>

          {/* New Compass Visual */}
          <div className="compass">
            <div className="arrow" />
            <div
              className="compass-circle"
              style={{
                transform: `translate(-50%, -50%) rotate(${deviceHeading !== null ? -deviceHeading : 0}deg)`
              }}
            />
            <div
              className="swamiji-point"
              style={{
                opacity: bearingToSwamiji !== null && deviceHeading !== null &&
                  Math.min(
                    Math.abs(bearingToSwamiji - deviceHeading),
                    360 - Math.abs(bearingToSwamiji - deviceHeading)
                  ) <= FACING_THRESHOLD_DEGREES ? 1 : 0
              }}
            />
            {/* Digital Readout for Device Heading */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-center pointer-events-auto bg-black/60 p-3 rounded-lg backdrop-blur-sm z-20 w-40">
              <p className="text-4xl font-bold tabular-nums text-primary">
                {deviceHeading !== null ? `${deviceHeading.toFixed(0)}°` : "--°"}
              </p>
              <p className="text-lg text-foreground/90">
                {getCardinalDirection(deviceHeading)}
              </p>
            </div>
          </div>

          {/* Instructions / Status Text - Below Compass */}
          <div className="text-center pointer-events-auto bg-black/60 p-4 rounded-lg backdrop-blur-sm max-w-xs z-10">
            {userGeoLocation && swamijiLocation && bearingToSwamiji !== null && deviceHeading !== null ? (
              <>
                <p className="text-base sm:text-lg font-semibold text-primary mb-1">
                  Align with Sadguru
                </p>
                <p className="text-sm text-foreground/80">
                  Turn your device until the <span className="text-accent font-semibold">arrow</span> aligns with the <span className="text-red-400 font-semibold">red line</span>.
                </p>
              </>
            ) : userGeoLocation && swamijiLocation && bearingToSwamiji !== null ? (
              <p className="text-sm text-foreground/90">Calibrating compass... <br/>Move device in a figure-eight motion if needed.</p>
            ) : !userGeoLocation ? (
              <p className="text-sm text-yellow-400">Waiting for your location...</p>
            ) : (
              <p className="text-sm text-yellow-400">Fetching Guru's location details...</p>
            )}
          </div>
          
          {/* Back button for Guidance UI */}
          <div className="absolute top-4 left-4 z-[60] pointer-events-auto">
              <Button 
                  onClick={() => router.push('/')} 
                  variant="ghost" 
                  size="icon"
                  className="bg-black/50 hover:bg-black/75 text-white rounded-full w-12 h-12"
                  aria-label="Back to Home"
              >
                  <ArrowLeft className="h-6 w-6" />
              </Button>
          </div>
        </div>
      )}
    </div>
  );
}
