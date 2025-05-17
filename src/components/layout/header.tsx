import Link from 'next/link';
import Navigation from './navigation';
import { PlaySquare } from 'lucide-react'; // Using a playful icon for the logo

export default function Header() {
  return (
    <header className="bg-primary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary-foreground hover:opacity-80 transition-opacity">
          <PlaySquare size={32} className="text-accent" />
          <span>Shravya Playhouse</span>
        </Link>
        <Navigation />
      </div>
    </header>
  );
}
