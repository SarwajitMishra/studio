'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import MainLayout from '@/components/layout/main-layout';
import PWALoader from '@/components/pwa-loader';
import ThemeProvider from '@/components/theme-provider'; // Import ThemeProvider

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isWelcomePage = pathname === '/';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Shravya Playhouse</title>
        <meta name="description" content="Fun and educational games for kids at Shravya Playhouse!"/>
        <meta name="theme-color" content="#87CEEB" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      {/* The body tag no longer needs the font variable */}
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {isWelcomePage ? (
            <>{children}</>
          ) : (
            <MainLayout>
              {children}
            </MainLayout>
          )}
          <Toaster />
          <PWALoader />
        </ThemeProvider>
      </body>
    </html>
  );
}
