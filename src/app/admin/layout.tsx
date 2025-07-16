
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { isUserAdmin } from '@/lib/users';
import { Loader2, ShieldCheck, Home, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const isAdmin = await isUserAdmin(currentUser.uid);
        if (isAdmin) {
          setIsLoading(false);
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-semibold text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  const navItems = [
      { href: "/admin", label: "Dashboard", Icon: Home },
      { href: "/admin/users", label: "Users", Icon: Users },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-muted/40 border-r p-4 flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="flex flex-col gap-2">
            {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                    <Link 
                        key={item.href}
                        href={item.href} 
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            isActive && "bg-muted text-primary font-semibold"
                        )}
                    >
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
