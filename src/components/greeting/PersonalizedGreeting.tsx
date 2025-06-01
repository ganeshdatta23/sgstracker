"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SPIRITUAL_MESSAGES } from "@/data/greetings";
import { Sparkles } from "lucide-react";
import type { ThemeProviderProps } from "next-themes";

// Define prop types
type Props = {
  locationName?: string;
};

const ROTATION_INTERVAL = 40000; // 40 seconds

export default function PersonalizedGreeting({ locationName }: Props) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const lastMessageRef = useRef("");

  const getRandomMessage = (exclude: string): string => {
    let newMessage;
    do {
      newMessage = SPIRITUAL_MESSAGES[Math.floor(Math.random() * SPIRITUAL_MESSAGES.length)];
    } while (newMessage === exclude && SPIRITUAL_MESSAGES.length > 1);
    return newMessage;
  };

  useEffect(() => {
    const firstMessage = getRandomMessage("");
    setCurrentMessage(firstMessage);
    lastMessageRef.current = firstMessage;

    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        const nextMessage = getRandomMessage(lastMessageRef.current);
        setCurrentMessage(nextMessage);
        lastMessageRef.current = nextMessage;
        setIsVisible(true);
      }, 1000);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
  <Card
    className="w-full h-[300px] relative rounded-xl overflow-hidden bg-black/5"
  >
    {/* YouTube Video Background */}
    <div className="absolute inset-0 w-full h-full">
      <iframe
        src="https://www.youtube.com/embed/bHNE4_f5PXQ?autoplay=1&controls=1&loop=1&playlist=bHNE4_f5PXQ"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        className="w-full h-full"
        style={{ border: 'none' }}
        title="Pujya Appaji Video"
      />
    </div>

    {/* Semi-transparent overlay for text areas only */}
    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent"></div>
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>

    {/* Blurred Banner at Bottom */}
    {/* <div className="absolute bottom-0 w-full bg-black/30 backdrop-blur-sm p-2 text-center">
      <p className="text-sm font-medium" style={{ color: "gold", fontFamily: 'Poppins, sans-serif' }}>
        {currentMessage}
      </p>
    </div> */}
  </Card>
  );
}
