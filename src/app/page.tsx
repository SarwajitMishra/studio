'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen w-full h-full overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline // Important for mobile browsers
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        poster="/videos/loading-screen-poster.jpg" // Optional: a poster image for before the video loads
      >
        <source src="/videos/loading-screen.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-black/30 p-4">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
              Welcome to Shravya Playhouse!
            </h1>
            <p className="text-lg text-slate-200" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
              Let’s play, learn and win!
            </p>
          </div>

          <div className="w-full animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-3">
             <Button asChild size="lg" className="w-full text-lg bg-pink-500 text-white hover:bg-pink-600">
                <Link href="/profile">Sign Up</Link>
              </Button>
               <Button asChild size="lg" className="w-full text-lg bg-purple-600 text-white hover:bg-purple-700">
                <Link href="/profile">Log In</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full text-lg bg-white/20 text-white border-white hover:bg-white/30">
                <Link href="/dashboard">Continue as Guest</Link>
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
