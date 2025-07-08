import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";

export default function AdminBlogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">Create, approve, and manage all blog posts.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Post
        </Button>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval (5)</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Published Posts</CardTitle>
              <CardDescription>These posts are live and visible to users. (Placeholder)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">No published posts yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>Review these user-submitted posts before they go live. (Placeholder)</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-center text-muted-foreground py-8">No pending posts to review.</p>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="drafts">
          <Card>
            <CardHeader>
              <CardTitle>Your Drafts</CardTitle>
              <CardDescription>Posts you have saved but not yet published. (Placeholder)</CardDescription>
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
