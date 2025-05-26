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

  {/* Blurred Banner at Bottom */}
  <div className="absolute bottom-0 w-full bg-black/30 backdrop-blur-sm p-2 text-center">
    <p className="text-sm font-medium" style={{ color: "gold" }}>
      {currentMessage}
    </p>
  </div>
</Card>


  );
}
