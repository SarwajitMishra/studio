
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPublishedBlogs, getBlogsForUser, type BlogPost } from '@/lib/blogs';
import { onAuthStateChanged, type User } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, FileText } from "lucide-react";
import { format } from 'date-fns';

function BlogCard({ post }: { post: BlogPost }) {
    const getStatusVariant = (status: BlogPost['status']) => {
        switch (status) {
            case 'draft': return 'outline';
            case 'pending-review': return 'secondary';
            case 'published': return 'default';
            case 'rejected': return 'destructive';
            default: return 'secondary';
        }
    }
    
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl font-bold leading-tight tracking-tighter">
                        <Link href={`/blogs/${post.slug}`} className="hover:underline">
                            {post.title}
                        </Link>
                    </CardTitle>
                    <Badge variant={getStatusVariant(post.status)} className="capitalize shrink-0">
                        {post.status.replace('-', ' ')}
                    </Badge>
                </div>
                <CardDescription>
                    By {post.authorName} on {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground">{post.content.substring(0, 150)}...</p>
            </CardContent>
            <CardFooter>
                 <Button asChild variant="secondary">
                    <Link href={`/blogs/${post.slug}`}>Read More</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function BlogsPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setIsLoading(true);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        async function fetchPosts() {
            try {
                let fetchedPosts;
                if (currentUser) {
                    // Use the new combined function for logged-in users
                    fetchedPosts = await getBlogsForUser(currentUser.uid);
                } else {
                    // Guests see only published posts
                    fetchedPosts = await getPublishedBlogs();
                }
                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Error fetching blogs:", error);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchPosts();
    }, [currentUser]);

    return (
        <div className="container py-12">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tighter">Shravya Playhouse Blog</h1>
                    <p className="text-lg text-muted-foreground">
                        {currentUser ? "All published posts and your personal drafts." : "News, updates, and stories from our community."}
                    </p>
                </div>
                {currentUser && (
                    <Button asChild>
                        <Link href="/blogs/create">
                            <PlusCircle className="mr-2 h-4 w-4" /> New Post
                        </Link>
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : posts.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map(post => <BlogCard key={post.id} post={post} />)}
                </div>
            ) : (
                <div className="text-center py-24">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">No Posts Found</h2>
                    <p className="mt-2 text-muted-foreground">
                        {currentUser ? "You haven't written any posts yet. Start by creating a new one!" : "There are no published blog posts at the moment. Check back soon!"}
                    </p>
                </div>
            )}
        </div>
    );
}
