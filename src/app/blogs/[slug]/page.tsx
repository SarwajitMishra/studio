
import { use } from 'react';
import BlogPostClient from './blog-post-client';
import { Metadata } from 'next';
import { getBlogPost } from '@/lib/blogs'; // Import the function

type Props = {
  params: Promise<{ slug: string }>;
};

// Metadata can remain in the Server Component.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // We can't know the user here, so we can only fetch published posts for metadata.
  // This is a limitation of mixing auth and Server Components for metadata.
  const post = await getBlogPost(slug);

  const title = post?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const description = post ? post.content.substring(0, 150) : `Read the blog post: ${title}`;

  return {
    title: title,
    description: description,
  };
}

// This is now a simple Server Component
export default function BlogPostPage({ params }: Props) {
  // Use the React `use` hook to correctly unwrap the promise
  const { slug } = use(params);

  // Render the Client Component and pass the slug as a simple string prop
  return <BlogPostClient slug={slug} />;
}
