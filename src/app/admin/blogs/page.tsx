
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit, Trash2, EyeOff } from "lucide-react";
import Link from "next/link";

// Sample data - this will be replaced with data from Firestore
const samplePosts = [
  { id: '1', title: 'Welcome to Shravya Playhouse!', author: 'Admin', date: '2024-07-25', status: 'Published' },
  { id: '2', title: 'Top 5 Strategies for Chess Beginners', author: 'Admin', date: '2024-07-24', status: 'Published' },
  { id: '3', title: 'How Puzzles Boost Brain Power', author: 'Admin', date: '2024-07-22', status: 'Published' },
];

export default function AdminBlogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">Create, approve, and manage all blog posts.</p>
        </div>
        <Button asChild>
          <Link href="/admin/blogs/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Post
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval (0)</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Published Posts</CardTitle>
              <CardDescription>These posts are live and visible to users. (Sample data)</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {samplePosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>{post.date}</TableCell>
                      <TableCell><Badge>{post.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon"><EyeOff className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>Review these user-submitted posts before they go live.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-center text-muted-foreground py-8">No pending posts to review.</p>
            </Content>
          </Card>
        </TabsContent>
         <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Your Drafts</CardTitle>
              <CardDescription>Posts you have saved but not yet published.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-center text-muted-foreground py-8">No drafts saved.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
