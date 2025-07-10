
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Static data for the blog post
const blog = {
  title: "Welcome to the Playhouse Chronicles!",
  authorName: "Shravya AI",
  authorAvatar: "/images/custom-chat-icon.png",
  publishedAt: new Date().toISOString(),
  content: `
## Welcome to Our New Blog!

Hello and welcome to the **Shravya Playhouse Chronicles**! We are so excited to launch this new space where we can share stories, learning tips, game updates, and so much more with our wonderful community of parents and kids.

### What to Expect

Here’s a little sneak peek of what you can expect to find here:

-   **Learning Through Play:** Discover how our games like Chess, Sudoku, and Pattern Builder help develop critical thinking and problem-solving skills.
-   **Creative Corner:** Get ideas for fun offline activities that complement the learning your child does in the app.
-   **Behind the Scenes:** Meet the team and learn about how we create the magical world of Shravya Playhouse.
-   **Community Spotlights:** We'll be featuring amazing stories and creations from our users.

### Our Mission

Our goal has always been to create a safe, engaging, and educational environment for kids. We believe that learning should be a joyful adventure, and this blog is another step towards that goal.

We can't wait to embark on this new journey with you. Stay tuned for our first official article next week!

Happy playing,

**The Shravya Playhouse Team**
  `,
};

export const metadata: Metadata = {
  title: blog.title,
  description: blog.content.substring(0, 160),
};

export default function StaticBlogPostPage() {
  return (
    <article className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{blog.title}</h1>
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={blog.authorAvatar} />
                    <AvatarFallback><User size={16}/></AvatarFallback>
                </Avatar>
                <span>{blog.authorName}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                   {new Date(blog.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </div>
      </header>
      
      <div className="prose dark:prose-invert lg:prose-xl max-w-none mx-auto bg-card p-6 rounded-lg shadow-sm">
        <ReactMarkdown>{blog.content}</ReactMarkdown>
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
