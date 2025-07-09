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
  orderBy,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
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


export async function createBlogPost(
  data: { title: string; content: string },
  user: User,
  status: 'pending' | 'draft'
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!user) {
    return { success: false, error: 'User is not authenticated.' };
  }

  try {
    const docRef = await addDoc(collection(db, 'blogs'), {
      title: data.title,
      content: data.content,
      slug: generateSlug(data.title),
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorAvatar: user.photoURL || '',
      status: status,
      createdAt: serverTimestamp(),
    });
    console.log('Blog post created with ID:', docRef.id);
    
    // Revalidate paths to show new data
    revalidatePath('/admin/blogs');
    if (status === 'published') {
        revalidatePath('/blogs');
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return { success: false, error: error.message };
  }
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
    const blogsCol = collection(db, 'blogs');
    const q = query(blogsCol, where('status', '==', 'published'), orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
}

export async function getPendingBlogs(): Promise<BlogPost[]> {
    const blogsCol = collection(db, 'blogs');
    const q = query(blogsCol, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
    const blogsCol = collection(db, 'blogs');
    const q = query(blogsCol, where('slug', '==', slug), where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as BlogPost;
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
        return { success: true };
    } catch (error) {
        console.error("Error updating blog status:", error);
        return { success: false };
    }
}
