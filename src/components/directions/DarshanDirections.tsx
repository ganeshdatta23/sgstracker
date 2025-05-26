"use client";

import { useState, type FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardHeader, CardTitle,
  CardDescription, CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Route, Navigation, Loader2, Compass,
  XCircle, AlertTriangle
} from 'lucide-react';
import { calculateBearing } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { CompassView } from '@/components/compass/CompassView';

interface DarshanDirectionsProps {
  destination: { latitude: number; longitude: number; address?: string | null };
}

const TILT_THRESHOLD = 25; // degrees

export default function DarshanDirections({ destination }: DarshanDirectionsProps) {
  const [startLocationInput, setStartLocationInput] = useState('');
  const [directionsResult, setDirectionsResult] = useState<string | null>(null);
  const [travelTime, setTravelTime] = useState<string | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darshanViewActive, setDarshanViewActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bearingToSwamiji, setBearingToSwamiji] = useState<number | null>(null);
  const [showFullscreenDarshan, setShowFullscreenDarshan] = useState(false);

  const { toast } = useToast();
  const {
    heading,
    tiltX,
    tiltY,
    error: orientationError,
    isCalibrating,
    permissionState,
    requestPermission
  } = useDeviceOrientation();

  const showTiltWarning = Boolean(
    tiltX !== null &&
    tiltY !== null &&
    (Math.abs(tiltX) > TILT_THRESHOLD || Math.abs(tiltY) > TILT_THRESHOLD)
  );

  const handleGetDirections = async (event: FormEvent) => {
    event.preventDefault();
    setLoadingDirections(true);
    setError(null);
    setDirectionsResult(null);
    setTravelTime(null);

    let startPoint = startLocationInput;

    if (!startPoint) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        startPoint = `your current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        console.log("📍 Geolocation acquired:", latitude, longitude);

      } catch (geoError: any) {
        console.error("❌ Geolocation error:", geoError);

        let errorMsg = "Could not get current location.";
        if (geoError.code === 1) errorMsg = "Location access was denied. Please enable location services.";
        else if (geoError.code === 2) errorMsg = "Location unavailable. Please check your device's GPS.";
        else if (geoError.code === 3) errorMsg = "Location request timed out. Please try again.";

        setError(errorMsg);
        setLoadingDirections(false);
        return;
      }
    }

    if (!destination || isNaN(destination.latitude) || isNaN(destination.longitude)) {
      setError("Invalid destination coordinates.");
      setLoadingDirections(false);
      return;
    }

    // Simulate directions
    setTimeout(() => {
      const destinationName = destination.address || `Lat: ${destination.latitude.toFixed(4)}, Lng: ${destination.longitude.toFixed(4)}`;
      const directionsText = `Directions from ${startPoint} to ${destinationName}:\n1. Head towards the divine.\n2. Follow the path of righteousness.\n3. Arrive with an open heart.`;

      setDirectionsResult(directionsText);
      setTravelTime(`Estimated travel time: ${(Math.random() * 60 + 30).toFixed(0)} minutes.`);
      console.log("🧭 Directions generated.");
      setLoadingDirections(false);
    }, 1500);
  };

  const activateDarshanView = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });
      console.log("📍 User location for Darshan View:", latitude, longitude);

      const granted = await requestPermission();
      if (granted) {
        setDarshanViewActive(true);
        toast({
          title: "Darshan View Activated",
          description: "Point your device towards Swamiji. Hold your device upright and level."
        });
      }
    } catch (error) {
      console.error("❌ Darshan View activation error:", error);
      toast({
        title: "Error",
        description: "Failed to activate Darshan View. Please ensure location and orientation permissions are granted.",
        variant: "destructive"
      });
    }
  };

  const deactivateDarshanView = () => {
    setDarshanViewActive(false);
    setShowFullscreenDarshan(false);
    toast({ title: "Darshan View Deactivated" });
  };

  useEffect(() => {
    if (darshanViewActive && userLocation && destination) {
      const bearing = calculateBearing(
        userLocation.latitude,
        userLocation.longitude,
        destination.latitude,
        destination.longitude
      );
      setBearingToSwamiji(bearing);
      console.log("📌 Calculated bearing to Swamiji:", bearing);
    }
  }, [darshanViewActive, userLocation, destination]);

  useEffect(() => {
    if (darshanViewActive && heading !== null && bearingToSwamiji !== null) {
      const diff = Math.abs(heading - bearingToSwamiji);
      const angleDiff = Math.min(diff, 360 - diff);
      setShowFullscreenDarshan(angleDiff <= 22.5);
    } else {
      setShowFullscreenDarshan(false);
    }
  }, [darshanViewActive, heading, bearingToSwamiji]);

  return (
    <div className="relative w-full min-h-[600px]">
      {showFullscreenDarshan && (
        <div className="fixed inset-0 z-[1000] bg-black/70">
          <div className="absolute inset-0 backdrop-blur-md" />
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            src="/videos/darshan-background.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full max-w-3xl max-h-[80vh]">
              <div className="absolute inset-0 animate-pulse">
                <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full transform scale-90" />
              </div>
              <Image
                src="/images/swamiji-darshan.png"
                alt="Swamiji Darshan"
                fill
                className="object-contain z-10"
                priority
              />
            </div>
          </div>
          <Button
            onClick={deactivateDarshanView}
            className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            variant="outline"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Close Darshan View
          </Button>
        </div>
      )}

      {darshanViewActive && !showFullscreenDarshan && permissionState === 'granted' && (
        <CompassView
          heading={heading}
          targetHeading={bearingToSwamiji}
          isCalibrating={isCalibrating}
          showTiltWarning={showTiltWarning}
        />
      )}

      <Card className="mt-8 shadow-lg relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route size={24} />
            Darshan Directions
          </CardTitle>
          <CardDescription>Get text-based directions or activate Darshan View.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleGetDirections} className="space-y-4">
            <div>
              <Label htmlFor="startLocationInput">Starting Point (for text directions)</Label>
              <Input
                id="startLocationInput"
                type="text"
                value={startLocationInput}
                onChange={(e) => setStartLocationInput(e.target.value)}
                placeholder="Enter address or leave blank for current location"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loadingDirections} className="w-full">
              {loadingDirections ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting Directions...
                </>
              ) : (
                <>
                  <Navigation size={16} className="mr-2" /> Get Text Directions
                </>
              )}
            </Button>
          </form>

          <div className="border-t pt-4 mt-4">
            {!darshanViewActive ? (
              <Button onClick={activateDarshanView} className="w-full" variant="outline">
                <Compass size={16} className="mr-2" /> Activate Darshan View
              </Button>
            ) : (
              <Button onClick={deactivateDarshanView} className="w-full" variant="destructive">
                <XCircle size={16} className="mr-2" /> Deactivate Darshan View
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {orientationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sensor Error</AlertTitle>
              <AlertDescription>{orientationError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        {(directionsResult || travelTime) && !darshanViewActive && (
          <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
            {directionsResult && (
              <div>
                <h4 className="font-semibold">Directions:</h4>
                <p className="text-sm whitespace-pre-line">{directionsResult}</p>
              </div>
            )}
            {travelTime && <p className="text-sm font-medium">{travelTime}</p>}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
