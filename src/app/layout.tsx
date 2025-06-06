import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import AppShell from '@/components/layout/AppShell';

// Initialize Poppins font
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sri Guru Dig Vandanam',
  description:
    "Spiritual companion app to locate Swamiji, get darshan guidance, and experience AR-based viewing.",
  icons: {
    icon: 'https://niraamay.com/wp-content/uploads/2021/12/crown-chakra-final.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable}`} suppressHydrationWarning={true}>
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/png" />
      </head>
      {/* Remove gradient text and neon glow from global body styles */}
      <body
        className="antialiased font-sans"
        suppressHydrationWarning={true}
      >
        {/* Starry background is now defined in AppShell for better control with content */}
        {/* 
        <div id="star-bg">
          <div id="stars1"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
        </div>
        */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
