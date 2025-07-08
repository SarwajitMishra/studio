'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaySquare, Loader2 } from 'lucide-react';

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Simulate loading time

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 via-background to-background p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <PlaySquare size={80} className="mx-auto text-primary animate-pulse" />
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
            Welcome to Shravya Playhouse!
          </h1>
          <p className="text-lg text-foreground/80">
            Let’s play, learn and win!
          </p>
        </div>

        <div className="min-h-[160px] flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <Loader2 size={32} className="mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Getting things ready...</p>
            </div>
          ) : (
            <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
              <Button asChild size="lg" className="w-full text-lg">
                <Link href="/profile">Sign Up / Log In</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full text-lg">
                <Link href="/dashboard">Continue as Guest</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
