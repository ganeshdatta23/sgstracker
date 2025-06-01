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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CompassView } from '@/components/compass/CompassView';

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

// Add this CSS at the top of the file, after the imports
const glowingImageStyle = {
  filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
  animation: 'glow 2s ease-in-out infinite'
};

const flashingMessageStyle = {
  animation: 'flashAndElevate 3s ease-in-out infinite'
};

export default function DarshanamView() {
  const router = useRouter();
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
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
  const [isSlokaPlaying, setIsSlokaPlaying] = useState(false);
  const slokaAudioRef = useRef<HTMLAudioElement>(null);

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

  // Start background music when component mounts
  useEffect(() => {
    const initializeAudio = async () => {
      const audio = backgroundAudioRef.current;
      if (!audio) return;

      // Configure audio
      audio.volume = 0.5; // Increased volume to 50%
      audio.muted = false;

      try {
        // Try to load the audio first
        await audio.load();
        
        // Check if audio can be played
        const canPlay = await new Promise(resolve => {
          audio.addEventListener('canplaythrough', () => resolve(true), { once: true });
          audio.addEventListener('error', () => resolve(false), { once: true });
          
          // Timeout after 3 seconds
          setTimeout(() => resolve(false), 3000);
        });

        if (!canPlay) {
          console.error("Audio failed to load");
          toast({
            title: "Audio Issue",
            description: "Unable to load the background music. Please check your audio settings.",
            variant: "destructive",
          });
          return;
        }

        // Try autoplay
        await audio.play();
      } catch (error) {
        console.error("Audio initialization error:", error);
        
        // Setup interaction handlers for browsers that block autoplay
        const handleInteraction = async () => {
          try {
            await audio.play();
            ['click', 'touchstart', 'pointerdown'].forEach(event => {
              document.removeEventListener(event, handleInteraction);
            });
          } catch (playError) {
            console.error("Play error after interaction:", playError);
          }
        };

        ['click', 'touchstart', 'pointerdown'].forEach(event => {
          document.addEventListener(event, handleInteraction, { once: true });
        });

        toast({
          title: "Audio Needs Interaction",
          description: "Touch anywhere on the screen to start the background music",
          duration: 5000,
        });
      }
    };

    initializeAudio();

    return () => {
      const audio = backgroundAudioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
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

      const isAligned = Math.abs(relativeBearingToSwamiji) <= FACING_THRESHOLD_DEGREES;
      if (isAligned) {
        // Show darshan view and play audio when aligned
        if (!showDarshan) {  // Only trigger these when first becoming aligned
          setShowDarshan(true);
          if (darshanAudioRef.current && !isAudioPlaying) {
            darshanAudioRef.current.play()
              .then(() => setIsAudioPlaying(true))
              .catch(error => console.error("Error playing audio:", error));
          }
          // Provide haptic feedback only once when alignment is achieved
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([1000]); // Single 1-second vibration
          }
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
    // Stop both darshan and background audio
    if (darshanAudioRef.current) {
      darshanAudioRef.current.pause();
      darshanAudioRef.current.currentTime = 0;
    }
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
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

  const toggleSloka = () => {
    if (slokaAudioRef.current) {
      if (isSlokaPlaying) {
        slokaAudioRef.current.pause();
        slokaAudioRef.current.currentTime = 0;
        setIsSlokaPlaying(false);
      } else {
        slokaAudioRef.current.play().catch(error => {
          console.error("Error playing sloka:", error);
          toast({
            title: "Audio Error",
            description: "Unable to play sloka. Please try again.",
            variant: "destructive",
          });
        });
        setIsSlokaPlaying(true);
      }
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
      {/* Sloka Toggle Switch */}
      <div className="absolute top-4 right-16 z-[70] flex items-center space-x-2 bg-black/30 p-2 rounded-lg backdrop-blur-sm">
        <Switch
          id="sloka-toggle"
          checked={isSlokaPlaying}
          onCheckedChange={toggleSloka}
          aria-label="Toggle Sloka"
        />
        <Label htmlFor="sloka-toggle" className="text-sm font-medium text-white">Sloka</Label>
      </div>

      {/* Background Music Audio */}
      <audio 
        ref={backgroundAudioRef}
        src="/audio/background-music.mp3"
        loop
        preload="auto"
        onError={(e) => {
          console.error("Background audio error:", e);
          toast({
            title: "Audio Error",
            description: "Unable to play background music. Please check your audio settings.",
            variant: "destructive",
          });
        }}
      />
      {/* Sloka Audio */}
      <audio 
        ref={slokaAudioRef}
        src="/audio/background-music.mp3"
        preload="auto"
        loop
        onError={(e) => {
          console.error("Sloka audio error:", e);
          toast({
            title: "Audio Error",
            description: "Unable to play sloka. Please try again.",
            variant: "destructive",
          });
          setIsSlokaPlaying(false);
        }}
      />
      {showDarshan ? (
        <div id="darshan-view-container" className="relative w-full h-full flex flex-col items-center justify-start">
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
          <div className="relative z-10 w-full h-full flex items-start justify-center">
            <Image 
              src="/images/swamiji-darshan.png"
              alt="Sadguru Darshanam"
              layout="fill"
              style={{ ...glowingImageStyle, objectFit: "contain", objectPosition: 'center top', transform: 'scale(0.70)' }} // Reduced size and aligned top
              priority
              className="max-w-full max-h-full opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>
          {/* Darshan Audio */}
          <audio 
            ref={darshanAudioRef} 
            src="/audio/background-music.mp3" 
            loop
            preload="auto"
            onError={(e) => console.error("Darshan audio error:", e)}
          />

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
           {/* <div className="absolute bottom-4 right-4 z-[20]">
                <Button 
                  onClick={toggleAudio}
                  variant="ghost" 
                  size="icon"
                  className="bg-black/50 hover:bg-black/75 text-white rounded-full w-12 h-12"
                  aria-label={isAudioPlaying ? "Mute Audio" : "Unmute Audio"}
                >
                  {isAudioPlaying ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </Button>
            </div> */}

          {/* Spiritual Message with Animations */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[15] w-11/12 max-w-md p-4 bg-black/50 rounded-2xl text-center backdrop-blur-md border-2 border-yellow-300 shadow-2xl shadow-yellow-200 animate-fadeIn">
            <p className="text-xl sm:text-2xl font-extrabold text-yellow-300 animate-glow tracking-wide">
              <span className="block animate-slideIn delay-[200ms]">✨ Hold Steady!</span>
              <span className="block text-yellow-100 text-base sm:text-lg font-medium animate-slideIn delay-[800ms]">🌟 Appaji's Direction is Aligned</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[55] p-4 text-white">
          {/* Animated Star Background Layers */}
          <div className="stars-layer1"></div>
          <div className="stars-layer2"></div>
          <div className="stars-layer3"></div>

          {/* Use the new CompassView component */}
          <CompassView 
            heading={deviceHeading} 
            targetHeading={bearingToSwamiji} 
            // isCalibrating={someCalibrationFlagFromDarshanamView} // Optional
            // showTiltWarning={someTiltFlagFromDarshanamView}      // Optional
          />

          {/* Instructions and Sloka Button */}
          <div className="flex flex-col items-center gap-4 mt-[15vh]"> {/* Adjusted margin to move everything up */}
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
          </div>
          
          {/* Back/Close button */}
          <div className="absolute top-4 left-4 z-[60] pointer-events-auto">
              <Button 
                  onClick={() => router.push('/')} 
                  variant="ghost" 
                  size="icon"
                  className="bg-black/50 hover:bg-black/75 text-white rounded-full w-12 h-12 flex items-center justify-center"
                  aria-label="Close"
              >
                  <X className="h-6 w-6" />
              </Button>
          </div>
        </div>
      )}
      {/* Moved style tag here */}
      <style jsx global>{`
        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(253, 224, 71, 0.7),
                        0 0 40px rgba(253, 224, 71, 0.5);
          }
          50% {
            text-shadow: 0 0 30px rgba(253, 224, 71, 0.9),
                        0 0 50px rgba(253, 224, 71, 0.7);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }

        .animate-slideIn {
          opacity: 0;
          animation: slideIn 0.8s ease-out forwards;
        }

        .delay-\[200ms\] {
          animation-delay: 200ms;
        }

        .delay-\[800ms\] {
          animation-delay: 800ms;
        }
      `}</style>
    </div>
  );
}
