"use client";

import { useSwamijiLocation } from '@/hooks/useSwamijiLocation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Compass, ChevronDown, ChevronUp, LucideArrowUpRightSquare, AlertCircle, BookOpen, MessageSquare, Sparkles, Users, Info, Music, Volume2, VolumeX } from 'lucide-react';
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
  const [isBlessingsModalOpen, setIsBlessingsModalOpen] = useState(false);
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);
  const { toast } = useToast();

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
    "**Finding Appaji:** The app attempts to show Pujya Sri Swamiji\\'s current location. If available, you\\'ll see it on the map and the direction to face from your location.",
    "**Darshanam View:** Use the \\'Sadguru Darshanam\\' feature for an AR experience. When your device points towards Appaji, a special Darshan view will appear.",
    "**Compass Accuracy:** For best results, ensure your phone\\'s compass is calibrated. Moving in a figure-eight pattern can help.",
    "**Location Permissions:** You\\'ll need to grant location permissions for the app to determine your position and the direction to Appaji.",
    "**Slokas & Messages:** Enjoy spiritual verses and messages for daily inspiration.",
    "Sri Swamiji has specifically instructed that we should always look towards His Lotus Feet when doing Namaskaram. The compass feature of this app is a tool to help devotees orient themselves towards Swamiji\\'s current physical location for this purpose.",
    "This app also uses the device compass for iPhone users and GPS/camera for Android users to enhance the AR Darshan experience.",
    "Pujya Appaji\\'s location is updated by administrators. The location shown is the latest available.",
    "The messages in the app are sourced from Pujya Sri Swamiji\\'s discourses and published materials like Bhakti Mala, Antarvani etc. For this version, some generic spiritual messages and slokas are included.",
    "For accurate direction, especially indoors or near large metal objects, compass readings can be affected. Try to be in an open area if possible for initial calibration.",
    "The AR Darshan view will show a full-screen image of Sri Swamiji with a calming video background when you are correctly oriented.",
    "A \\'Close Darshan\\' button will be available to exit the full-screen AR view.",
    "The initial slokas popup is now scrollable.",
    "Administrators can update Sri Swamiji\\'s location via a secure interface, ensuring the information is current.",
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
    "True devotion is not just about rituals; it is about constant remembrance and living by the Guru\\'s teachings. SGS Posts",
    "The path of spirituality requires patience, perseverance, and unwavering faith in the Sadguru. SGS Posts",
    "Every experience, good or bad, is a lesson from the Guru designed for your spiritual growth. Learn from it and move forward. SGS Posts",
    "The Guru\\'s grace is like an ocean. It is up to you how much you can receive with the vessel of your devotion. SGS Posts",
    "Sri Swamiji once explained that when He is on tour, His subtle body often remains at the Ashram. Thus, even when He is physically distant, connecting with the Ashram is connecting with Him. SGS Posts",
    "Pujya Sri Swamiji has often emphasized the importance of respecting and preserving nature, seeing divinity in all elements. SGS Posts",
    "The essence of all scriptures and teachings can be found in the Guru\\'s words and actions. Pay close attention. SGS Posts",
    "Humility and a genuine thirst for knowledge are key requisites for a spiritual seeker. Approach the Guru with an open heart. SGS Posts",
  ];
  
  const balaswamijiBlessingsContent = [
    "It is said that we should bow down in reverence toward the direction where holy places like Kashi, Gaya, or Mysore are located. Similarly, wherever our Sadguru travels or stays, we should prostrate ourselves in that direction, with the deep feeling that our Sadguru is always with us at all times. We must have the unwavering faith that our Guru is none other than Lord Srinath Himself.",
    "Sri Balaswamiji fondly remembered the service rendered by Gangadhar, the renowned artist who created the cover page of the Bhajana Yogam book, as well as the devoted service of the late Chandrashekaraiah, who used to accompany Swamiji on His tours.",
    "Gurugita discourse by Sri Datta Vijayananda Teertha Swamiji during his first Chaturmasya Vrata – 2004."
  ];
  
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
    if (!hasInteracted) setHasInteracted(true); // Register interaction
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

  if (swamijiLocationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-foreground p-4" onClick={handleUserInteraction}>
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
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 text-destructive border-destructive-foreground/50 hover:bg-destructive/80">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" onClick={handleUserInteraction}>
      <audio ref={backgroundAudioRef} src="/audio/SpotiDownloader (mp3cut.net).mp3" loop preload="auto" />

      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" // Changed to icon size for a smaller footprint initially
          onClick={toggleBackgroundAudio}
          className="p-2.5 rounded-full shadow-lg bg-card/80 hover:bg-card/95 transition-all duration-200 ease-in-out group"
          aria-label={isBackgroundAudioPlaying ? "Mute background music" : "Play background music"}
        >
          {isBackgroundAudioPlaying ? 
            <Volume2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" /> : 
            <VolumeX className="h-5 w-5 text-muted-foreground group-hover:scale-110 transition-transform" />
          }
        </Button> 

        <Button 
          variant="outline" 
          size="icon" // Changed to icon size
          onClick={() => { setIsDisclaimerModalOpen(true); handleUserInteraction(); }}
          className="p-2.5 rounded-full shadow-lg bg-card/80 hover:bg-card/95 transition-all duration-200 ease-in-out group"
          aria-label="View Disclaimer"
        >
          <Info className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
        </Button> 
      </div>
      
      <Dialog open={isDisclaimerModalOpen} onOpenChange={setIsDisclaimerModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitleComponent className="text-primary text-xl">Disclaimer</DialogTitleComponent>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-3 text-sm text-card-foreground/90 py-2">
              <p className="font-semibold text-lg text-center text-primary">Jaya Guru Datta</p>
              <p>This app is a tool to have darshan of Appaji daily as per our guru gita shiva guru instructed cleary every day starting one show pray to guru and do sastanga pranamam to guru deva in which Gurudeva resides.</p>
              <blockquote className="border-l-4 border-accent pl-3 italic text-foreground/80 my-2 text-sm">
                śrīnātha caraṇa dvandvaṁ yasyāṁ diśi virājatē ।<br />
                tasyai diśē namaskuryāt bhaktyā pratidinaṁ priyē ll
              </blockquote>
              <p>When we offer our obeisance to Guru, Swamiji directs us to offer it mainly at his feet and also affirms that the side in which the Guru\'s feet are, is equally great.</p>
              <p>Oh Pārvati! You should offer your obeisance every day to the side or direction in which your Lord Gurju's feet rest.</p>
              <p>Swamiji here says that Guru stands for the Lord (Srīnātha). This shows that he is the personification of Vishnu, giver of wealth, auspicious and not only an embodiment of prosperity but also the form of pure dynamism. The term \'Srīnātha\' has so many connotations.</p>
              <p>The direction in which the Guru\'s lotus feet are, should be offered obeisance, says Swamiji\"; but when he is the purified form of dynamism his feet will be in all directions and this need not be overemphasised.</p>
              <p className="font-semibold mt-2">Preamble: At the time of worshipping Guru, Swamiji teaches us as to how we should conduct ourselves.</p>
              <hr className="my-3 border-border/30" />
              <p className="text-xs text-muted-foreground">This app is developed by a Datta Devotee and is not officially affiliated with Avadhootha Datta Peetham.</p>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button type="button" variant="default" onClick={() => { setIsDisclaimerModalOpen(false); handleUserInteraction(); }}>
              Accept and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <PersonalizedGreeting locationName={locationNameForGreeting} />
      <div className="my-6" onClick={handleUserInteraction}>
         <Card className="shadow-lg bg-card/80 backdrop-blur-md hover:shadow-primary/30 transition-shadow duration-300 flex flex-col rounded-xl overflow-hidden min-h-[280px]" onClick={handleUserInteraction}>
          <CardContent className="flex-grow p-0 relative">
            <Image
              src="/images/appaji-sitting-smile.png"
              alt="Appaji Darshanam"
              fill
              style={{ objectFit: "contain" }}
              className="p-2 opacity-90 group-hover:opacity-100 transition-opacity"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </CardContent>
          <CardFooter className="p-4 bg-black/30 backdrop-blur-sm border-t border-border/50 relative z-10">
            <Button asChild variant="default" className="w-full" onClick={handleUserInteraction}>
              <Link href="/darshanam">
                Sadguru Darshanam <LucideArrowUpRightSquare className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <SlokaCarousel />
      </div>

     

        
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" onClick={handleUserInteraction}>
        <Card className="shadow-lg bg-card/80 backdrop-blur-md hover:shadow-primary/30 transition-shadow duration-300 flex flex-col rounded-xl overflow-hidden min-h-[280px] md:col-span-1" onClick={handleUserInteraction}>
  <CardContent className="flex-grow flex flex-col items-center justify-start">
    <div className="relative w-full h-56"> {/* fixed height */}
      <Image
        src="/images/balaswamiji.png"
        alt="Appaji Darshanam"
        fill
        style={{ objectFit: "contain" }}
        className="p-2 opacity-90 group-hover:opacity-100 transition-opacity"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>

    {/* Button BELOW the image */}
    <div className="mt-4 w-full flex justify-center">
      <Dialog open={isBlessingsModalOpen} onOpenChange={(open) => {setIsBlessingsModalOpen(open); if(open) handleUserInteraction();}}>
        <DialogTrigger asChild>
          <Button variant="default" className="w-full sm:w-auto" onClick={handleUserInteraction}>
            <Users className="mr-2 h-4 w-4" /> Anugraha Sandesham
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitleComponent className="text-primary text-xl">
              BalaSwamiji's Blessings
            </DialogTitleComponent>
            <DialogDescriptionComponent className="text-muted-foreground">
              Guidance for devotees.
            </DialogDescriptionComponent>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-4 text-sm text-card-foreground/90 py-2">
              {balaswamijiBlessingsContent.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </CardContent>
</Card>
      </div>

        

        <Card className="shadow-lg bg-card/80 backdrop-blur-md hover:shadow-primary/30 transition-shadow duration-300 flex flex-col rounded-xl overflow-hidden min-h-[280px]" onClick={handleUserInteraction}>
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500">
              <User className="mr-3 h-6 w-6 text-accent" /> 
              Guru Connect
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-1">Locate Appaji and find your bearing.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
          <Accordion type="single" collapsible className="w-full" onValueChange={(value) => {handleAccordionChange(value); handleUserInteraction();}} value={accordionValue}>
              <AccordionItem value="dashboard-item" className="border-b-0">
                <AccordionTrigger className="text-base hover:no-underline focus:no-underline text-foreground/90 py-3">
                  <span className="flex items-center">
                    {accordionValue === "dashboard-item" ? <ChevronUp className="mr-2 h-5 w-5 text-accent"/> : <ChevronDown className="mr-2 h-5 w-5 text-accent" />}
                    Direction to Sadguru
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-3 text-xs sm:text-sm">
                  {!userGeoLocation && !isFetchingUserLocation && (
                      <Button onClick={fetchUserLocation} variant="outline" className="w-full text-sm">
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
                    <div className="p-2 bg-background/50 rounded-md">
                      <h4 className="font-semibold text-accent mb-1 text-sm">Your Location:</h4>
                      <p className="text-foreground/80">Lat: {userGeoLocation.latitude.toFixed(3)}, Lng: {userGeoLocation.longitude.toFixed(3)}</p>
                    </div>
                  )}

                  <div className="p-2 bg-background/50 rounded-md">
                    <h4 className="font-semibold text-accent mb-1 text-sm">Appaji's Location:</h4>
                    {swamijiLocationLoading && <Skeleton className="h-8 w-3/4 rounded-md" />}
                    {swamijiLocationError && <p className="text-destructive text-xs">Error loading Appaji's location.</p>}
                    {locationData && (
                      <>
                        <p className="text-foreground/80">{locationData.address || `Lat: ${locationData.latitude.toFixed(3)}, Lng: ${locationData.longitude.toFixed(3)}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Updated: {format(new Date(locationData.updatedAt), 'PPp')}</p>
                      </>
                    )}
                    {!locationData && !swamijiLocationLoading && !swamijiLocationError && <p className="text-muted-foreground text-xs">Appaji's location data is currently unavailable.</p>}
                  </div>
                  
                  {userGeoLocation && locationData && bearingToSwamiji !== null && (
                    <div className="p-3 bg-primary/10 rounded-md border border-primary/30">
                      <h4 className="font-semibold text-primary mb-1 text-sm">Direction to Appaji:</h4>
                      <p className="flex items-center text-foreground/90">
                        <Compass className="mr-2 h-4 w-4 text-primary" /> 
                        Face <b className="text-primary mx-1">{bearingToSwamiji.toFixed(0)}°</b> from North.
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      
      <Card className="shadow-lg bg-card/80 backdrop-blur-md hover:shadow-primary/30 transition-shadow duration-300 flex flex-col rounded-xl overflow-hidden min-h-[280px]" onClick={handleUserInteraction}>
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500">
              <BookOpen className="mr-3 h-6 w-6 text-accent" /> 
              Sacred Slokas
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-1">Verses for reflection and peace.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-center">
            <p className="text-center text-muted-foreground mb-4">Selected slokas for your inspiration.</p>
            <Button onClick={() => {setIsSlokaModalOpen(true); handleUserInteraction();}} variant="default" className="w-full sm:w-auto mx-auto">
              Read Slokas
            </Button>
          </CardContent>
        </Card>
      <Dialog open={isSlokaModalOpen} onOpenChange={(open) => {setIsSlokaModalOpen(open); if(open) handleUserInteraction();}}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border">
          <DialogHeader>
            <DialogTitleComponent className="text-primary text-xl">Sacred Slokas</DialogTitleComponent>
            <DialogDescriptionComponent className="text-muted-foreground">
              Contemplate these sacred verses.
            </DialogDescriptionComponent>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-3">
            <div className="space-y-6 py-2">
              {slokasContent.map((sloka, index) => (
                <div key={index} className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <p className="font-['Sanskrit_2003'] text-lg leading-relaxed whitespace-pre-line text-accent">
                    {sloka.text}
                  </p>
                  <hr className="my-3 border-border/30" />
                  <p className="text-sm text-card-foreground/80 italic">
                    {sloka.translation}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGuideModalOpen} onOpenChange={(open) => {setIsGuideModalOpen(open); if(open) handleUserInteraction();}}>
        <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-card/90 backdrop-blur-md border-primary/50 shadow-xl text-foreground max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitleComponent className="text-2xl text-primary">User Guide & Messages</DialogTitleComponent>
            <DialogDescriptionComponent className="text-muted-foreground">How to use GuruDarshini & Words of Wisdom.</DialogDescriptionComponent>
          </DialogHeader>
          <ScrollArea className="flex-grow relative z-10 h-full pr-2">
            <div className="space-y-4 p-1 text-foreground/90">
                <h3 className="text-xl font-semibold text-accent mt-4">User Guide:</h3>
                {userGuideContent.map((paragraph, index) => (
                <p key={`guide-${index}`} className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') }} />
                ))}
                <hr className="my-4 border-border"/>
                <h3 className="text-xl font-semibold text-accent mt-4">Spiritual Messages:</h3>
                {additionalSpiritualMessages.map((message, index) => (
                    <blockquote key={`msg-${index}`} className="border-l-4 border-accent pl-4 italic text-foreground/80 my-2">
                        {message}
                    </blockquote>
                ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
