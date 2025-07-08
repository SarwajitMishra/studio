
import type { ReactNode } from 'react';
import Header from './header';
import FloatingChatButton from './floating-chat-button';
import FloatingActionButtons from './floating-action-buttons'; // Import the new component

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-primary/10 text-center py-4 text-sm text-foreground/70">
        <p>&copy; {new Date().getFullYear()} Shravya Playhouse. All rights reserved.</p>
      </footer>
      <FloatingChatButton />
      <FloatingActionButtons /> {/* Add the new FAB dock here */}
    </div>
  );
}
