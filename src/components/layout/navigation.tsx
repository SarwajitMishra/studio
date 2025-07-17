
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Home, Store, BookOpen, Bell, BookText, LogOut, Shield, Zap, CheckCheck, Lightbulb, LogIn, PenSquare } from 'lucide-react';
import { SETTINGS_MENU_ITEMS } from '@/lib/constants';
import { auth, signOut as firebaseSignOut, onAuthStateChanged, type User } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getNotifications, markAsRead, type Notification } from '@/lib/notifications';

const DEFAULT_AVATAR_SRC = '/images/avatars/modern_girl.png';
const DEFAULT_USER_NAME = "Kiddo";
const LOCAL_STORAGE_AVATAR_KEY = 'shravyaPlaylab_avatar';
const LOCAL_STORAGE_USER_NAME_KEY = 'shravyaPlaylab_userName';

interface NavigationProps {
  side: 'left' | 'right';
}

export default function Navigation({ side }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_SRC);
  const [userName, setUserName] = useState(DEFAULT_USER_NAME);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    fetchNotifications();
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
      updateProfileDisplay();
    });
    
    window.addEventListener('profileUpdated', updateProfileDisplay);
    window.addEventListener('storageUpdated', fetchNotifications);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('profileUpdated', updateProfileDisplay);
      window.removeEventListener('storageUpdated', fetchNotifications);
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

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    fetchNotifications(); // Refresh list after marking as read
    if (notification.href) {
      router.push(notification.href);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const commonButtonClasses = "text-primary-foreground hover:bg-primary-foreground/10";
  
  if (side === 'left') {
    return (
       <TooltipProvider>
        <nav className="flex items-center space-x-1 sm:space-x-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/dashboard" aria-label="Go to Homepage">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(commonButtonClasses, pathname === '/dashboard' && "bg-accent text-accent-foreground hover:bg-accent/90")}
                    >
                        <Home size={24} />
                    </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent><p>Homepage</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/blogs" aria-label="Go to Blogs">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(commonButtonClasses, pathname.startsWith('/blogs') && "bg-accent text-accent-foreground hover:bg-accent/90")}
                    >
                        <PenSquare size={24} />
                    </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent><p>Blogs</p></TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/shop" aria-label="Go to Shop">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(commonButtonClasses, pathname === '/shop' && "bg-accent text-accent-foreground hover:bg-accent/90")}
                    >
                        <Store size={24} />
                    </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent><p>Shop</p></TooltipContent>
            </Tooltip>
       </nav>
      </TooltipProvider>
    )
  }

  if (side === 'right') {
    const latestUnreadNotification = notifications.find(n => !n.isRead);

    return (
      <TooltipProvider>
      <nav className="flex items-center space-x-1 sm:space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/profile" aria-label="View Profile">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "rounded-full p-0",
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
          </TooltipTrigger>
          <TooltipContent><p>{userName}</p></TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(commonButtonClasses, "relative")} aria-label="Notifications">
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent><p>Notifications</p></TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64 mt-2">
            <DropdownMenuLabel>Latest Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
             {latestUnreadNotification ? (
               <DropdownMenuItem onClick={() => handleNotificationClick(latestUnreadNotification)} className="cursor-pointer whitespace-normal">
                   <div className="flex flex-col gap-1">
                       <span className="font-semibold">{latestUnreadNotification.message}</span>
                       <span className="text-xs text-muted-foreground">Click to view</span>
                   </div>
               </DropdownMenuItem>
             ) : (
                <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
             )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/notifications">
                <CheckCheck className="mr-2 h-4 w-4" />
                <span>View All Notifications</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={commonButtonClasses} aria-label="Settings Menu">
                  <Settings size={24} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent><p>Settings</p></TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>Settings & More</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!currentUser && (
               <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Login / Sign Up</span>
                  </Link>
                </DropdownMenuItem>
            )}
            {SETTINGS_MENU_ITEMS.map((item) => (
              <DropdownMenuItem key={item.label} asChild className="cursor-pointer">
                <Link href={item.href}>
                  <item.Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
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
      </TooltipProvider>
    );
  }

  return null;
}
