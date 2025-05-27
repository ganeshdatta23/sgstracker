'use client';

import { useEffect, useState } from 'react';
import { Card } from './card';

const slokas = [
  {
    line1: `శ్రీనాథ చరణ ద్వంద్వం యస్యాం దిశి విరాజతే`,
    line2: `తస్యాం దిశే నమస్కుర్యాద్భక్త్యా ప్రతిదినం ప్రియే`,
    language: 'Telugu'
  },
  {
    line1: `श्रीनाथ चरण द्वंद्वं यस्यां दिशि विराजते`,
    line2: `तस्यां दिशे नमस्कुर्याद् भक्त्या प्रतिदिनं प्रिये`,
    language: 'Sanskrit (Devanagari)'
  },
  {
    line1: `ஸ்ரீநாத சரண த்வந்த்வம் யஸ்யாம் திசி விராஜதே`,
    line2: `தஸ்யாம் திசே நமஸ்குர்யாத் பக்த்யா ப்ரதிதினம் ப்ரியே`,
    language: 'Tamil'
  },
  {
    line1: `ಶ್ರೀನಾಥ ಚರಣ ದ್ವಂದ್ವಂ ಯಸ್ಯಾಂ ದಿಶಿ ವಿರಾಜತೇ`,
    line2: `ತಸ್ಯಾಂ ದಿಶೇ ನಮಸ್ಕುರ್ಯಾದ್ ಭಕ್ತ್ಯಾ ಪ್ರತಿದಿನಂ ಪ್ರಿಯೇ`,
    language: 'Kannada'
  },
  {
    line1: `śrīnātha-caraṇa-dvandvaṁ yasyāṁ diśi virājate`,
    line2: `tasyāṁ diśe namaskuryāt bhaktyā pratidinaṁ priye`,
    language: 'English'
  }
];

export function SlokaCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slokas.length);
    }, 10000); // Change every 10 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4">
      <Card
        className={`
          relative overflow-hidden rounded-2xl
          shadow-[0_0_25px_rgba(0,0,0,0.3)]
          transition-all duration-700 ease-in-out
          bg-cover bg-center
        `}
        style={{
          backgroundImage: `url('/images/WhatsApp%20Image%202025-05-14%20at%2005.32.34_bf581637.jpg')`,
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

        {/* Sloka text */}
        <div className="relative z-10 p-6 min-h-[250px] flex flex-col items-center justify-center text-center transition-opacity duration-1000">
  <div className="font-['Sanskrit_2003'] text-lg sm:text-xl md:text-2xl leading-relaxed text-white mb-4">
    <p>{slokas[currentIndex].line1}</p>
    <p>{slokas[currentIndex].line2}</p>
  </div>
  <p className="text-blue-100/60 text-sm">{slokas[currentIndex].language}</p>
</div>

      </Card>

      {/* Navigation dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {slokas.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-blue-400 w-4'
                : 'bg-blue-400/30 hover:bg-blue-400/50'
            }`}
            aria-label={`Go to sloka ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default SlokaCarousel;
