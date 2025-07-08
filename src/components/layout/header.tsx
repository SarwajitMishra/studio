import Link from 'next/link';
import Navigation from './navigation';
import { PlaySquare } from 'lucide-react'; // Using a playful icon for the logo

export default function Header() {
  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-foreground hover:opacity-80 transition-opacity">
            <PlaySquare size={28} className="text-accent" />
            <span className="hidden sm:inline">Shravya Playhouse</span>
          </Link>
          <Navigation side="left" />
        </div>
        <Navigation side="right" />
      </div>
    </header>
  );
}
