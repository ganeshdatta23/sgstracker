'use client';

import { useEffect, useState } from 'react';
import { Card, CardFooter } from './card';
import { Button } from './button';
import Link from 'next/link';
import { LucideArrowUpRightSquare } from 'lucide-react';

const Shlokas = [
  {
    text: `శ్రీనాథ చరణ ద్వంద్వం యస్యాం దిశి విరాజతే\n తస్యై దిశే నమస్కుర్యాత్ భక్త్యా ప్రతిదినం ప్రియే ॥`,
    language: 'Telugu'
  },
  {
    text: `श्रीनाथ चरण द्वंद्वं यस्यां दिशि विराजते\nतस्यै दिशे नमस्कुर्याद् भक्त्या प्रतिदिनं प्रिये ॥` ,
    language: 'Sanskrit (Devanagari)'
  },
  {
    text: `ஸ்ரீநாத சரண த்வந்த்வம் யஸ்யாம் திசி விராஜதே\n தஸ்யை திஶே நமஸ்குர்யாத் பக்த்யா ப்ரதிதினம் ப்ரியே ॥`,
    language: 'Tamil'
  },
  {
    text: `ಶ್ರೀನಾಥ ಚರಣ ದ್ವಂದ್ವಂ ಯಸ್ಯಾಂ ದಿಶಿ ವಿರಾಜತೇ\n ತಸ್ಯೈ ದಿಶೇ ನಮಸ್ಕುರ್ಯಾತ್ ಭಕ್ತ್ಯಾ ಪ್ರತಿದಿನಂ ಪ್ರಿಯೇ ॥`,
    language: 'Kannada'
  },
  {
    text: `śrīnātha-caraṇa-dvandvaṁ yasyṁ diśi virājate\n tasyai diśē namaskuryāt bhaktyā pratidinaṁ priyē ॥`,
    language: 'English'
  }
];

export function SlokaCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Shlokas.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4">
      <Card
        className={`
          relative overflow-hidden rounded-2xl
          shadow-[0_0_25px_rgba(0,0,0,0.3)]
          transition-all duration-700 ease-in-out
          bg-cover bg-center flex flex-col justify-between
        `}
        style={{
          backgroundImage: `url('/images/WhatsApp%20Image%202025-05-14%20at%2005.32.34_bf581637.jpg')`,
          minHeight: '350px'
        }}
      >
        <div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="relative z-10 p-6 min-h-[250px] flex flex-col items-center justify-center text-center transition-opacity duration-1000">
            <pre className="font-['Sanskrit_2003'] text-lg sm:text-xl md:text-2xl leading-relaxed text-white whitespace-pre-line mb-4">
            <p>{Shlokas[currentIndex].text.split('\n')[0]}</p>
            <p>{Shlokas[currentIndex].text.split('\n')[1]}</p>
            </pre>
            <p className="text-blue-100/60 text-sm">{Shlokas[currentIndex].language}</p>
          </div>
        </div>

        <CardFooter className="relative z-10 p-3 bg-black/50 backdrop-blur-sm border-[hsla(var(--primary),0.3)] justify-center mt-auto">
          <Button asChild variant="default" className="w-full sm:w-auto font-semibold text-base py-3 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/darshanam">
              Pujya Appaji's Direction <LucideArrowUpRightSquare className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="flex justify-center mt-4 space-x-2">
        {Shlokas.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-primary w-4'
                : 'bg-primary/30 hover:bg-primary/50'
            }`}
            aria-label={`Go to sloka ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default SlokaCarousel;
