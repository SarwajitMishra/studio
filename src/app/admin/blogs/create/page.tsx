
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateBlogPage() {
  // Form submission logic will be added in a future step.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Firestore logic to save the blog post.
    alert("Blog submission logic not yet implemented.");
  };

  return (
    <div className="space-y-6">
       <Button asChild variant="outline">
        <Link href="/admin/blogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog Management
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create a New Blog Post</CardTitle>
          <CardDescription>Write and publish a new article for the Shravya Playhouse community.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Post Title</Label>
              <Input id="title" placeholder="Enter a catchy title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Post Content</Label>
              <Textarea id="content" placeholder="Write your blog post here... Use Markdown for formatting." rows={15} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline">Save as Draft</Button>
                <Button type="submit">Publish Post</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
