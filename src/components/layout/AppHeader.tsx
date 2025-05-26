import Link from 'next/link';
import { UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Image component is no longer needed if the logo is removed.
// import Image from 'next/image'; 

export default function AppHeader() {
  return (
    <header className="bg-background/70 backdrop-blur-sm border-b border-border shadow-md sticky top-0 z-50 text-foreground">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Button asChild variant="ghost" className="p-0 hover:bg-transparent">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold">
            {/* 
              Image removed as per request
              <Image 
                src="/images/sri-yantra-header-icon.png" 
                alt="GuruDarshini Icon" 
                width={28} 
                height={28}
              /> 
            */}
            <span>GuruDarshini</span>
          </Link>
        </Button>
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
