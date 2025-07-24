
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Menu, X, Home, LogIn, UserPlus } from 'lucide-react';
import { auth, onAuthStateChanged, signOut, type User } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { GAMES } from '@/lib/constants';

const navItems = [
    { href: '/dashboard', label: 'Home', Icon: Home },
    ...GAMES.map(game => ({ href: game.href, label: game.title, Icon: game.Icon }))
];

const DEFAULT_AVATAR_SRC = '/images/avatars/modern_girl.png';
const LOCAL_STORAGE_AVATAR_KEY = 'shravyaPlaylab_avatar';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_SRC);
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const updateProfileDisplay = () => {
            const user = auth.currentUser;
            if (user) {
                setAvatarUrl(user.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            } else {
                setAvatarUrl(localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            }
        };

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
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
            await signOut(auth);
            toast({ title: "Logged Out", description: "You have been successfully logged out." });
            router.push('/');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Logout Failed", description: "Could not sign out." });
        }
    };

    const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
        <Link href={href} passHref>
            <Button
                variant={pathname === href ? 'secondary' : 'ghost'}
                className="w-full justify-start text-base"
                onClick={() => setIsOpen(false)}
            >
                {children}
            </Button>
        </Link>
    );

    return (
        <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <Image src="/images/logo.png" alt="Firebase Studio Logo" width={32} height={32} data-ai-hint="logo flame" />
                    <span>Firebase Studio</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                    {navItems.slice(0, 4).map(item => (
                        <Button key={item.label} variant={pathname === item.href ? 'secondary' : 'ghost'} asChild>
                            <Link href={item.href}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    {currentUser ? (
                         <Button onClick={() => router.push('/profile')} variant="ghost" className="p-0 rounded-full h-9 w-9">
                           <Avatar className="h-9 w-9">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback>P</AvatarFallback>
                           </Avatar>
                        </Button>
                    ) : (
                        <div className="hidden md:flex gap-2">
                            <Button variant="ghost" asChild><Link href="/login">Login</Link></Button>
                            <Button asChild><Link href="/signup">Sign Up</Link></Button>
                        </div>
                    )}
                    
                    {/* Mobile Navigation Trigger */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <SheetHeader className="sr-only">
                              <SheetTitle>Main Menu</SheetTitle>
                              <SheetDescription>
                                Main navigation menu for the Shravya PlayLab application.
                              </SheetDescription>
                            </SheetHeader>
                            <div className="p-4">
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="absolute top-3 right-3">
                                    <X />
                                    <span className="sr-only">Close Menu</span>
                                </Button>
                                <nav className="flex flex-col gap-2 mt-8">
                                    {navItems.map(item => (
                                        <NavLink key={item.label} href={item.href}>
                                            <item.Icon className="mr-2" /> {item.label}
                                        </NavLink>
                                    ))}
                                    <hr className="my-2" />
                                    {currentUser ? (
                                        <Button variant="ghost" className="w-full justify-start text-base" onClick={handleLogout}>Logout</Button>
                                    ) : (
                                        <>
                                            <NavLink href="/login"><LogIn className="mr-2" /> Login</NavLink>
                                            <NavLink href="/signup"><UserPlus className="mr-2" /> Sign Up</NavLink>
                                        </>
                                    )}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
