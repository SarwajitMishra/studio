
"use client";

import React, { useState, useEffect } from 'react';
import { getBlogPost, type BlogPost } from '@/lib/blogs';
import { onAuthStateChanged, type User } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { notFound, useRouter } from 'next/navigation';
import BlogForm from '@/components/blog/BlogForm';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EditBlogPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchPostForEdit() {
      if (!currentUser) {
        // Wait until we know who the user is
        return;
      }

      try {
        const fetchedPost = await getBlogPost(params.slug);
        
        if (!fetchedPost) {
          return notFound();
        }

        // SECURITY CHECK: Ensure the current user is the author of the post.
        if (fetchedPost.authorId !== currentUser.uid) {
          setError("You do not have permission to edit this post.");
          return;
        }

        // Users can only edit drafts or pending posts.
        if (fetchedPost.status !== 'draft' && fetchedPost.status !== 'pending-review') {
            setError("This post cannot be edited because it has already been published or rejected.");
            return;
        }

        setPost(fetchedPost);
      } catch (e) {
        setError("Failed to fetch the blog post.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPostForEdit();
  }, [params.slug, currentUser]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-24">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="text-destructive">Access Denied</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => router.back()}>Go Back</Button>
            </CardContent>
        </Card>
      </div>
    )
  }

  if (!post || !currentUser) {
    // This case handles when the post isn't found but no specific error was set.
    return notFound();
  }

  return <BlogForm currentUser={currentUser} post={post} />;
}
