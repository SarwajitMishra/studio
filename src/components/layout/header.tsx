'use client';

import Link from 'next/link';
import { useState } from 'react';
import Navigation from './navigation';
import { PlaySquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SessionDialog } from '@/components/online/SessionDialog';


export default function Header() {
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  return (
    <>
      <header className="bg-primary shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 text-primary-foreground hover:opacity-80 transition-opacity">
              <PlaySquare size={32} className="text-accent" />
              <div className="hidden sm:flex flex-col font-bold leading-tight">
                  <span className="text-lg">Shravya</span>
                  <span className="text-lg">Playhouse</span>
              </div>
            </Link>
            <Navigation side="left" />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center space-x-2">
                <Switch
                  id="online-mode"
                  checked={isOnlineMode}
                  onCheckedChange={setIsOnlineMode}
                  aria-label="Toggle Online Mode"
                  className="data-[state=unchecked]:bg-orange-500 data-[state=checked]:bg-green-500"
                />
                <Label htmlFor="online-mode" className="text-primary-foreground font-semibold cursor-pointer">Online</Label>
            </div>
            <Separator orientation="vertical" className="h-6 bg-primary-foreground/30" />
            <Navigation side="right" />
          </div>
        </div>
      </header>
      <SessionDialog open={isOnlineMode} onOpenChange={setIsOnlineMode} />
    </>
  );
}
