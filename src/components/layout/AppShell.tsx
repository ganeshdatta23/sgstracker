'use client';

import type { ReactNode } from 'react';
import AppHeader from './AppHeader';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isDarshanamPage = pathname === '/darshanam';

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className={`relative min-h-screen flex flex-col font-sans text-foreground ${isDarshanamPage ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
        {/* Conditionally render starry background */}
        {!isDarshanamPage && (
          <div className="starry-background" aria-hidden="true">
            <div className="stars-layer stars1"></div>
            <div className="stars-layer stars2"></div>
            <div className="stars-layer stars3"></div>
          </div>
        )}

        {/* Conditionally render AppHeader */}
        {!isDarshanamPage && <AppHeader />}

        {/* Main content */}
        <main 
          className={`flex-grow relative ${isDarshanamPage ? 'z-0' : 'z-10 container mx-auto px-4 py-8'}`}
        >
          <div className={`w-full ${isDarshanamPage ? 'h-full' : 'glass-card text-foreground'}`}>
            {children}
          </div>
        </main>

        {/* Conditionally render Footer */}
        {!isDarshanamPage && (
          <footer className="bg-black/60 text-center py-4 text-sm text-foreground border-t border-border relative z-10">
            <p>&copy; {new Date().getFullYear()} GuruDarshini. All rights reserved.<br />An ADPT Unofficial App</p>
          </footer>
        )}
      </div>
    </ThemeProvider>
  );
}
