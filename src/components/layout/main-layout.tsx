
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useRef } from 'react';
import Header from './header';
import FloatingChatButton from './floating-chat-button';
import FloatingActionButtons from './floating-action-buttons';
import Link from 'next/link';
import { Separator } from '../ui/separator';
import VisitorCountWidget from './VisitorCountWidget';
import DateTimeWidget from './DateTimeWidget';

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
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-bold text-white mb-2">Shravya PlayLab</h3>
              <p className="text-sm">A project by the Shravya Foundation, dedicated to making learning accessible and fun.</p>
              <div className="mt-4">
                  <a href="mailto:hello@shravya.foundation" className="text-sm hover:text-white">hello@shravya.foundation</a>
              </div>
            </div>
            <div>
                <h3 className="font-bold text-white mb-2">Quick Links</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/info" className="hover:text-white">About Us</Link></li>
                    <li><Link href="/privacy-policy" className="hover:text-white">Privacy & Child Safety</Link></li>
                    <li><Link href="/contact-us" className="hover:text-white">Contact</Link></li>
                </ul>
            </div>
             <div>
                <h3 className="font-bold text-white mb-2">Session Info</h3>
                <div className="text-sm space-y-2">
                    <div className="text-gray-400"><DateTimeWidget /></div>
                    <div className="text-gray-400"><VisitorCountWidget /></div>
                </div>
            </div>
          </div>
           <Separator className="my-6 bg-gray-700" />
           <p className="text-center text-xs">&copy; {new Date().getFullYear()} Shravya Foundation. All Rights Reserved.</p>
        </div>
      </footer>
      
      {isMounted && (
        <>
          <FloatingActionButtons />
          <FloatingChatButton />
        </>
      )}
    </div>
  );
}
