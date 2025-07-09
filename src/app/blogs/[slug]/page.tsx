import { notFound } from 'next/navigation';
import { getBlogBySlug } from '@/lib/blogs';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const blog = await getBlogBySlug(params.slug);
  if (!blog) {
    return {
      title: 'Post Not Found',
    };
  }
  return {
    title: blog.title,
    description: blog.content.substring(0, 160),
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const blog = await getBlogBySlug(params.slug);

  if (!blog) {
    notFound();
  }

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
                   {blog.publishedAt ? format(blog.publishedAt.toDate(), 'PPP') : format(blog.createdAt.toDate(), 'PPP')}
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
