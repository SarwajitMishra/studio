import Link from 'next/link';
import Navigation from './navigation';
import { PlaySquare } from 'lucide-react'; // Using a playful icon for the logo

export default function Header() {
  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 text-primary-foreground hover:opacity-80 transition-opacity">
            <PlaySquare size={32} className="text-accent" />
            <div className="hidden sm:flex flex-col font-bold leading-tight">
                <span className="text-lg">Shravya</span>
                <span className="text-sm">Playhouse</span>
            </div>
          </Link>
          <Navigation side="left" />
        </div>
        <Navigation side="right" />
      </div>
    </header>
  );
}
