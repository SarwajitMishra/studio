
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlusCircle, User, Wrench } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Hardcoded blog post data
const staticBlog = {
  id: 'static-1',
  slug: 'our-first-post',
  title: 'Welcome to the Playhouse Chronicles!',
  authorName: 'Team Shravya Playhouse',
  authorAvatar: '/images/custom-chat-icon.png',
  publishedAt: '2024-07-10T12:00:00.000Z',
  content: 'Welcome to our brand new blog! This is a place for fun stories, learning tips, and updates from the Shravya Playhouse team...'
};

export default function BlogsPage() {
    return (
        <div className="space-y-8">
            <header className="text-center py-8 bg-primary/10 rounded-lg shadow-inner">
                <h1 className="text-4xl font-bold text-primary">Playhouse Chronicles</h1>
                <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
                    Articles, stories, and tips from the Shravya Playhouse community.
                </p>
                <Dialog>
                    <DialogTrigger asChild>
                         <Button className="mt-6">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Write a Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wrench className="text-primary"/> Feature Under Maintenance
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                                The blog creation feature is currently being improved and is temporarily unavailable. Please check back soon!
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card key={staticBlog.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="leading-snug hover:text-primary transition-colors">
                            <Link href={`/blogs/${staticBlog.slug}`}>{staticBlog.title}</Link>
                        </CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-2 text-xs pt-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={staticBlog.authorAvatar} />
                                    <AvatarFallback><User size={12}/></AvatarFallback>
                                </Avatar>
                                <span>{staticBlog.authorName}</span>
                                <span>•</span>
                                <span>
                                    {new Date(staticBlog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground line-clamp-3">
                            {staticBlog.content}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="secondary" className="w-full">
                            <Link href={`/blogs/${staticBlog.slug}`}>
                                Read More <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
