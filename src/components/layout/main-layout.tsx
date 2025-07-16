
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useRef } from 'react';
import Header from './header';
import FloatingChatButton from './floating-chat-button';
import FloatingActionButtons from './floating-action-buttons';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import VisitorCountWidget from './VisitorCountWidget';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const wakeLockSentinel = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinel.current = await navigator.wakeLock.request('screen');
        wakeLockSentinel.current.addEventListener('release', () => {
          console.log('Screen Wake Lock was released');
        });
        console.log('Screen Wake Lock is active.');
      } catch (err: any) {
        // Gracefully handle the NotAllowedError which is common in iframes/sandboxed environments
        if (err.name === 'NotAllowedError') {
          console.log('Screen Wake Lock request failed. This is expected in some secure contexts (like iframes) and can be safely ignored.');
        } else {
          console.error(`An unexpected error occurred with the Screen Wake Lock API: ${err.name}, ${err.message}`);
        }
      }
    } else {
      console.warn('Screen Wake Lock API not supported on this browser.');
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLockSentinel.current === null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel.current) {
        wakeLockSentinel.current.release();
        wakeLockSentinel.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-primary/10 text-center py-6 text-sm text-foreground/70">
        <div className="container mx-auto space-y-4">
          <div className="flex justify-center items-center gap-x-4 gap-y-2 flex-wrap text-foreground/90 font-medium">
             <Link href="/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
             <Separator orientation="vertical" className="h-4 hidden sm:block" />
             <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
             <Separator orientation="vertical" className="h-4 hidden sm:block" />
             <Link href="/cookies-policy" className="hover:text-primary transition-colors">Cookies Policy</Link>
             <Separator orientation="vertical" className="h-4 hidden sm:block" />
             <Link href="/community-guidelines" className="hover:text-primary transition-colors">Community Guidelines</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Shravya Playhouse. All rights reserved.</p>
        </div>
      </footer>
      
      {isMounted && (
        <>
          <FloatingActionButtons />
          <FloatingChatButton />
          <VisitorCountWidget />
        </>
      )}
    </div>
  );
}
