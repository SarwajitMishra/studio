import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import MainLayout from '@/components/layout/main-layout';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Note: The user requested Comic Sans or Quicksand.
// Inter is a clear, friendly sans-serif font.
// To use Quicksand (or Comic Sans), you would typically:
// 1. Add the font using a service like Google Fonts (e.g., in the <head> via next/font/google)
//    or by hosting the font files locally.
// 2. Update the `fontFamily` in `tailwind.config.ts` or apply the font class to the body.
// For now, we'll use Inter.

export const metadata: Metadata = {
  title: {
    default: 'Shravya Playhouse',
    template: '%s | Shravya Playhouse',
  },
  description: 'Fun and educational games for kids at Shravya Playhouse!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use font-sans from Tailwind mapped to inter */}
        <MainLayout>
          {children}
        </MainLayout>
        <Toaster />
      </body>
    </html>
  );
}
