
"use client";

import { useEffect } from 'react';

/**
 * The Service Worker registration logic has been disabled to prevent
 * "Blocked a frame with origin" errors that can occur in certain
 * sandboxed or cross-origin iframe development environments.
 *
 * This typically happens when the Service Worker script (`/sw.js`) is
 * not correctly configured or found, causing security policy violations.
 * Since PWA functionality is not a critical requirement and was causing
 * this runtime error, the registration logic is now commented out.
 */
export default function PWALoader() {
  useEffect(() => {
    // All service worker registration logic is disabled.
    /*
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
      const wb = window.workbox;
      // Add any Workbox specific logic here if needed, for now, just register the SW.
      // wb.register(); // If using next-pwa with workbox, it might handle registration.
      // For a manual sw.js:
       window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered: ', registration);
          })
          .catch(registrationError => {
            console.log('Service Worker registration failed: ', registrationError);
          });
      });
    } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Fallback for non-workbox environments or direct sw.js registration
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered: ', registration);
          })
          .catch(registrationError => {
            console.log('Service Worker registration failed: ', registrationError);
          });
      });
    }
    */
  }, []);

  return null; // This component doesn't render anything visible
}
