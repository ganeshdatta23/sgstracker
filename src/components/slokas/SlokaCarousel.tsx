"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SLOKAS = [
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
  }
];

const ROTATION_INTERVAL = 10000; // 10 seconds

export default function SlokaCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % SLOKAS.length);
        setIsVisible(true);
      }, 500);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + SLOKAS.length) % SLOKAS.length);
      setIsVisible(true);
    }, 500);
  };

  const handleNext = () => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % SLOKAS.length);
      setIsVisible(true);
    }, 500);
  };

  return (
    <Card className="w-full overflow-hidden bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
      <div className="relative p-6 min-h-[200px] flex flex-col items-center justify-center">
        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-primary hover:bg-primary/10 z-10"
          onClick={handlePrevious}
          aria-label="Previous sloka"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:bg-primary/10 z-10"
          onClick={handleNext}
          aria-label="Next sloka"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Sloka Content */}
        <div
          className={`text-center transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p
            className="text-lg sm:text-xl mb-4 text-warning-light"
            style={{
              fontFamily: 'Sanskrit_2003, Arial, sans-serif',
              lineHeight: 1.8,
            }}
          >
            {SLOKAS[currentIndex].text}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground italic">
            {SLOKAS[currentIndex].translation}
          </p>
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          {SLOKAS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-4 bg-primary'
                  : 'w-1.5 bg-primary/30'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
} 