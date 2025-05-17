
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import MainLayout from '@/components/layout/main-layout';
import PWALoader from '@/components/pwa-loader'; // Import the PWALoader

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Shravya Playhouse',
    template: '%s | Shravya Playhouse',
  },
  description: 'Fun and educational games for kids at Shravya Playhouse!',
  manifest: '/manifest.json', // Added manifest link for PWA
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#87CEEB" /> {/* Added theme-color for PWA address bar styling */}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <MainLayout>
          {children}
        </MainLayout>
        <Toaster />
        <PWALoader /> {/* Add PWALoader here to register service worker */}
      </body>
    </html>
  );
}
