
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublishedBlogs, type BlogPost } from '@/lib/blogs';
import { format } from 'date-fns';

export default function BlogsPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const publishedPosts = await getPublishedBlogs();
                setPosts(publishedPosts);
            } catch (error) {
                console.error("Failed to fetch published posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="space-y-8">
            <header className="text-center py-8 bg-primary/10 rounded-lg shadow-inner">
                <h1 className="text-4xl font-bold text-primary">Playhouse Chronicles</h1>
                <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
                    Articles, stories, and tips from the Shravya Playhouse community.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/blogs/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Write a Post
                  </Link>
                </Button>
            </header>
            
            {loading ? (
                 <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                 </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">No published posts yet. Be the first to write one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Card key={post.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="leading-snug hover:text-primary transition-colors">
                                    <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
                                </CardTitle>
                                <CardDescription>
                                    <div className="flex items-center gap-2 text-xs pt-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={post.authorAvatar} />
                                            <AvatarFallback><User size={12}/></AvatarFallback>
                                        </Avatar>
                                        <span>{post.authorName}</span>
                                        {post.publishedAt && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    {format(new Date(post.publishedAt.seconds * 1000), 'PPP')}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground line-clamp-3">
                                    {post.content}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={`/blogs/${post.slug}`}>
                                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
