"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { onAuthStateChanged, type User } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { createBlogPost } from '@/lib/blogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const blogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title must be 100 characters or less."),
  content: z.string().min(100, "Content must be at least 100 characters long."),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function CreateBlogPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLoginRedirect, setShowLoginRedirect] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: { title: "", content: "" },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setShowLoginRedirect(true);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);
  
  const handleFormSubmit: SubmitHandler<BlogFormValues> = async (data, event) => {
    const submitter = (event?.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.name === 'saveDraft' ? 'draft' : 'pending';

    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to create a post.' });
      return;
    }

    setIsLoading(true);
    const result = await createBlogPost(data, currentUser, status);
    setIsLoading(false);

    if (result.success) {
      toast({ title: "Success!", description: `Your post has been saved as ${status}.` });
      router.push('/blogs');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to save post.' });
    }
  };
  
  if (!authChecked) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <>
     <AlertDialog open={showLoginRedirect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to write a blog post. Please log in to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/login')}>Go to Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    <div className="space-y-6">
       <Button asChild variant="outline">
        <Link href="/blogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog Posts
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Write a New Blog Post</CardTitle>
          <CardDescription>Share your thoughts with the Shravya Playhouse community. Your post will be reviewed before publishing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a catchy title" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Content</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Write your blog post here... Use Markdown for formatting." rows={15} {...field} disabled={isLoading} />
                    </FormControl>
                    <FormDescription>Markdown is supported for text formatting.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <div className="flex justify-end gap-2">
                <Button type="submit" name="saveDraft" variant="outline" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save as Draft
                </Button>
                <Button type="submit" name="submitReview" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit for Review
                </Button>
            </div>
          </form>
         </Form>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
