
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogIn, UserPlus, Settings, Users, PenSquare, Store, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { auth, onAuthStateChanged, type User } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { GAMES, SETTINGS_MENU_ITEMS } from '@/lib/constants';
import { signOut } from 'firebase/auth';
import { SessionDialog } from '@/components/online/SessionDialog';

const DEFAULT_AVATAR_SRC = '/images/avatars/modern_girl.png';
const LOCAL_STORAGE_AVATAR_KEY = 'shravyaPlayhouse_avatar';

export default function Header() {
    const [isSessionDialogOpen, setSessionDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_SRC);
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            const guestSessionActive = sessionStorage.getItem('guest-session') === 'true';
            setIsGuest(guestSessionActive && !user);

            if (user) {
                // Logged-in user
                setAvatarUrl(user.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            } else if (guestSessionActive) {
                // Guest user
                setAvatarUrl(localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            }
        });

        const updateProfileDisplay = () => {
            const user = auth.currentUser;
            if (user) {
                setAvatarUrl(user.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            }
        };

        window.addEventListener('profileUpdated', updateProfileDisplay);

        // Listen for direct changes to session storage to update UI
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'guest-session') {
                setIsGuest(e.newValue === 'true' && !auth.currentUser);
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            unsubscribeAuth();
            window.removeEventListener('profileUpdated', updateProfileDisplay);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem('guest-session');
            localStorage.removeItem(LOCAL_STORAGE_AVATAR_KEY);
            toast({ title: "Logged Out", description: "You have been successfully logged out." });
            router.push('/');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Logout Failed", description: "Could not sign out." });
        }
    };

    const currentGame = GAMES.find(game => pathname.startsWith(game.href));

    return (
        <>
            <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Left side of header */}
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
                            <Image src="/images/logo.png" alt="Shravya Playhouse Logo" width={32} height={32} data-ai-hint="logo flame" />
                            <span className="hidden sm:inline-block">Shravya Playhouse</span>
                        </Link>
                        {currentGame && (
                            <>
                                <span className="text-muted-foreground">/</span>
                                <Link href={currentGame.href} className="font-semibold text-secondary-foreground hover:underline">
                                  {currentGame.title}
                                </Link>
                            </>
                        )}
                        <nav className="flex items-center border-l border-border ml-2 pl-2 gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant={pathname.startsWith('/blogs') ? 'secondary' : 'ghost'} size="icon">
                                            <Link href="/blogs" aria-label="Go to Blogs">
                                                <PenSquare className="h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Blogs</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant={pathname.startsWith('/shop') ? 'secondary' : 'ghost'} size="icon">
                                            <Link href="/shop" aria-label="Go to S-Shop">
                                                <Store className="h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>S-Shop</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </nav>
                    </div>

                    {/* Right side of header */}
                    <div className="flex items-center gap-1.5">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setSessionDialogOpen(true)}>
                                        <Users className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Online Sessions</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button asChild variant={pathname.startsWith('/notifications') ? 'secondary' : 'ghost'} size="icon">
                                        <Link href="/notifications" aria-label="Go to Notifications">
                                            <Bell className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Notifications</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {(currentUser || isGuest) && (
                            <Button onClick={() => router.push('/profile')} variant="ghost" className="p-0 rounded-full h-9 w-9">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={avatarUrl} alt="User Avatar" />
                                    <AvatarFallback>{isGuest ? 'G' : <UserIcon size={20} />}</AvatarFallback>
                                </Avatar>
                            </Button>
                        )}
                        
                        <DropdownMenu>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Settings className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Settings</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {SETTINGS_MENU_ITEMS.map((item) => (
                                    <DropdownMenuItem key={item.label} asChild className="cursor-pointer">
                                    <Link href={item.href}>
                                        <item.Icon className="mr-2 h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                {currentUser ? (
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                ) : (
                                    <>
                                        <DropdownMenuItem onClick={() => router.push('/login')}>
                                            <LogIn className="mr-2 h-4 w-4" />
                                            <span>Login</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/signup')}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            <span>Sign Up</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            <SessionDialog open={isSessionDialogOpen} onOpenChange={setSessionDialogOpen} />
        </>
    );
}
