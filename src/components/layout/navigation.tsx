"use client"; // For using usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile'; // Assuming this hook exists and works

export default function Navigation() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const navLinks = NAV_ITEMS.map((item) => (
    <Link
      key={item.label}
      href={item.href}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground",
        pathname === item.href ? "bg-accent text-accent-foreground shadow-sm" : "text-primary-foreground/80"
      )}
      aria-current={pathname === item.href ? "page" : undefined}
    >
      <item.Icon className="inline-block w-4 h-4 mr-2" />
      {item.label}
    </Link>
  ));

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
            <Menu size={24} />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-primary text-primary-foreground w-[250px] p-4">
          <nav className="flex flex-col space-y-3 mt-6">
            {navLinks}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="flex items-center space-x-2">
      {navLinks}
    </nav>
  );
}
