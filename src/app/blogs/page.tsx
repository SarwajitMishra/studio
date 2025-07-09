
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, User } from 'lucide-react';
import { getPublishedBlogs, type BlogPost } from '@/lib/blogs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { onAuthStateChanged, type User as FirebaseUser } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        async function fetchBlogs() {
            try {
                const publishedBlogs = await getPublishedBlogs();
                setBlogs(publishedBlogs);
            } catch (error) {
                console.error("Failed to fetch blogs:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchBlogs();
        
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="text-center">Loading blog posts...</div>;
    }

    return (
        <div className="space-y-8">
            <header className="text-center py-8 bg-primary/10 rounded-lg shadow-inner">
                <h1 className="text-4xl font-bold text-primary">Playhouse Chronicles</h1>
                <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
                    Articles, stories, and tips from the Shravya Playhouse community.
                </p>
                {currentUser && (
                    <Button asChild className="mt-6">
                        <Link href="/blogs/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Write a Post
                        </Link>
                    </Button>
                )}
            </header>

            {blogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map(blog => (
                        <Card key={blog.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="leading-snug hover:text-primary transition-colors">
                                    <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
                                </CardTitle>
                                <CardDescription>
                                    <div className="flex items-center gap-2 text-xs pt-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={blog.authorAvatar} />
                                            <AvatarFallback><User size={12}/></AvatarFallback>
                                        </Avatar>
                                        <span>{blog.authorName}</span>
                                        <span>•</span>
                                        <span>
                                            {blog.publishedAt ? format(new Date(blog.publishedAt), 'PPP') : format(new Date(blog.createdAt), 'PPP')}
                                        </span>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground line-clamp-3">
                                    {blog.content.substring(0, 150)}...
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={`/blogs/${blog.slug}`}>
                                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-2xl font-semibold">No Posts Yet</h2>
                    <p className="text-muted-foreground mt-2">Check back soon for articles from our community!</p>
                </div>
            )}
        </div>
    );
}
