
"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import BlogForm from '@/components/blog/BlogForm';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CreateBlogPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, []);

    if (!authChecked) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <Card className="w-full max-w-md mx-auto text-center">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                    <CardDescription>You must be logged in to create a post.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/login')}>Go to Login</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
          <BlogForm currentUser={currentUser} />
        </div>
      );
}
