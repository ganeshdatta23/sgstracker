"use client";

import { useSwamijiLocation } from '@/hooks/useSwamijiLocation';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Compass, ChevronDown, ChevronUp, LucideArrowUpRightSquare, AlertCircle, BookOpen, MessageSquare, Sparkles, Users, Info, Music, Volume2, VolumeX, HelpCircle, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState, Fragment, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription as AlertDesc } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitleComponent, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculateBearing, calculateDistance, calculateTimeDifference } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { SlokaCarousel } from '@/components/ui/sloka-carousel';
import ResponsiveDrawer from '@/components/layout/ResponsiveDrawer';
import { Typography, Box } from '@mui/material';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Dynamically import client components that use browser APIs or Leaflet
const SwamijiDirectionAR = dynamic(() => import('@/components/SwamijiDirectionAR'), { ssr: false });
// const UserLocationMap = dynamic(() => import('@/components/map/UserLocationMap'), { ssr: false }); // Commented out due to missing file
const PersonalizedGreeting = dynamic(() => import('@/components/greeting/PersonalizedGreeting'), { ssr: false });

export default function HomePage() {
  const { locationData, loading: swamijiLocationLoading, error: swamijiLocationError } = useSwamijiLocation();
  const [userGeoLocation, setUserGeoLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userGeoLocationError, setUserGeoLocationError] = useState<string | null>(null);
  const [bearingToSwamiji, setBearingToSwamiji] = useState<number | null>(null);
  const [isFetchingUserLocation, setIsFetchingUserLocation] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);
  const [isSlokaModalOpen, setIsSlokaModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);
  const [isGuruConnectModalOpen, setIsGuruConnectModalOpen] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isGlobalAlarmEnabled, setIsGlobalAlarmEnabled] = useState(false);
  const [swamijiAlarmEnabled, setSwamijiAlarmEnabled] = useState(false);
  const [userAlarmEnabled, setUserAlarmEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const { toast } = useToast();

  // State for BalaSwamiji's Blessings Card flip
  const [showBlessingsText, setShowBlessingsText] = useState(false);

  // Background audio states and ref
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  const [isBackgroundAudioPlaying, setIsBackgroundAudioPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // To help with autoplay policies

  const locationNameForGreeting = locationData?.address?.split(',')[0] || locationData?.address || undefined; // Ensure undefined if null/empty

  const fetchUserLocation = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser.";
      setUserGeoLocationError(errorMsg);
      toast({ title: "Geolocation Error", description: errorMsg, variant: "destructive"});
      return;
    }
    setIsFetchingUserLocation(true);
    setUserGeoLocationError(null); 
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserGeoLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsFetchingUserLocation(false);
        toast({ title: "Location Acquired", description: "Your current location has been updated."});
      },
      (error) => {
        const errorMsg = `Error getting location: ${error.message}. Please ensure location services are enabled and permissions are granted.`;
        setUserGeoLocationError(errorMsg);
        toast({ title: "Location Error", description: errorMsg, variant: "destructive"});
        setIsFetchingUserLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Initial location fetch can be triggered here if desired, e.g.:
    // if (!userGeoLocation && !userGeoLocationError && !isFetchingUserLocation) {
    //   fetchUserLocation();
    // }
  }, []); // Empty dependency array means this runs once on mount

  // Slokas for the modal
  const slokasContent = [
    {
      text: "गुरुर्ब्रह्मा गुरुर्विष्णुर्गुरुर्देवो महेश्वरः । गुरुः साक्षात् परं ब्रह्म तस्मै श्रीगुरवे नमः ॥",
      translation: "The Guru is Brahma, the Guru is Vishnu, the Guru Deva is Maheswara (Shiva). The Guru is Verily the Para Brahman (Supreme Reality). Salutations to that Guru."
    },
    {
      text: "अज्ञानतिमिरान्धस्य ज्ञानाञ्जनशलाकया । चक्षुरुन्मीलितं येन तस्मै श्रीगुरवे नमः ॥",
      translation: "Salutations to the Guru who opens the eyes of one blinded by the darkness of ignorance with the collyrium (kajal) of knowledge."
    },
    {
      text: "ध्यानमूलं गुरोर्मूर्तिः पूजामूलं गुरोः पदम् । मन्त्रमूलं गुरोर्वाक्यं मोक्षमूलं गुरोः कृपा ॥",
      translation: "The Guru's form is the root of meditation, the Guru's feet are the root of worship, the Guru's word is the root of Mantra, the Guru's grace is the root of liberation."
    },
  ];

  const userGuideContent = [
    "**Sri Guru Dig Vandanam User Guide**",
    "Experience seamless directional guidance to connect with Pujya Appaji wherever you are.",
    "",
    "**Getting Started**",
    "To begin using Sri Guru Dig Vandanam, follow these initial setup steps:",
    "",
    "**Enable Location Services**",
    "Turn on your device's location services and grant permission when prompted to access location features.",
    "",
    "**Calibrate Your Compass**",
    "For accurate direction finding, move your phone in a figure-8 motion to calibrate the compass.",
    "",
    "**Allow Browser Location Access**",
    "When asked, allow your browser to access your location for real-time tracking and direction.",
    "",
    "Recommended: Use Google Chrome for the best experience and compatibility across devices.",
    "",
    "**Main Features**",
    "• **Guru Connect**: Shows Pujya Appaji's current location, your location, distance, and direction.",
    "• **Direction Finding**: Displays the exact bearing (in degrees) to face towards Pujya Appaji's location.",
    "• **Distance Calculation**: Shows the distance between your location and Pujya Appaji's location in kilometers.",
    "• **Time Zone**: Displays local time and IST time difference.",
    "",
    "**Technical Notes**",
    "Sri Guru Dig Vandanam uses GPS and your device's digital compass for accurate location and direction.",
    "",
    "Accuracy may vary based on:",
    "  • GPS signal strength",
    "  • Magnetic interference from nearby metal objects",
    "",
    "The app auto-refreshes location data periodically to ensure up-to-date information.",
    "",
    "**Troubleshooting**",
    "If you're experiencing issues:",
    "",
    "**Location Not Updating**",
    "→ Ensure location services are turned on in your device settings.",
    "",
    "**Compass Not Pointing Correctly**",
    "→ Recalibrate your device by moving it in a figure-8 motion.",
    "",
    "**Data Not Loading**",
    "→ Clear your browser cache and refresh the page.",
    "",
    "**Slow or Inaccurate Updates**",
    "→ Make sure you're connected to a stable internet network.",
    "",
    "**Device Compatibility**",
    "• Works on most modern browsers (Chrome, Safari, Firefox, Edge)",
    "• Requires HTML5 geolocation support",
    "• Compass features work best on mobile devices",
    "• Supports both portrait and landscape orientations",
    "",
    "**Add to Home Screen (Web App Installation)**",
    "For quick access, you can install Sri Guru Dig Vandanam on your home screen like a native app:",
    "",
    "**For Android (Chrome Browser)**",
    "1. Open Sri Guru Dig Vandanam in Google Chrome.",
    "2. Tap the menu icon (three dots in the top right).",
    "3. Select \"Add to Home screen\".",
    "4. Tap \"Add\" again in the popup confirmation.",
    "5. The app icon will now appear on your home screen and open in full-screen mode.",
    "",
    "**For iPhone (Safari Browser)**",
    "1. Open Sri Guru Dig Vandanam in Safari.",
    "2. Tap the Share icon (square with an arrow pointing up).",
    "3. Scroll and tap \"Add to Home Screen\".",
    "4. Tap \"Add\" in the top-right corner.",
    "5. The app will be available on your home screen just like a native app."
  ];
  
  // Updated content for BalaSwamiji's Blessings card (back side)
  const balaswamijiAnugrahaBhashanam = [
    "The Guru Gita teaches that one should offer reverential prostrations in the direction of sacred places such as Kashi, Gaya, etc. Similarly, wherever our Sadguru, Pujya Sri Appaji, resides or travels, we should bow in that direction with deep devotion and faith. It is to be understood that our Sadguru is ever-present with us, guiding and protecting us at all times. We must hold the unwavering conviction that our Sadguru is none other than Lord Śrīnātha Himself.",
    "~ Guru Gita Discourse During First Chaturmasya Vrata Deeksha, Mysuru 2004"
  ];
  
  
  // balaswamijiBlessingsContent array (original) can be removed or kept if used elsewhere, 
  // for this card, we use balaswamijiAnugrahaBhashanam
  const balaswamijiBlessingsContent = balaswamijiAnugrahaBhashanam; // For now, just alias it
  
  useEffect(() => {
    if (userGeoLocation && locationData) {
      const bearing = calculateBearing(
        userGeoLocation.latitude,
        userGeoLocation.longitude,
        locationData.latitude,
        locationData.longitude
      );
      setBearingToSwamiji(bearing);
    } else {
      setBearingToSwamiji(null);
    }
  }, [userGeoLocation, locationData]);

  const handleAccordionChange = (value: string) => {
    const newAccordionValue = value === accordionValue ? undefined : value; 
    setAccordionValue(newAccordionValue);
    if (newAccordionValue === "dashboard-item" && !userGeoLocation && !isFetchingUserLocation && !userGeoLocationError) {
        fetchUserLocation();
    }
    if (!hasInteracted) setHasInteracted(true);
  };

  // Attempt to play background audio after user interaction or on mount (with fallback)
  useEffect(() => {
    const audio = backgroundAudioRef.current;
    if (audio) {
      const playAudio = () => {
        audio.play()
          .then(() => setIsBackgroundAudioPlaying(true))
          .catch(error => {
            console.warn("Background audio autoplay/play was prevented:", error);
            setIsBackgroundAudioPlaying(false);
          });
      };

      if (hasInteracted) {
        playAudio();
      } else {
        // Attempt autoplay on mount, may be blocked by browser policies
        // We rely on user clicking the play button or interacting with other elements if this fails
        playAudio(); 
      }
      
      const handlePlay = () => setIsBackgroundAudioPlaying(true);
      const handlePause = () => setIsBackgroundAudioPlaying(false);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, [hasInteracted]); // Re-run if user interacts or on initial mount if audio element is ready

  const toggleBackgroundAudio = () => {
    if (!hasInteracted) {
      setHasInteracted(true); // Mark interaction, useEffect will attempt to play
    } else if (backgroundAudioRef.current) {
      if (isBackgroundAudioPlaying) {
        backgroundAudioRef.current.pause();
      } else {
        backgroundAudioRef.current.play().catch(e => console.warn("Error playing audio manually:", e));
      }
      // State is updated by event listeners on the audio element
    }
  };
  
  // Function to handle general interaction for enabling audio
  const handleUserInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleOpenDisclaimer = () => {
    setIsDisclaimerModalOpen(true);
    handleUserInteraction();
  };

  const handleOpenSlokas = () => {
    setIsSlokaModalOpen(true);
    handleUserInteraction();
  };
  
  const handleOpenDashboard = () => {
    setIsGuruConnectModalOpen(true);
    if (!userGeoLocation && !isFetchingUserLocation && !userGeoLocationError) {
        fetchUserLocation();
    }
    handleUserInteraction();
  };

  const handleOpenGuide = () => {
    setIsGuideModalOpen(true);
    handleUserInteraction();
  };

  const handleOpenAlarmSettings = () => {
    setIsAlarmModalOpen(true);
    // Check and request notification permission when opening alarm settings
    if (typeof window !== 'undefined' && typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
      // No need to explicitly request here, the useEffect below will handle it if 'default'
    }
    handleUserInteraction();
  };

  // Effect to request permission if it's default when modal opens or global alarm is toggled
  useEffect(() => {
    if (isAlarmModalOpen && typeof window !== 'undefined' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'denied') {
          toast({ title: "Notification Permission Denied", description: "Alarms via notifications cannot be shown.", variant: "destructive" });
          setIsGlobalAlarmEnabled(false); // Disable if denied
        } else if (permission === 'granted') {
          toast({ title: "Notification Permission Granted", description: "You can now receive alarm notifications." });
        }
      });
    }
  }, [isAlarmModalOpen, toast]); // Removed notificationPermission from deps to avoid loop, it's set inside

  // Placeholder for actual alarm triggering logic
  useEffect(() => {
    if (!isGlobalAlarmEnabled || typeof window === 'undefined' || typeof Notification === 'undefined') return;
    let swamijiTimeoutId: NodeJS.Timeout | undefined;
    let userTimeoutId: NodeJS.Timeout | undefined;

    const showNotification = (title: string, body: string) => {
      if (Notification.permission === 'granted') {
        const notificationOptions: NotificationOptions = {
          body,
          icon: '/logo.png', // Assuming you have a logo.png in /public
          requireInteraction: true, // Suggests the notification stays until interacted with
          // sound: '/audio/alarm-tone.mp3', // This is not standard/well-supported; play audio manually
        };
        
        new Notification(title, notificationOptions);

        // Attempt to play a sound - requires user interaction with the page at some point for autoplay to work
        // You'll need an actual audio file, e.g., /public/audio/alarm-tone.mp3
        try {
          const alarmAudio = new Audio('/audio/alarm-tone.mp3'); // Path relative to /public
          alarmAudio.play().catch(e => console.warn("Audio play failed (user interaction might be needed, or file missing):", e));
        } catch (e) {
          console.error("Error playing notification sound:", e);
        }

      } else {
        console.warn('Notification permission not granted. Cannot show alarm.');
      }
    };

    if (swamijiAlarmEnabled && locationData) {
      // SIMULATED: Trigger 1 minute from now for Swamiji
      const alarmTime = new Date(Date.now() + 1 * 60 * 1000);
      console.log(`Simulated Swamiji Alarm set for: ${alarmTime.toLocaleTimeString()}`);
      toast({ title: "Swamiji Alarm (Simulated)", description: `Notification will show at ${alarmTime.toLocaleTimeString()}`});
      
      swamijiTimeoutId = setTimeout(() => {
        showNotification('Pujya Appaji Alarm (Simulated)', 'Time for 5 minutes before Swamiji\'s sunrise (Simulated)');
      }, alarmTime.getTime() - Date.now());
    }

    if (userAlarmEnabled && userGeoLocation) {
      // SIMULATED: Trigger 2 minutes from now for User
      const alarmTime = new Date(Date.now() + 2 * 60 * 1000);
      console.log(`Simulated User Alarm set for: ${alarmTime.toLocaleTimeString()}`);
      toast({ title: "Your Alarm (Simulated)", description: `Notification will show at ${alarmTime.toLocaleTimeString()}`});
      
      userTimeoutId = setTimeout(() => {
        showNotification('Your Alarm (Simulated)', 'Time for 5 minutes before your sunrise (Simulated)');
      }, alarmTime.getTime() - Date.now());
    }

    return () => {
      if (swamijiTimeoutId) clearTimeout(swamijiTimeoutId);
      if (userTimeoutId) clearTimeout(userTimeoutId);
    };
  }, [isGlobalAlarmEnabled, swamijiAlarmEnabled, userAlarmEnabled, locationData, userGeoLocation, notificationPermission, toast]);

  // Handler for the master alarm switch
  const handleGlobalAlarmToggle = (checked: boolean) => {
    setIsGlobalAlarmEnabled(checked);
    if (checked && typeof window !== 'undefined' && typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          if (permission === 'denied') {
            toast({ title: "Notification Permission Denied", description: "Alarms cannot be enabled.", variant: "destructive" });
            setIsGlobalAlarmEnabled(false); // Force disable if denied
          } else if (permission === 'granted') {
            toast({ title: "Notification Permission Granted", description: "Alarms are now active." });
          }
        });
      } else if (Notification.permission === 'denied') {
          toast({ title: "Notification Permission Denied", description: "Please enable notifications in browser settings to use alarms.", variant: "destructive" });
          setIsGlobalAlarmEnabled(false); // Ensure it stays off if permission is denied
      }
    }
    if (!checked) { // If turning off global, turn off individual alarms too
      setSwamijiAlarmEnabled(false);
      setUserAlarmEnabled(false);
    }
  };

  if (swamijiLocationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-foreground p-4 bg-[#0C0A09]" onClick={handleUserInteraction}>
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 animate-pulse text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (swamijiLocationError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive-foreground bg-destructive p-4" onClick={handleUserInteraction}>
         <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12" />
          <p className="text-lg font-semibold">Error Loading Initial Data</p>
          <p className="text-sm">{swamijiLocationError instanceof Error ? swamijiLocationError.message : String(swamijiLocationError)}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-4 text-primary border-primary hover:bg-primary/10 hover:text-primary/90 smooth-all hover:scale-105"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveDrawer 
      onDisclaimerClick={handleOpenDisclaimer}
      onSlokasClick={handleOpenSlokas}
      onDashboardClick={handleOpenDashboard}
      onGuideClick={handleOpenGuide}
      onAlarmClick={handleOpenAlarmSettings}
    >
      <div className="container sm:mx-auto px-0" onClick={handleUserInteraction}>
      {/* <audio ref={backgroundAudioRef} src="/audio/SpotiDownloader (mp3cut.net).mp3" loop preload="auto" /> */}

        <div className="fixed bottom-20 right-5 z-50 flex items-center gap-3">
        {/* <Button 
          variant="outline" 
            size="icon" 
          onClick={toggleBackgroundAudio}
            className="p-2.5 rounded-full shadow-lg bg-card/80 hover:bg-card/95 smooth-all group hover:scale-110 hover:shadow-primary/30"
          aria-label={isBackgroundAudioPlaying ? "Mute background music" : "Play background music"}
        >
          {isBackgroundAudioPlaying ? 
            <Volume2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" /> : 
            <VolumeX className="h-5 w-5 text-muted-foreground group-hover:scale-110 transition-transform" />
          }
        </Button>  */}
      </div>
        
        <Dialog open={isGuruConnectModalOpen} onOpenChange={setIsGuruConnectModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border smooth-all">
            <DialogHeader>
              <DialogTitleComponent className="content-header">Live Info</DialogTitleComponent>
              {/* <DialogDescriptionComponent className="content-subheading">
                Current Time & Location Details
              </DialogDescriptionComponent> */}
            </DialogHeader>
            <button 
              onClick={() => setIsGuruConnectModalOpen(false)}
              className="close-button"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <ScrollArea className="card-content">
                <Box className="pt-2 pb-1 space-y-4 text-xs sm:text-sm px-2">
                  {!userGeoLocation && !isFetchingUserLocation && (
                        <Button 
                          onClick={fetchUserLocation} 
                          variant="outline" 
                          className="w-full text-sm border-primary text-primary hover:bg-primary/10 smooth-all hover:scale-[1.02]"
                        >
                          <Compass className="mr-2 h-4 w-4" /> Get My Location & Direction
                      </Button>
                  )}
                  {isFetchingUserLocation && <Skeleton className="h-10 w-full rounded-md" />}
                  {userGeoLocationError && (
                    <Alert variant="destructive" className="text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Location Issue</AlertTitle>
                        <AlertDesc>{userGeoLocationError}</AlertDesc>
                    </Alert>
                  )}
                  <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                      <Typography variant="subtitle1" sx={{ color: 'hsl(var(--primary))', mb: 1, fontWeight: 'bold' }}>Appaji's Current Location & Time</Typography>
                      {swamijiLocationLoading && <Skeleton className="h-8 w-3/4 rounded-md" />}
                      {swamijiLocationError && <Typography variant="caption" sx={{color: 'error.main'}}>Error loading Appaji's location.</Typography>}
                      {locationData && (
                        <>
                          <Typography variant="body1" sx={{ color: 'hsl(var(--foreground))', fontWeight: 'medium' }}>
                            Location: {locationData.address || 'Not available'}
                          </Typography>
                          {/* <Typography variant="body1" sx={{ color: 'hsl(var(--foreground))', mt: 0.5 }}>
                            Coordinates: {locationData.latitude.toFixed(3)}, {locationData.longitude.toFixed(3)}
                          </Typography> */}
                          <Typography variant="body2" sx={{ color: 'white', mt: 0.5 ,fontWeight: 'bold'}}>
                            Local Time: {new Date().toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false,
                              timeZone: 'Asia/Kolkata'
                            })} IST
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', mt: 1 }} display="block">
                            Last Updated: {format(new Date(locationData.updatedAt), 'PPp')}
                          </Typography>
                        </>
                      )}
                      {!locationData && !swamijiLocationLoading && !swamijiLocationError && 
                        <Typography variant="caption" sx={{color: 'text.disabled'}}>
                          Appaji's location data is currently unavailable.
                        </Typography>
                      }
                    </Box>
                  
                    {userGeoLocation && locationData && bearingToSwamiji !== null && (
                      <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 215, 0, 0.2)', color: 'hsl(var(--foreground))' }}>
                        <Typography variant="subtitle1" sx={{ color: 'hsl(var(--primary))', mb: 1, fontWeight: 'bold' }}>Distance & Direction</Typography>
                        <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                          <Compass className="mr-2 h-5 w-5 text-primary" /> 
                          <Typography variant="body1">
                            Direction: <Typography component="span" sx={{fontWeight: 'bold', color: 'white'}}>
                              {bearingToSwamiji.toFixed(0)}°
                            </Typography> from North
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          Distance: {calculateDistance(
                            userGeoLocation.latitude,
                            userGeoLocation.longitude,
                            locationData.latitude,
                            locationData.longitude
                          ).toFixed(1)} km away
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          Time Difference: {calculateTimeDifference().toFixed(2)} hours
                        </Typography>
                      </Box>
                    )}
                    {userGeoLocation && (
                      <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                        <Typography variant="subtitle1" sx={{ color: 'hsl(var(--primary))', mb: 1, fontWeight: 'bold' }}>Your Current Location</Typography>
                        <Typography variant="body1" sx={{ color: 'hsl(var(--foreground))' }}>
                          Coordinates: {userGeoLocation.latitude.toFixed(3)}, {userGeoLocation.longitude.toFixed(3)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'white', mt: 0.5 }}>
                          Local Time: {new Date().toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false,
                            timeZoneName: 'short'
                          })}
                        </Typography>
                      </Box>
                    )}
                </Box>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isDisclaimerModalOpen} onOpenChange={setIsDisclaimerModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border smooth-all">
            <DialogHeader>
              <DialogTitleComponent className="content-header">About</DialogTitleComponent>
              <DialogDescriptionComponent className="content-subheading">
                Important information about Sri Guru Dig Vandanam.
              </DialogDescriptionComponent>
            </DialogHeader>
            <button 
              onClick={() => setIsDisclaimerModalOpen(false)}
              className="close-button"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <ScrollArea className="card-content">
              <Box sx={{ py: 2, px: { xs: 1, sm: 2 }, color: 'text.primary' }}>
                <Typography variant="h6" component="h2" align="center" sx={{ color: 'primary.main', mb: 2, fontWeight: 'bold' }}>
                  Jaya Guru Datta
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'white' }}>
                  Sri Guru Dig Vandanam is a humble tool designed for Datta devotees to offer daily pranāms (obeisance) to Pujya Sri Appaji, as instructed in the Guru Gītā in the direction of Pujya Appaji's current location.
                </Typography>
                <Box sx={{ borderLeft: 4, borderColor: 'primary.light', pl: 2, my: 2, fontStyle: 'italic', bgcolor: 'action.hover' }}>
                  <Typography variant="body2" component="blockquote" sx={{ color: 'gold' }}>
                    śrīnātha caraṇa dvandvaṁ yasyāṁ diśi virājatē。<br />
                    tasyai diśē namaskuryāt bhaktyā pratidinaṁ priyē ||
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'white' }}>
                  "O beloved, one should bow every day with devotion in the direction where the feet of the revered Guru, Srīnātha, shine forth." Swamiji explains that we should offer our obeisance primarily at the feet of the Guru, and the direction in which the Guru's feet reside becomes sacred.
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'white' }}>
                  Swamiji explains that we should offer our obeisance primarily at the feet of the Guru, and the direction in which the Guru's feet reside becomes sacred. "Guru stands for Srīnātha – the Lord Himself. The Guru is the embodiment of Vishnu, the bestower of auspiciousness, wealth, and divine energy. His lotus feet sanctify all directions."
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'white' }}>
                  Therefore, wherever the Guru's presence is felt, that direction becomes worthy of worship.
                </Typography>
                <Typography variant="subtitle1" component="h3" sx={{ mt: 2, mb: 1, fontWeight: 'medium', color: 'white' }}>
                  Note
                  This tool is lovingly developed and maintained by a team of Datta devotees as a humble offering to Pujya Sri Appaji, with the blessings of Pujya Sri Datta Prabhu Appaji and under the guidance of Pujya Bala Swamiji.
                </Typography>
                <hr className="my-3 border-border/30" />
                {/* <Typography variant="caption" display="block" align="center" sx={{ color: 'yellow', mt: 2 }}>
                  This app is developed by a Datta Devotee and is not officially affiliated with Avadhootha Datta Peetham.
                </Typography> */}
                <Typography variant="body2" align="center" sx={{ color: 'green', mt: 3 }}>
                  For feedback or support, please contact: <Link href="mailto:dattadev.sgs@gmail.com" style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}>
                    dattadev.sgs@gmail.com
                  </Link>
                </Typography>
              </Box>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
      <Dialog open={isSlokaModalOpen} onOpenChange={setIsSlokaModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border smooth-all">
            <DialogHeader>
              <DialogTitleComponent className="content-header">Dhyana Slokas</DialogTitleComponent>
              {/* <DialogDescriptionComponent className="content-subheading">
                Divine verses for spiritual elevation.
              </DialogDescriptionComponent> */}
            </DialogHeader>
            <button 
              onClick={() => setIsSlokaModalOpen(false)}
              className="close-button"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <ScrollArea className="card-content">
              <Box sx={{ py: 2, px: { xs: 0, sm: 1 } }}>
              {slokasContent.map((sloka, index) => (
                  <Box
                    key={index} 
                    sx={{ 
                      mb: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: 2,
                      p: { xs: 1.5, sm: 2 }
                    }}
                  >
                    <Typography 
                      variant="body1"
                      component="p" 
                      sx={{ 
                        fontFamily: 'Sanskrit_2003, Arial, sans-serif',
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }, 
                        lineHeight: 1.8, 
                        color: 'warning.light',
                        mb: 1.5, // Keep margin-bottom
                        whiteSpace: 'normal', // Allow text to wrap naturally
                        textAlign: 'center'   // Center the text
                      }}
                    >
                      {sloka.text}
                    </Typography>
                    <hr className="my-2 border-border/30" />
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'silver' }}>
                      {sloka.translation}
                    </Typography>
                  </Box>
              ))}
              </Box>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={isAlarmModalOpen} onOpenChange={setIsAlarmModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border smooth-all">
            <DialogHeader>
              <DialogTitleComponent className="content-header">Alarm Settings</DialogTitleComponent>
              <DialogDescriptionComponent className="content-subheading">
                Configure sunrise notifications (Sunrise times are simulated for now).
              </DialogDescriptionComponent>
            </DialogHeader>
            <button 
              onClick={() => setIsAlarmModalOpen(false)}
              className="close-button"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <ScrollArea className="card-content max-h-[400px]">
              <Box sx={{ py: 2, px: { xs: 1, sm: 2 }, color: 'white' }} className="space-y-6">
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/50">
                  <Label htmlFor="global-alarm-switch" className="text-base font-medium">
                    Enable Alarm Notifications
                  </Label>
                  <Switch 
                    id="global-alarm-switch" 
                    checked={isGlobalAlarmEnabled}
                    onCheckedChange={handleGlobalAlarmToggle} // Use new handler
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30"
                  />
                </div>

                {notificationPermission === 'denied' && (
                    <Alert variant="destructive" className="text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Permission Issue</AlertTitle>
                        <AlertDesc>Notification permission is denied. Please enable it in your browser/OS settings to use alarms.</AlertDesc>
                    </Alert>
                )}

                {isGlobalAlarmEnabled && notificationPermission === 'granted' && (
                  <>
                    {/* Swamiji's Location Alarm */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/50">
                      <Label htmlFor="swamiji-alarm-switch" className="text-sm font-normal">
                        Pujya Appaji Alarm
                        <Typography variant="caption" display="block" sx={{ color: 'hsl(var(--muted-foreground))'}}>
                          5 mins before Swamiji's sunrise (Simulated)
                        </Typography>
                      </Label>
                      <Switch 
                        id="swamiji-alarm-switch" 
                        checked={swamijiAlarmEnabled}
                        onCheckedChange={setSwamijiAlarmEnabled}
                        disabled={!locationData}
                      />
                    </div>
                    {!locationData && (
                        <Typography variant="caption" sx={{color: 'text.disabled', pl:1}}>
                          Appaji's location needed for this alarm.
                        </Typography>
                    )}

                    {/* User's Location Alarm */}
                    <div className="flex items-center justify-between p-3 mt-4 rounded-lg bg-background/30 border border-border/50">
                      <Label htmlFor="user-alarm-switch" className="text-sm font-normal">
                        Your Location Alarm
                        <Typography variant="caption" display="block" sx={{ color: 'hsl(var(--muted-foreground))'}}>
                          5 mins before your sunrise (Simulated)
                        </Typography>
                      </Label>
                      <Switch 
                        id="user-alarm-switch" 
                        checked={userAlarmEnabled}
                        onCheckedChange={setUserAlarmEnabled}
                        disabled={!userGeoLocation}
                      />
                    </div>
                     {!userGeoLocation && (
                        <Typography variant="caption" sx={{color: 'text.disabled', pl:1}}>
                          Your location needed for this alarm. Enable location services.
                        </Typography>
                    )}
                  </>
                )}
                {isGlobalAlarmEnabled && notificationPermission === 'default' && (
                     <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))'}} className="text-center py-4">
                        Please grant notification permission to activate alarms.
                    </Typography>
                )}
                {!isGlobalAlarmEnabled && notificationPermission !== 'denied' && (
                    <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))'}} className="text-center py-4">
                        Alarm notifications are currently disabled.
                    </Typography>
                )}
              </Box>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <PersonalizedGreeting locationName={locationNameForGreeting} />
        
        {/* "Swamiji sitting smiling" Card */}
        {/* <div className="my-4 md:my-6" onClick={handleUserInteraction}>
          <Card className="w-full overflow-hidden rounded-xl shadow-lg bg-card/80 backdrop-blur-md hover:shadow-primary/30 transition-shadow duration-300"> */}
            {/* <CardContent className="p-0 relative aspect-[3/2] sm:aspect-video md:aspect-[16/9] border-none">
              <Image 
                src="/images/appaji-sitting-smile.png" 
                alt="Appaji Darshanam" 
                fill 
                style={{ objectFit: "contain" }}
                className="p-1 opacity-90 group-hover:opacity-100 transition-opacity"
                priority 
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </CardContent> */}
            {/* <CardFooter className="p-3 bg-black/40 backdrop-blur-sm justify-center border-none">
              <Button asChild variant="default" className="w-full sm:w-auto font-semibold text-base py-3 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/darshanam">
                  Sadguru Darshanam <LucideArrowUpRightSquare className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardFooter> */}
          {/* </Card>
        </div> */}

        {/* SlokaCarousel is now the main component after greeting, will have the button added to it directly */}
        <div className="my-4 md:my-6 card-hover-effect rounded-xl" onClick={handleUserInteraction}>
          <SlokaCarousel />
        </div>

        {/* BalaSwamiji's Blessings Card - Now Flippable */}
        <Card className="w-full overflow-hidden rounded-xl shadow-lg bg-card/80 backdrop-blur-md transition-shadow duration-300 my-4 md:my-6 card-hover-effect">
          {!showBlessingsText ? (
            // FRONT OF THE CARD (Image + Button)
            <>
              <CardContent className="p-0 relative aspect-video flex flex-col items-center justify-center">
                <Image 
                  src="/images/balaswamiji.png" 
                  alt="BalaSwamiji" 
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-90 group-hover:opacity-100 transition-opacity"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </CardContent>
              <CardFooter className="p-3 bg-black/40 backdrop-blur-sm border-t border-border/50 justify-center">
                <Button 
                  onClick={() => setShowBlessingsText(true)} 
                  className="w-full sm:w-auto font-semibold text-base py-3 px-6 bg-primary text-primary-foreground hover:bg-primary/90 smooth-all hover:scale-105"
                >
                  Sri Bala Swamiji's Message
                </Button>
              </CardFooter>
            </>
          ) : (
            // BACK OF THE CARD (Scrollable Text)
            <>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-primary flex items-center">
                    <BookOpen className="mr-2 h-6 w-6 text-primary" /> BalaSwamiji's Blessings
                  </CardTitle>
                  {/* <CardDescription className="text-muted-foreground">Words of wisdom.</CardDescription> */}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowBlessingsText(false)} 
                  className="text-white hover:bg-white/10 rounded-full"
                  aria-label="Close blessings"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px] p-1 pr-3">
                  <Box sx={{ color: 'hsl(var(--foreground))' }}>
                    {balaswamijiAnugrahaBhashanam.map((paragraph, index) => (
                      <Typography key={index} variant="body1" paragraph sx={{ color: 'hsl(var(--foreground))', mb: 1.5, '&:last-child': { mb: 0 } }}>
                        {paragraph}
                      </Typography>
                    ))}
                  </Box>
                </ScrollArea>
              </CardContent>
            </>
          )}
        </Card>

        <Dialog open={isGuideModalOpen} onOpenChange={setIsGuideModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border smooth-all">
            <DialogHeader>
              <DialogTitleComponent className="content-header">User Guide</DialogTitleComponent>
              <DialogDescriptionComponent className="content-subheading">
                Learn how to use Sri Guru Dig Vandanam effectively.
              </DialogDescriptionComponent>
            </DialogHeader>
            <button 
              onClick={() => setIsGuideModalOpen(false)}
              className="close-button"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <ScrollArea className="card-content">
              <Box sx={{ p: { xs: 1.5, sm: 2.5 }, color: 'white' }}>
                {/* <Typography variant="h5" component="h3" sx={{ color: 'primary.light', mt: 1, mb: 1.5, fontWeight: 'medium' }}>
                  User Guide:
                </Typography> */}
                {userGuideContent.map((paragraph, index) => (
                  <Typography
                    key={`guide-${index}`}
                    variant="body1"
                    paragraph
                    sx={{ mb: 1.5, lineHeight: 1.7, color: 'white' }}
                    dangerouslySetInnerHTML={{
                      __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFD700;">$1</strong>')
                    }}
                  />
                ))}
              </Box>
            </ScrollArea>
          </DialogContent>
        </Dialog>

    </div>
    </ResponsiveDrawer>
  );
}
