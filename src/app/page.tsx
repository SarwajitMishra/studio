'use client';

import Link from 'next/link';

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

      {/* Invisible Clickable Overlays */}
      <div className="absolute inset-0 z-10">
        {/*
          IMPORTANT: You will need to adjust the inline `style` values below 
          (top, left, width, height) to perfectly match the button positions 
          in YOUR video. You can use percentages for responsive positioning.
          For debugging, you can temporarily add a background color like:
          style={{ ..., backgroundColor: 'rgba(255,0,0,0.3)' }}
        */}
        
        {/* Sign Up Button Overlay (Example: bottom left) */}
        <Link
          href="/profile"
          aria-label="Sign Up"
          className="absolute"
          style={{ top: '75%', left: '20%', width: '20%', height: '10%' }}
        />

        {/* Login Button Overlay (Example: bottom center) */}
        <Link
          href="/profile"
          aria-label="Login"
          className="absolute"
          style={{ top: '75%', left: '40%', width: '20%', height: '10%' }}
        />

        {/* Continue as Guest Button Overlay (Example: bottom right) */}
        <Link
          href="/dashboard"
          aria-label="Continue as Guest"
          className="absolute"
          style={{ top: '75%', left: '60%', width: '20%', height: '10%' }}
        />
      </div>
    </div>
  );
}
