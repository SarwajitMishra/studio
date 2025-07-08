
'use client';

import { db, type User } from './firebase';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';

/**
 * Checks if a username is unique by querying the 'users' collection.
 * @param username The username to check.
 * @returns {Promise<boolean>} True if the username is unique, false otherwise.
 */
export async function checkUsernameUnique(username: string): Promise<boolean> {
  if (!username) return false;
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    // In case of an error, prevent signup to be safe
    return false;
  }
}

/**
 * Creates or updates a user profile document in Firestore.
 * @param user The Firebase User object.
 * @param additionalData An object containing additional profile data to store.
 */
export async function createUserProfile(user: User, additionalData: any) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  
  const data = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    ...additionalData
  };
  
  // Use setDoc with merge: true to create or update the document without overwriting existing fields
  // that might have been set by other processes (e.g., Google sign-in).
  return setDoc(userRef, data, { merge: true });
}
