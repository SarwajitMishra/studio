
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
    getDoc,
} from 'firebase/firestore';
import { type BlogFormValues } from '@/components/blog/BlogForm'; // Corrected import path

export type BlogStatus = 'draft' | 'pending-review' | 'published' | 'rejected';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status: BlogStatus;
  createdAt: any;
  publishedAt?: any | null;
}

export interface AuthorInfo {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
};

export async function createBlogPost(data: BlogFormValues, author: AuthorInfo, status: BlogStatus): Promise<{ success: boolean; error?: string }> {
  try {
    const slug = createSlug(data.title);
    const blogsCollectionRef = collection(db, 'blogs');
    
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

export async function updateBlogPost(postId: string, data: BlogFormValues, newStatus: BlogStatus): Promise<{ success: boolean; error?: string }> {
    try {
        const postRef = doc(db, 'blogs', postId);
        const newSlug = createSlug(data.title);

        await updateDoc(postRef, {
            title: data.title,
            content: data.content,
            slug: newSlug,
            status: newStatus,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating blog post:", error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}


const processPost = (doc: any): BlogPost => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate().toISOString() : data.publishedAt,
    } as BlogPost;
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
    const blogsCollectionRef = collection(db, 'blogs');
    const q = query(blogsCollectionRef, where("status", "==", "published"), orderBy("publishedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(processPost);
}

export async function getMyBlogs(uid: string): Promise<BlogPost[]> {
    if (!uid) return [];
    
    const blogsCollectionRef = collection(db, 'blogs');
    const q = query(
        blogsCollectionRef, 
        where("authorId", "==", uid),
        where("status", "!=", "rejected"), 
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(processPost);
}

export async function getBlogsForUser(uid: string): Promise<BlogPost[]> {
    const publishedBlogs = await getPublishedBlogs();
    const myBlogs = await getMyBlogs(uid);

    const combinedMap = new Map<string, BlogPost>();
    publishedBlogs.forEach(post => combinedMap.set(post.id, post));
    myBlogs.forEach(post => combinedMap.set(post.id, post));

    const combined = Array.from(combinedMap.values());
    
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return combined;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
    const blogsCollectionRef = collection(db, 'blogs');
    const q = query(blogsCollectionRef, where("slug", "==", slug), limit(1));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return null;
    }
    
    return processPost(querySnapshot.docs[0]);
}

export async function updateBlogStatus(postId: string, newStatus: BlogStatus): Promise<{ success: boolean; error?: string }> {
    try {
        const postRef = doc(db, 'blogs', postId);
        await updateDoc(postRef, { status: newStatus });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating blog status:", error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}
