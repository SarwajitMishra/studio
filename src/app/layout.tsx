'use client';

import { usePathname } from 'next/navigation';
import { Quicksand } from 'next/font/google'; // Changed from Inter to Quicksand
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import MainLayout from '@/components/layout/main-layout';
import PWALoader from '@/components/pwa-loader';
import ThemeProvider from '@/components/theme-provider'; // Import ThemeProvider

// Configure Quicksand font
const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand', // Define CSS variable name
  weight: ['300', '400', '500', '600', '700'] // Include a range of weights
});

// The 'metadata' export has been removed to fix a Next.js error.
// Metadata cannot be exported from a file that uses the 'use client' directive.

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
      </head>
      {/* Apply Quicksand font variable to the body */}
      <body className={`${quicksand.variable} font-sans antialiased`} suppressHydrationWarning>
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
