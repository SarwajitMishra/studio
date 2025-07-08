
'use client';

import { db, type User } from './firebase';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp, getDoc } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    username: string;
    country: string;
    phoneNumber?: string;
    createdAt?: { seconds: number; toDate: () => Date }; // Firestore timestamp
}


/**
 * Checks if a username is unique by querying the 'users' collection.
 * @param username The username to check.
 * @param userIdToExclude Optional UID of the current user to exclude from the check, allowing them to keep their own name.
 * @returns {Promise<boolean>} True if the username is unique, false otherwise.
 */
export async function checkUsernameUnique(username: string, userIdToExclude?: string): Promise<boolean> {
  if (!username) return false;
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return true; // No one has this username, it's unique.
    }

    // If a user was found...
    // and we've provided a userIdToExclude...
    // and there's only one user with that name...
    // and that user's ID matches the one we want to exclude...
    // then it's still considered "unique" for our purposes (the user can keep their name).
    if (userIdToExclude && querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === userIdToExclude) {
      return true;
    }

    // Otherwise, the username is taken by someone else.
    return false;
  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    // Fail safely
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

/**
 * Checks if a user has admin privileges.
 * @param userId The UID of the user to check.
 * @returns {Promise<boolean>} True if the user is an admin, false otherwise.
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const roleDocRef = doc(db, 'roles', userId);
    const roleDocSnap = await getDoc(roleDocRef);
    if (roleDocSnap.exists()) {
      return roleDocSnap.data().isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}


/**
 * Fetches all user profiles from the 'users' collection.
 * This function should only be callable by an admin, enforced by Firestore rules.
 * @returns {Promise<UserProfile[]>} A list of user profiles.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => doc.data() as UserProfile);
    return userList;
}
