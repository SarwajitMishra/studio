
"use client";

import React, { useState, useEffect } from 'react';
import { getBlogPost, type BlogPost, updateBlogStatus } from '@/lib/blogs';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, Bot, Loader2, Trash2, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { onAuthStateChanged, type User as FirebaseUser } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

// This is the new Client Component. It receives the slug as a simple string prop.
export default function BlogPostClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!authChecked) {
      return;
    }
    async function fetchPost() {
      try {
        // The getBlogPost function now handles all permission logic
        const fetchedPost = await getBlogPost(slug);
        if (!fetchedPost) {
          notFound();
        } else {
          setPost(fetchedPost);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }
    fetchPost();
  }, [slug, authChecked, currentUser]);

  const handleDiscard = async () => {
    if (!post) return;
    const result = await updateBlogStatus(post.id, 'rejected');
    if (result.success) {
        toast({
            title: "Post Discarded",
            description: "Your blog post has been successfully moved to the rejected pile.",
        });
        router.push('/blogs');
    } else {
        toast({
            variant: 'destructive',
            title: "Error",
            description: "Failed to discard the post. Please try again.",
        });
    }
  }

  if (isLoading || !authChecked) {
    return (
        <div className="flex justify-center items-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!post) {
    return notFound();
  }
  
  const isAuthor = currentUser?.uid === post.authorId;
  const canBeEdited = isAuthor && (post.status === 'draft' || post.status === 'pending-review');

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{post.title}</h1>
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={post.authorAvatar} />
                    <AvatarFallback><User size={16}/></AvatarFallback>
                </Avatar>
                <span>{post.authorName}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar size={16} />
                {post.publishedAt && (
                  <span>
                    {format(new Date(post.publishedAt), 'PPP')}
                  </span>
                )}
            </div>
        </div>
      </header>
      
      {canBeEdited && (
          <div className="flex justify-end gap-2">
              <Button asChild>
                  <Link href={`/blogs/edit/${post.slug}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Discard Post
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the post as 'rejected'. You will not be able to access it after this.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDiscard}>
                            Yes, Discard It
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
      )}

      <div className="prose dark:prose-invert lg:prose-xl max-w-none mx-auto bg-card p-6 rounded-lg shadow-sm">
        <ReactMarkdown
          components={{
            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />,
          }}
        >{post.content}</ReactMarkdown>
      </div>

       <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Comments</h2>
         <Card>
          <CardHeader>
            <CardTitle>Leave a Comment</CardTitle>
            <CardDescription>Comments are coming soon!</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Check back later to share your thoughts on this post.</p>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
