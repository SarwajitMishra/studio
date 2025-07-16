
import { getBlogPostBySlug, type BlogPost } from '@/lib/blogs';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, Mail, Phone, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.content.substring(0, 150),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

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
                    {format(new Date(post.publishedAt.seconds * 1000), 'PPP')}
                  </span>
                )}
            </div>
        </div>
      </header>
      
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
