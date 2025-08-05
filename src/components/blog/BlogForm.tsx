
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type User } from '@/lib/firebase';
import { createBlogPost, updateBlogPost, type BlogStatus, type BlogPost } from '@/lib/blogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Trash2, Send } from "lucide-react";
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

const blogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title must be 100 characters or less."),
  content: z.string().min(100, "Content must be at least 100 characters long."),
});

export type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogFormProps {
    currentUser: User;
    post?: BlogPost; // Make post optional for creation
}

export default function BlogForm({ currentUser, post }: BlogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
    },
  });

  const handleSave = useCallback(async (data: BlogFormValues, status: BlogStatus) => {
    setIsLoading(true);

    const authorInfo = {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
    };
    
    let result;
    if (post) { // If post exists, update it
        result = await updateBlogPost(post.id, data, status);
    } else { // Otherwise, create a new one
        result = await createBlogPost(data, authorInfo, status);
    }

    setIsLoading(false);

    if (result.success) {
      toast({ title: "Success!", description: `Your post has been successfully saved.` });
      router.push('/blogs');
      router.refresh(); // Refresh to show changes
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to save post.' });
    }
  }, [currentUser, post, router, toast]);

  const handleDiscard = () => {
    form.reset({ title: "", content: "" });
    router.back(); // Go back to the previous page
  }

  const isEditing = !!post;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Blog Post" : "Write a New Blog Post"}</CardTitle>
        <CardDescription>
          {isEditing ? "Make your changes and save, or submit for another review." : "Share your thoughts with the community."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => handleSave(data, 'pending-review'))} className="space-y-6">
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

          <div className="flex justify-between items-center pt-4">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" disabled={isLoading}>
                          <Trash2 className="mr-2 h-4 w-4" /> Discard Changes
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This will discard any unsaved changes and return you to the previous page.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDiscard}>Yes, Discard</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>

              <div className="flex justify-end gap-2">
                  <Button 
                      type="button" 
                      variant="secondary"
                      onClick={form.handleSubmit((data) => handleSave(data, 'draft'))}
                      disabled={isLoading}
                  >
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {isEditing ? 'Resubmit for Review' : 'Submit for Review'}
                  </Button>
              </div>
          </div>
        </form>
       </Form>
      </CardContent>
    </Card>
  );
}
