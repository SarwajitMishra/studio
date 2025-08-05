
'use client';

import type { ReactNode } from 'react';
import Header from './header';
import Footer from './footer'; 
import FloatingActionButtons from './floating-action-buttons';
import FloatingChatButton from './floating-chat-button';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <FloatingActionButtons />
      <FloatingChatButton />
    </div>
  );
}
