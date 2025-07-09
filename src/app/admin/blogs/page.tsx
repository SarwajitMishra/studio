"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Check, X, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { getPendingBlogs, getPublishedBlogs, updateBlogStatus, type BlogPost } from '@/lib/blogs';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

export default function AdminBlogsPage() {
  const [pendingPosts, setPendingPosts] = useState<BlogPost[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const [pending, published] = await Promise.all([getPendingBlogs(), getPublishedBlogs()]);
      setPendingPosts(pending);
      setPublishedPosts(published);
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch blog posts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);
  
  const handleStatusUpdate = async (blogId: string, status: 'published' | 'rejected') => {
    const result = await updateBlogStatus(blogId, status);
    if(result.success) {
      toast({ title: 'Success', description: `Blog post has been ${status}.` });
      fetchPosts(); // Refresh the lists
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update blog status.' });
    }
  };

  const renderPostsTable = (posts: BlogPost[], isPendingTab: boolean = false) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (posts.length === 0) {
       return <p className="text-center text-muted-foreground py-8">No {isPendingTab ? 'pending' : 'published'} posts to display.</p>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell>{post.authorName}</TableCell>
              <TableCell>{format(post.createdAt.toDate(), 'PPP')}</TableCell>
              <TableCell><Badge variant={post.status === 'published' ? 'default' : 'secondary'}>{post.status}</Badge></TableCell>
              <TableCell className="text-right space-x-2">
                {isPendingTab ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleStatusUpdate(post.id, 'published')}><Check className="h-4 w-4 text-green-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleStatusUpdate(post.id, 'rejected')}><X className="h-4 w-4 text-red-500" /></Button>
                  </>
                ) : (
                   <Button asChild variant="outline" size="icon"><Link href={`/blogs/${post.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link></Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">Create, approve, and manage all blog posts.</p>
        </div>
        <Button asChild>
          <Link href="/blogs/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Post
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Approval ({pendingPosts.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts (Coming Soon)</TabsTrigger>
        </TabsList>
         <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>Review these user-submitted posts before they go live.</CardDescription>
            </CardHeader>
            <CardContent>
               {renderPostsTable(pendingPosts, true)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Published Posts</CardTitle>
              <CardDescription>These posts are live and visible to users.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderPostsTable(publishedPosts)}
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Drafts</CardTitle>
              <CardDescription>Posts saved by users but not yet submitted for review.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-center text-muted-foreground py-8">This section is under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
