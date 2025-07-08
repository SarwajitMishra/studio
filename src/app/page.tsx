'use client';

import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen w-full h-full overflow-hidden">
      <Link href="/dashboard" className="absolute inset-0 z-10" aria-label="Continue to app">
        {/* This link covers the whole screen, making the video below clickable */}
      </Link>
      
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

      {/* Optional: You can still have non-interactive text over the video if you like */}
      <div className="relative z-5 flex flex-col items-center justify-center w-full h-full p-4 pointer-events-none">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
              Welcome to Shravya Playhouse!
            </h1>
            <p className="text-lg text-slate-200" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
              Click anywhere to start playing!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
