
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Settings, Home, Store, BookOpen, Bell, BookText, LogOut, Shield } from 'lucide-react';
import { SETTINGS_MENU_ITEMS } from '@/lib/constants';
import { auth, signOut as firebaseSignOut, onAuthStateChanged, type User } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { isUserAdmin } from '@/lib/users';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const DEFAULT_AVATAR_SRC = '/images/avatars/modern_girl.png';
const DEFAULT_USER_NAME = "Kiddo";
const LOCAL_STORAGE_AVATAR_KEY = 'shravyaPlayhouse_avatar';
const LOCAL_STORAGE_USER_NAME_KEY = 'shravyaPlayhouse_userName';

interface NavigationProps {
  side: 'left' | 'right';
}

export default function Navigation({ side }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_SRC);
  const [userName, setUserName] = useState(DEFAULT_USER_NAME);

  useEffect(() => {
    const updateProfileDisplay = () => {
        const user = auth.currentUser;
        if (user) {
            setAvatarUrl(user.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            setUserName(user.displayName || localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || DEFAULT_USER_NAME);
        } else {
            setAvatarUrl(localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            setUserName(localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || DEFAULT_USER_NAME);
        }
    };

    updateProfileDisplay();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsAdmin(await isUserAdmin(user.uid));
      } else {
        setIsAdmin(false);
      }
      updateProfileDisplay();
    });
    
    window.addEventListener('profileUpdated', updateProfileDisplay);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('profileUpdated', updateProfileDisplay);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); // Redirect to home after logout
    } catch (error: any)      {
      console.error("Error during sign-out:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not sign out. Please try again." });
    }
  };

  const commonButtonClasses = "text-primary-foreground hover:bg-primary-foreground/10";
  
  if (side === 'left') {
    return (
       <nav className="flex items-center space-x-1 sm:space-x-2">
         <Link href="/dashboard" aria-label="Go to Homepage">
           <Button
             variant="ghost"
             size="icon"
             className={cn(commonButtonClasses, pathname === '/dashboard' && "bg-accent text-accent-foreground hover:bg-accent/90")}
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
            className={cn(
                "rounded-full p-0", // Remove padding for avatar to fill the button
                commonButtonClasses, 
                pathname === '/profile' && "ring-2 ring-accent ring-offset-primary ring-offset-2"
            )}
          >
            <Avatar className="h-full w-full">
              <AvatarImage src={avatarUrl} alt={`${userName}'s avatar`} />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </Link>
        
        <Link href="/info" aria-label="Game Info">
           <Button
             variant="ghost"
             size="icon"
             className={cn(commonButtonClasses, pathname === '/info' && "bg-accent text-accent-foreground hover:bg-accent/90")}
           >
             <BookText size={24} />
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
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {currentUser && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    );
  }

  return null;
}
