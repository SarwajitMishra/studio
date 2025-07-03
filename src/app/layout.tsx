
import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'Shravya Playhouse',
    template: '%s | Shravya Playhouse',
  },
  description: 'Fun and educational games for kids at Shravya Playhouse!',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><meta name="theme-color" content="#87CEEB" /></head>
      {/* Apply Quicksand font variable to the body */}
      <body className={`${quicksand.variable} font-sans antialiased`}>
        <ThemeProvider>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
          <PWALoader />
        </ThemeProvider>
      </body>
    </html>
  );
}
