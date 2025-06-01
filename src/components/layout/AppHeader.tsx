import Link from 'next/link';
import { UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
// Image component is no longer needed if the logo is removed.
// import Image from 'next/image'; 

type Props = {
  locationName?: string;
};

export default function AppHeader({ locationName }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-background/70 backdrop-blur-sm border-b border-border shadow-md sticky top-0 z-50 text-foreground">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4"> {/* Group Title and Location/Time */}
          <Button asChild variant="ghost" className="p-0 hover:bg-transparent">
            <Link href="/" className="flex items-center gap-2 text-xl font-semibold">
              {/* 
                Image removed as per request
                <Image 
                  src="/images/sri-yantra-header-icon.png" 
                  alt="PROJECTNINE Icon" 
                  width={28} 
                  height={28}
                /> 
              */}
              <span>PROJECTNINE</span>
            </Link>
          </Button>

          {/* Location and Time Display - Moved here */}
          {locationName && (
            <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white border border-[#FFD700]/30 shadow-md">
              <p className="text-xs font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#FFD700' }}>Pujya Appaji at:</span> <span className="text-white/90">{locationName}</span>
                <span className="mx-2 text-[#FFD700]">|</span>
                <span style={{ color: '#FFD700' }}>Time:</span> 
                <span className="text-white/90">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Kolkata'
                  })} IST
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Navigation links pushed to the right */}
        <nav className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin" className="flex items-center gap-1">
              <UserCog size={16} />
              <span>Admin</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
