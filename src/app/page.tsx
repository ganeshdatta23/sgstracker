"use client";

import { useSwamijiLocation } from '@/hooks/useSwamijiLocation';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Compass, ChevronDown, ChevronUp, LucideArrowUpRightSquare, AlertCircle, BookOpen, MessageSquare, Sparkles, Users, Info, Music, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState, Fragment, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription as AlertDesc } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitleComponent, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculateBearing } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { SlokaCarousel } from '@/components/ui/sloka-carousel';
import ResponsiveDrawer from '@/components/layout/ResponsiveDrawer';
import { Typography, Box } from '@mui/material';

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
      text: `गुरुर्ब्रह्मा गुरुर्विष्णुर्गुरुर्देवो महेश्वरः ।
गुरुः साक्षात् परं ब्रह्म तस्मै श्रीगुरवे नमः ॥`,
      translation: "The Guru is Brahma, the Guru is Vishnu, the Guru Deva is Maheswara (Shiva). The Guru is Verily the Para Brahman (Supreme Reality). Salutations to that Guru."
    },
    {
      text: `अज्ञानतिमिरान्धस्य ज्ञानाञ्जनशलाकया ।
चक्षुरुन्मीलितं येन तस्मै श्रीगुरवे नमः ॥`,
      translation: "Salutations to the Guru who opens the eyes of one blinded by the darkness of ignorance with the collyrium (kajal) of knowledge."
    },
    {
      text: `ध्यानमूलं गुरोर्मूर्तिः पूजामूलं गुरोः पदम् ।
मन्त्रमूलं गुरोर्वाक्यं मोक्षमूलं गुरोः कृपा ॥`,
      translation: "The Guru's form is the root of meditation, the Guru's feet are the root of worship, the Guru's word is the root of Mantra, the Guru's grace is the root of liberation."
    },
  ];

  const userGuideContent = [
    "Welcome to GuruDarshini, your spiritual companion app!",
    "**Finding Appaji:** The app attempts to show Pujya Sri Swamiji's current location. If available, you'll see it on the map and the direction to face from your location.",
    "**Darshanam View:** Use the 'Sadguru Darshanam' feature for an AR experience. When your device points towards Appaji, a special Darshan view will appear.",
    "**Compass Accuracy:** For best results, ensure your phone's compass is calibrated. Moving in a figure-eight pattern can help.",
    "**Location Permissions:** You'll need to grant location permissions for the app to determine your position and the direction to Appaji.",
    "**Slokas & Messages:** Enjoy spiritual verses and messages for daily inspiration.",
    "Sri Swamiji has specifically instructed that we should always look towards His Lotus Feet when doing Namaskaram. The compass feature of this app is a tool to help devotees orient themselves towards Swamiji's current physical location for this purpose.",
    "This app also uses the device compass for iPhone users and GPS/camera for Android users to enhance the AR Darshan experience.",
    "Pujya Appaji's location is updated by administrators. The location shown is the latest available.",
    "The messages in the app are sourced from Pujya Sri Swamiji's discourses and published materials like Bhakti Mala, Antarvani etc. For this version, some generic spiritual messages and slokas are included.",
    "For accurate direction, especially indoors or near large metal objects, compass readings can be affected. Try to be in an open area if possible for initial calibration.",
    "The AR Darshan view will show a full-screen image of Sri Swamiji with a calming video background when you are correctly oriented.",
    "A 'Close Darshan' button will be available to exit the full-screen AR view.",
    "The initial slokas popup is now scrollable.",
    "Administrators can update Sri Swamiji's location via a secure interface, ensuring the information is current.",
    "This app uses the Haversine formula to calculate the great-circle distance and bearing to Sri Swamiji, ensuring accurate directional guidance.",
    "The app features a neon gold and red theme for a divine visual experience.",
    "The initial greeting message and slokas are now presented in a more engaging animated card carousel.",
    "Remember to keep your app updated for the latest features and improvements.",
    "Jai Guru Datta!"
  ];
  const additionalSpiritualMessages = [
    "Music is the language of God. We are all His instruments. The aim is to become a perfect divine flute to express His music - Nada Brahma. HH Sri Swamiji",
    "Meditation is the only way to truly know God. HH Sri Swamiji",
    "The Guru is the one who removes the darkness of ignorance. HH Sri Swamiji",
    "Selfless service is the highest form of worship. HH Sri Swamiji",
    "Love all beings as manifestations of God. HH Sri Swamiji",
    "Datta Kriya Yoga is a scientific technique for spiritual evolution. HH Sri Swamiji",
    "Chant the divine name with faith and devotion. HH Sri Swamiji",
    "Surrender your ego at the feet of the Guru. HH Sri Swamiji",
    "Your body is a temple. Keep it pure and healthy. HH Sri Swamiji",
    "Life is a journey from the self, through the self, to the Self. HH Sri Swamiji",
    "When you are in the physical presence of Sadguru, every moment is precious. Do not waste it in worldly thoughts or conversations. Absorb the divine vibrations. SGS Posts",
    "True devotion is not just about rituals; it is about constant remembrance and living by the Guru's teachings. SGS Posts",
    "The path of spirituality requires patience, perseverance, and unwavering faith in the Sadguru. SGS Posts",
    "Every experience, good or bad, is a lesson from the Guru designed for your spiritual growth. Learn from it and move forward. SGS Posts",
    "The Guru's grace is like an ocean. It is up to you how much you can receive with the vessel of your devotion. SGS Posts",
    "Sri Swamiji once explained that when He is on tour, His subtle body often remains at the Ashram. Thus, even when He is physically distant, connecting with the Ashram is connecting with Him. SGS Posts",
    "Pujya Sri Swamiji has often emphasized the importance of respecting and preserving nature, seeing divinity in all elements. SGS Posts",
    "The essence of all scriptures and teachings can be found in the Guru's words and actions. Pay close attention. SGS Posts",
    "Humility and a genuine thirst for knowledge are key requisites for a spiritual seeker. Approach the Guru with an open heart. SGS Posts",
  ];
  
  // Updated content for BalaSwamiji's Blessings card (back side)
  const balaswamijiAnugrahaBhashanam = [
    "It is said that we should bow down in reverence towards the direction where holy places like Kashi, Gaya, or Mysore are located. Similarly, wherever our Sadguru Pujya Sri Appaji travels or stays, we should prostrate ourselves in that direction, with the deep feeling that our Sadguru is always with us at all times. We must have the unwavering faith that our Sadguru is none other than Lord Srinatha Himself.",
    "~ Chaturmasya Deeksha at 2004",
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

  if (swamijiLocationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-foreground p-4 bg-[#0C0A09]" onClick={handleUserInteraction}>
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 animate-pulse text-primary" />
          <p className="text-lg">Loading Guru\'s Grace...</p>
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
    >
      <div className="container sm:mx-auto px-0" onClick={handleUserInteraction}>
      <audio ref={backgroundAudioRef} src="/audio/SpotiDownloader (mp3cut.net).mp3" loop preload="auto" />

        <div className="fixed bottom-20 right-5 z-50 flex items-center gap-3">
        <Button 
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
        </Button> 
      </div>
        
        <Dialog open={isGuruConnectModalOpen} onOpenChange={setIsGuruConnectModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border smooth-all">
            <DialogHeader className="pb-2">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Compass className="mr-2 h-6 w-6 text-accent" />
                <Typography variant="h6" component="h2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Guru Connect
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', pl: '32px' }}>
                Locate Appaji and find your bearing.
              </Typography>
          </DialogHeader>
            <ScrollArea className="max-h-[calc(70vh-60px)] p-0 pr-1 mt-0">
              <Accordion type="single" collapsible className="w-full" onValueChange={handleAccordionChange} value={accordionValue} defaultValue="dashboard-item">
                <AccordionItem value="dashboard-item" className="border-b-0 px-2">
                <AccordionTrigger className="text-base hover:no-underline focus:no-underline text-foreground/90 py-3">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {accordionValue === "dashboard-item" ? 
                        <ChevronUp className="mr-2 h-5 w-5 text-accent"/> : 
                        <ChevronDown className="mr-2 h-5 w-5 text-accent" />}                     
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Direction to Sadguru
                      </Typography>
                    </Box>
                </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-1 space-y-3 text-xs sm:text-sm">
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
                  {userGeoLocation && (
                      <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 0.5, fontWeight: 'medium' }}>Your Location:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Lat: {userGeoLocation.latitude.toFixed(3)}, Lng: {userGeoLocation.longitude.toFixed(3)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 0.5, fontWeight: 'medium' }}>Appaji's Location:</Typography>
                    {swamijiLocationLoading && <Skeleton className="h-8 w-3/4 rounded-md" />}
                      {swamijiLocationError && <Typography variant="caption" sx={{color: 'error.main'}}>Error loading Appaji's location.</Typography>}
                    {locationData && (
                      <>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{locationData.address || `Lat: ${locationData.latitude.toFixed(3)}, Lng: ${locationData.longitude.toFixed(3)}`}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5 }} display="block">Updated: {format(new Date(locationData.updatedAt), 'PPp')}</Typography>
                        </>
                      )}
                      {!locationData && !swamijiLocationLoading && !swamijiLocationError && <Typography variant="caption" sx={{color: 'text.disabled'}}>Appaji's location data is currently unavailable.</Typography>}
                    </Box>
                    {userGeoLocation && locationData && bearingToSwamiji !== null && (
                      <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>Direction to Appaji:</Typography>
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                          <Compass className="mr-1 h-4 w-4" /> 
                          <Typography variant="body2">Face <Typography component="b" sx={{fontWeight: 'bold', mx: 0.5}}>{bearingToSwamiji.toFixed(0)}°</Typography> from North.</Typography>
                        </Box>
                      </Box>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            </ScrollArea>
            <DialogFooter className="mt-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setIsGuruConnectModalOpen(false)} className="text-primary border-primary hover:bg-primary/10 smooth-all hover:scale-105">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isDisclaimerModalOpen} onOpenChange={setIsDisclaimerModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border smooth-all">
            <DialogHeader>
              <DialogTitleComponent className="text-primary text-xl">Disclaimer</DialogTitleComponent>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
              <Box sx={{ py: 2, px: { xs: 1, sm: 2 }, color: 'text.primary' }}>
                <Typography variant="h6" component="h2" align="center" sx={{ color: 'primary.main', mb: 2, fontWeight: 'bold' }}>
                  Jaya Guru Datta
                </Typography>
                
<Typography variant="body1" paragraph sx={{ mb: 1.5 }}>
                  GuruDarshini is a humble tool designed for Datta devotees to offer daily pranāms (obeisance) toPujya Sri Appaji, as instructed in the Guru Gītā in the direction ofPujya Appaji's current location.
                </Typography>
                <Box sx={{ borderLeft: 4, borderColor: 'primary.light', pl: 2, my: 2, fontStyle: 'italic', bgcolor: 'action.hover' }}>
                  <Typography variant="body2" component="blockquote" sx={{ color: 'text.secondary' }}>
                    śrīnātha caraṇa dvandvaṁ yasyāṁ diśi virājatē ।<br />
                    tasyai diśē namaskuryāt bhaktyā pratidinaṁ priyē ||
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph sx={{ mb: 1.5 }}>
"O beloved, one should bow every day with devotion in the direction where the feet of the revered Guru, Srīnātha, shine forth."
Swamiji explains that we should offer our obeisance primarily at the feet of the Guru, and the direction in which the Guru's feet reside becomes sacred.
                </Typography>  
                <Typography variant="body1" paragraph sx={{ mb: 1.5 }}>
Swamiji explains that we should offer our obeisance primarily at the feet of the Guru, and the direction in which the Guru's feet reside becomes sacred.
"Guru stands for Srīnātha – the Lord Himself. The Guru is the embodiment of Vishnu, the bestower of auspiciousness, wealth, and divine energy. His lotus feet sanctify all directions."                </Typography>  
                <Typography variant="body1" paragraph sx={{ mb: 1.5 }}>
                 Therefore, wherever the Guru's presence is felt, that direction becomes worthy of worship.                </Typography>
                <Typography variant="subtitle1" component="h3" sx={{ mt: 2, mb: 1, fontWeight: 'medium' }}>
Note
This tool is lovingly developed and maintained by a team of Datta devotees as a humble offering toPujya Sri Appaji, with the blessings of Pujya Sri Datta Prabhu Appaji and under the guidance of Pujya Bala Swamiji.
                </Typography>
                <hr className="my-3 border-border/30" />
                <Typography variant="caption" display="block" align="center" sx={{ color: 'text.disabled', mt: 2 }}>
                  This app is developed by a Datta Devotee and is not officially affiliated with Avadhootha Datta Peetham.
                </Typography>
              </Box>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button 
                variant="default" 
                onClick={() => { setIsDisclaimerModalOpen(false); handleUserInteraction(); }} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 smooth-all hover:scale-105"
              >
                Accept and Continue
            </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
      <Dialog open={isSlokaModalOpen} onOpenChange={(open) => {setIsSlokaModalOpen(open); if(open) handleUserInteraction();}}>
          <DialogContent className="sm:max-w-[600px] bg-card border-border smooth-all">
          <DialogHeader>
            <DialogTitleComponent className="text-primary text-xl">Sacred Slokas</DialogTitleComponent>
            <DialogDescriptionComponent className="text-muted-foreground">
              Contemplate these sacred verses.
            </DialogDescriptionComponent>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-3">
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
                        whiteSpace: 'pre-line', 
                        color: 'warning.light',
                        mb: 1.5
                      }}
                    >
                    {sloka.text}
                    </Typography>
                    <hr className="my-2 border-border/30" />
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {sloka.translation}
                    </Typography>
                  </Box>
              ))}
              </Box>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
                <Button variant="outline" className="text-primary border-primary hover:bg-primary/10 smooth-all hover:scale-105">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <PersonalizedGreeting locationName={locationNameForGreeting} />
        
        {/* "Swamiji sitting smiling" Card REMOVED */}
        {/* 
        <div className="my-4 md:my-6" onClick={handleUserInteraction}>
          <Card className="w-full overflow-hidden rounded-xl shadow-lg bg-card/80 backdrop-blur-md hover:shadow-primary/30 transition-shadow duration-300">
            <CardContent className="p-0 relative aspect-[3/2] sm:aspect-video md:aspect-[16/9]">
              <Image 
                src="/images/appaji-sitting-smile.png" 
                alt="Appaji Darshanam" 
                fill 
                style={{ objectFit: "contain" }}
                className="p-1 opacity-90 group-hover:opacity-100 transition-opacity"
                priority 
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </CardContent>
            <CardFooter className="p-3 bg-black/40 backdrop-blur-sm border-t border-border/50 justify-center">
              <Button asChild variant="default" className="w-full sm:w-auto font-semibold text-base py-3 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/darshanam">
                  Sadguru Darshanam <LucideArrowUpRightSquare className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <SlokaCarousel />
        </div>
        */}

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
                  Read Anugraha Bhashanam
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
                  <CardDescription className="text-muted-foreground">Words of wisdom.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowBlessingsText(false)} className="text-primary border-primary hover:bg-primary/10 smooth-all hover:scale-105">
                  Close
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
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-card/90 backdrop-blur-md border-primary/50 shadow-xl text-foreground max-h-[80vh] flex flex-col smooth-all">
          <DialogHeader>
            <DialogTitleComponent className="text-2xl text-primary">User Guide & Messages</DialogTitleComponent>
            <DialogDescriptionComponent className="text-muted-foreground">How to use GuruDarshini & Words of Wisdom.</DialogDescriptionComponent>
          </DialogHeader>
          <ScrollArea className="flex-grow relative z-10 h-full pr-2">
              <Box sx={{ p: { xs: 1.5, sm: 2.5 }, color: 'text.primary' }}>
                <Typography variant="h5" component="h3" sx={{ color: 'primary.light', mt: 1, mb: 1.5, fontWeight: 'medium' }}>
                  User Guide:
                </Typography>
  {userGuideContent.map((paragraph, index) => (
                  <Typography
      key={`guide-${index}`}
                    variant="body1"
                    paragraph
                    sx={{ mb: 1.5, lineHeight: 1.7 }}
      dangerouslySetInnerHTML={{
                      __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFD700;">$1</strong>') // Style strong tag if needed
      }}
    />
  ))}

                <hr className="my-4 border-border" /> {/* Or MUI Divider */}

                <Typography variant="h5" component="h3" sx={{ color: 'primary.light', mt: 3, mb: 1.5, fontWeight: 'medium' }}>
                  Spiritual Messages:
                </Typography>
  {additionalSpiritualMessages.map((message, index) => (
                  <Box 
      key={`msg-${index}`}
                    component="blockquote"
                    sx={{ 
                      borderLeft: 4, 
                      borderColor: 'secondary.main', // Use theme secondary color for quote border
                      pl: 2, 
                      my: 2, 
                      fontStyle: 'italic', 
                      color: 'text.secondary', 
                      bgcolor: 'action.hover', 
                      py: 0.5, 
                      borderRadius: 1 
                    }}
                  >
                    <Typography variant="body1">
      {message}
                    </Typography>
                  </Box>
  ))}
              </Box>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
                <Button variant="outline" className="text-primary border-primary hover:bg-primary/10 smooth-all hover:scale-105">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </ResponsiveDrawer>
  );
}
