
'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import MainLayout from '@/components/layout/main-layout';
import PWALoader from '@/components/pwa-loader';
import ThemeProvider from '@/components/theme-provider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Define all pages that should not have the main layout
  const standalonePages = ['/login', '/signup'];
  const isStandalonePage = standalonePages.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <title>Firebase Studio</title>
        <meta name="description" content="Fun and educational games for kids!"/>
        <meta name="theme-color" content="#FF9933" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {isStandalonePage ? (
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
