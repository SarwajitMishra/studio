
'use client';

import Link from 'next/link';

export default function WelcomePage() {
  return (
    // Updated container for better cross-device consistency
    <div className="fixed inset-0 overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted // Muted is often required for autoplay on mobile
        playsInline // Important for mobile browsers
        className="absolute top-0 left-0 w-full h-full object-fill z-0" // Changed object-cover to object-fill
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
        
        {/* Login Button Overlay */}
        <Link
          href="/login"
          aria-label="Login"
          className="absolute"
          style={{ top: '75%', left: '20%', width: '20%', height: '10%' }}
        />

        {/* Sign Up Button Overlay */}
        <Link
          href="/signup"
          aria-label="Sign Up"
          className="absolute"
          style={{ top: '75%', left: '40%', width: '20%', height: '10%' }}
        />

        {/* Continue as Guest Button Overlay */}
        <Link
          href="/dashboard"
          aria-label="Continue as Guest"
          className="absolute"
          style={{ top: '75%', left: '60%', width: '40%', height: '10%' }}
        />
      </div>
    </div>
  );
}
