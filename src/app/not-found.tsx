'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground mb-4">The page you are looking for does not exist.</p>
        <Button asChild variant="default">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
} 