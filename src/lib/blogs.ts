
'use server';
// This file is temporarily simplified to remove database dependencies for the blog feature.
// The original functions can be restored later when the database issues are resolved.

import { type DocumentSnapshot, type DocumentData } from 'firebase/firestore';

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

export interface AuthorInfo {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

// All previous database functions (createBlogPost, getPublishedBlogs, etc.) have been
// removed to ensure the app does not attempt to contact Firestore for blog data.
// This prevents permission errors and 404s related to the blog feature.
