
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
  type DocumentSnapshot,
  type DocumentData,
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
  createdAt: string; // ISO String
  publishedAt?: string | null; // ISO String or null
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

// Helper function to serialize a blog post document
const serializePost = (docSnap: DocumentSnapshot<DocumentData>): BlogPost => {
    const data = docSnap.data();
    if (!data) {
        throw new Error(`Document with id ${docSnap.id} has no data.`);
    }

    return {
        id: docSnap.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        authorId: data.authorId,
        authorName: data.authorName,
        authorAvatar: data.authorAvatar,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(), // Fallback to now
        publishedAt: data.publishedAt ? data.publishedAt.toDate().toISOString() : null,
    } as BlogPost;
};


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
      publishedAt: null, // Always include this key
    };
    
    if (status === 'published') {
        postData.publishedAt = serverTimestamp();
    }

    const docRef = await addDoc(collection(db, 'blogs'), postData);
    console.log('Blog post created with ID:', docRef.id);
    
    // Revalidate paths to show new data
    revalidatePath('/admin/blogs');
    revalidatePath('/blogs');
    revalidatePath(`/blogs/${postData.slug}`);

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
    const blogs = snapshot.docs.map(serializePost);
    
    // Sort by string date (ISO format is sortable)
    blogs.sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt));
    return blogs;
}

export async function getPendingBlogs(): Promise<BlogPost[]> {
    const blogsCol = collection(db, 'blogs');
    const q = query(blogsCol, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const blogs = snapshot.docs.map(serializePost);

    blogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return blogs;
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
    const blogsCol = collection(db, 'blogs');
    // This query REQUIRES a composite index on ('slug', 'status') in Firestore.
    // This is the correct way to query while respecting security rules.
    const q = query(blogsCol, where('slug', '==', slug), where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return null;
    }
    
    const doc = snapshot.docs[0];
    return serializePost(doc);
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
