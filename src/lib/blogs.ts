
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  createdAt: any; // Firestore Timestamp
  publishedAt?: any;
}

// Function to generate a URL-friendly slug
const generateSlug = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-');          // Replace multiple hyphens with a single one
  return `${slug}-${Date.now().toString(36)}`; // Add a timestamp for uniqueness
};

export interface AuthorInfo {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

export async function createBlogPost(
  data: { title: string; content: string },
  author: AuthorInfo,
  status: 'pending' | 'draft' | 'published'
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!author || !author.uid) {
    return { success: false, error: 'User is not authenticated.' };
  }

  try {
    const postData: any = {
      title: data.title,
      content: data.content,
      slug: generateSlug(data.title),
      authorId: author.uid,
      authorName: author.displayName || 'Anonymous',
      authorAvatar: author.photoURL || '',
      status: status,
      createdAt: serverTimestamp(),
    };
    
    if (status === 'published') {
        postData.publishedAt = serverTimestamp();
    }

    const docRef = await addDoc(collection(db, 'blogs'), postData);
    console.log('Blog post created with ID:', docRef.id);
    
    // Revalidate paths to show new data
    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
    revalidatePath('/blogs/[slug]');

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return { success: false, error: error.message };
  }
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
    const blogsCol = collection(db, 'blogs');
    const q = query(blogsCol, where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    
    // Sort in code instead of in the query to avoid needing a composite index
    blogs.sort((a, b) => {
        if (a.publishedAt && b.publishedAt) {
            return b.publishedAt.toMillis() - a.publishedAt.toMillis();
        }
        // Handle cases where publishedAt might be null or undefined
        if (a.publishedAt) return -1;
        if (b.publishedAt) return 1;
        return 0;
    });
    return blogs;
}

export async function getPendingBlogs(): Promise<BlogPost[]> {
    const blogsCol = collection(db, 'blogs');
    const q = query(blogsCol, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));

    // Sort in code
    blogs.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return 0;
    });
    return blogs;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
    const blogsCol = collection(db, 'blogs');
    // Query only by slug, as it should be unique.
    const q = query(blogsCol, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return null;
    }
    const blog = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BlogPost;
    
    // After fetching, filter by status in code. This avoids a composite index.
    if (blog.status !== 'published') {
      return null;
    }

    return blog;
}

export async function updateBlogStatus(blogId: string, status: 'published' | 'rejected' | 'draft'): Promise<{success: boolean}> {
    const blogRef = doc(db, 'blogs', blogId);
    try {
        const updateData: any = { status };
        if (status === 'published') {
            updateData.publishedAt = serverTimestamp();
        }
        await updateDoc(blogRef, updateData);
        revalidatePath('/admin/blogs');
        revalidatePath('/blogs');
        revalidatePath('/blogs/[slug]'); // Revalidate individual blog pages too
        return { success: true };
    } catch (error) {
        console.error("Error updating blog status:", error);
        return { success: false };
    }
}
