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
    {/* Background Image */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/dattapeetham_7e154e37ea24615612494ddffa91e134.jpg')",
      }}
    ></div>

    {/* Location and Time Overlay */}
    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm p-2.5 rounded-lg text-white border border-[#FFD700]/30 shadow-lg" style={{ maxWidth: '200px' }}>
      <p className="text-xs font-medium" style={{ 
        fontFamily: 'Poppins, sans-serif',
        color: '#FFD700' // Gold color for the header
      }}>
        Pujya Appaji at: <br /> 
        <span className="text-white/90">{locationName}</span>
      </p>
      <p className="text-xs mt-1" style={{ 
        fontFamily: 'Poppins, sans-serif',
        color: '#FFD700' // Gold color for the header
      }}>
        Time: <span className="text-white/90">
          {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: 'Asia/Kolkata'
          })} IST
        </span>
      </p>
    </div>

    {/* Blurred Banner at Bottom */}
    <div className="absolute bottom-0 w-full bg-black/30 backdrop-blur-sm p-2 text-center">
      <p className="text-sm font-medium" style={{ color: "gold", fontFamily: 'Poppins, sans-serif' }}>
        {currentMessage}
      </p>
    </div>
  </Card>
  );
}
