
'use server';

import { 
    db,
} from '@/lib/firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    serverTimestamp,
    doc,
    updateDoc,
    orderBy,
    limit,
    getDoc
} from 'firebase/firestore';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  createdAt: any; // serverTimestamp is used initially
  publishedAt?: any | null;
}

export interface AuthorInfo {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

// Function to create a URL-friendly slug from a title
const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
};

/**
 * Creates a new blog post document in Firestore.
 * @param data The blog post data (title, content).
 * @param author The author's user info.
 * @param status The initial status of the post.
 * @returns An object indicating success or failure.
 */
export async function createBlogPost(data: { title: string, content: string }, author: AuthorInfo, status: 'pending' | 'draft'): Promise<{ success: boolean; error?: string }> {
  try {
    const slug = createSlug(data.title);
    const blogsCollectionRef = collection(db, 'blogs');
    
    // Check if slug already exists to prevent duplicates
    const q = query(blogsCollectionRef, where("slug", "==", slug), limit(1));
    const slugSnapshot = await getDocs(q);
    if (!slugSnapshot.empty) {
      return { success: false, error: "A blog post with a very similar title already exists." };
    }

    await addDoc(blogsCollectionRef, {
      ...data,
      slug,
      authorId: author.uid,
      authorName: author.displayName || 'Anonymous',
      authorAvatar: author.photoURL || '',
      status: status,
      createdAt: serverTimestamp(),
      publishedAt: null,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    return { success: false, error: error.message || "An unknown error occurred." };
  }
}

/**
 * Fetches all blog posts with 'published' status, sorted by published date.
 * @returns An array of published blog posts.
 */
export async function getPublishedBlogs(): Promise<BlogPost[]> {
    const blogsCollectionRef = collection(db, 'blogs');
    // Fetch all published posts without sorting at the DB level
    const q = query(blogsCollectionRef, where("status", "==", "published"));
    const querySnapshot = await getDocs(q);
    
    // Map and then sort in code
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    posts.sort((a, b) => {
        const dateA = a.publishedAt?.seconds || 0;
        const dateB = b.publishedAt?.seconds || 0;
        return dateB - dateA; // Sort descending
    });

    return posts;
}

/**
 * Fetches all blog posts with 'pending' status, sorted by creation date.
 * @returns An array of pending blog posts.
 */
export async function getPendingBlogs(): Promise<BlogPost[]> {
    const blogsCollectionRef = collection(db, 'blogs');
     // Fetch all pending posts without sorting at the DB level
    const q = query(blogsCollectionRef, where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    
    // Map and then sort in code
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    posts.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA; // Sort descending
    });

    return posts;
}


/**
 * Updates the status of a blog post.
 * Used by admins to publish or reject posts.
 * @param blogId The ID of the blog post to update.
 * @param newStatus The new status to set ('published' or 'rejected').
 * @returns An object indicating success or failure.
 */
export async function updateBlogStatus(blogId: string, newStatus: 'published' | 'rejected'): Promise<{ success: boolean; error?: string }> {
    try {
        const blogDocRef = doc(db, 'blogs', blogId);
        const updateData: any = { status: newStatus };
        
        if (newStatus === 'published') {
            updateData.publishedAt = serverTimestamp();
        }

        await updateDoc(blogDocRef, updateData);
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating blog ${blogId} to ${newStatus}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches a single blog post by its slug.
 * Ensures that only published posts are returned.
 * @param slug The URL slug of the blog post.
 * @returns The blog post data or null if not found or not published.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const blogsCollectionRef = collection(db, 'blogs');
    const q = query(
        blogsCollectionRef, 
        where("slug", "==", slug), 
        where("status", "==", "published"), 
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as BlogPost;
}
