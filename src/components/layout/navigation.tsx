"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, UserCircle, Home, Store, BookOpen, Bell } from 'lucide-react';
import { SETTINGS_MENU_ITEMS } from '@/lib/constants';

interface NavigationProps {
  side: 'left' | 'right';
}

export default function Navigation({ side }: NavigationProps) {
  const pathname = usePathname();

  const commonButtonClasses = "text-primary-foreground hover:bg-primary-foreground/10";
  
  if (side === 'left') {
    return (
       <nav className="flex items-center space-x-1 sm:space-x-2">
         <Link href="/" aria-label="Go to Homepage">
           <Button
             variant="ghost"
             size="icon"
             className={cn(commonButtonClasses, pathname === '/' && "bg-accent text-accent-foreground hover:bg-accent/90")}
           >
             <Home size={24} />
           </Button>
         </Link>
         
         <Link href="/shop" aria-label="Go to Shop">
           <Button
             variant="ghost"
             size="icon"
             className={cn(commonButtonClasses, pathname === '/shop' && "bg-accent text-accent-foreground hover:bg-accent/90")}
           >
             <Store size={24} />
           </Button>
         </Link>

         <Link href="/blogs" aria-label="Go to Blogs">
           <Button
             variant="ghost"
             size="icon"
             className={cn(commonButtonClasses, pathname === '/blogs' && "bg-accent text-accent-foreground hover:bg-accent/90")}
           >
             <BookOpen size={24} />
           </Button>
         </Link>
       </nav>
    )
  }

  if (side === 'right') {
    return (
      <nav className="flex items-center space-x-1 sm:space-x-2">
        <Link href="/profile" aria-label="View Profile">
          <Button
            variant="ghost"
            size="icon"
            className={cn(commonButtonClasses, pathname === '/profile' && "bg-accent text-accent-foreground hover:bg-accent/90")}
          >
            <UserCircle size={24} />
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={commonButtonClasses} aria-label="Notifications">
              <Bell size={24} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>No new notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={commonButtonClasses} aria-label="Settings Menu">
              <Settings size={24} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>Settings & More</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SETTINGS_MENU_ITEMS.map((item) => (
              <DropdownMenuItem key={item.label} asChild className="cursor-pointer">
                <Link href={item.href}>
                  <item.Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    );
  }

  return null;
}
