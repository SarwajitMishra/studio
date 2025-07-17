
'use client';

import { db, auth, type User } from './firebase';
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
  getDoc,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import type { GuestData } from './sync';
import { getGuestData } from './sync';

export interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    username: string | null;
    country: string | null;
    phoneNumber?: string | null;
    createdAt?: { seconds: number; toDate: () => Date }; // Firestore timestamp
}


/**
 * Checks if a username is unique by checking for a document in the 'usernames' collection.
 * This is a fast and secure way to enforce unique usernames.
 * @param username The username to check.
 * @returns {Promise<boolean>} True if the username is unique, false otherwise.
 */
export async function checkUsernameUnique(username: string): Promise<boolean> {
  if (!username || username.length < 3) return false;

  console.log(`Checking username uniqueness for: ${username}`);
  const usernameDocRef = doc(db, "usernames", username.toLowerCase());

  try {
    const docSnap = await getDoc(usernameDocRef);
    console.log(`Username '${username}' exists: ${docSnap.exists()}`);
    return !docSnap.exists();
  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    // Fail safely, preventing signup if the check fails.
    return false;
  }
}

/**
 * Creates a user profile document in Firestore and a corresponding username document
 * within a transaction to ensure data integrity.
 * @param user The Firebase User object.
 * @param additionalData An object containing additional profile data.
 * @param guestData Optional guest data to sync on creation.
 */
export async function createUserProfile(user: User, additionalData: any, guestData?: GuestData | null) {
  if (!user) {
    console.error("createUserProfile called with no user object.");
    return;
  }
  if (!additionalData.username) {
    console.error("createUserProfile requires a username in additionalData.");
    throw new Error("Username is required to create a profile.");
  }

  const userRef = doc(db, 'users', user.uid);
  const usernameRef = doc(db, 'usernames', additionalData.username.toLowerCase());

  try {
    await runTransaction(db, async (transaction) => {
      console.log("Starting transaction to create user profile...");
      // First, check if the username document already exists inside the transaction
      const usernameDoc = await transaction.get(usernameRef);
      if (usernameDoc.exists()) {
        console.error(`Transaction failed: Username ${additionalData.username} already exists.`);
        throw new Error("This username is already taken. Please choose another one.");
      }

      // If the username is free, create both the user profile and the username document
      const userProfileData: UserProfile = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        username: additionalData.username,
        country: additionalData.country,
        phoneNumber: user.phoneNumber || additionalData.phoneNumber || null,
        createdAt: serverTimestamp(),
        ...additionalData, // This will overwrite fields if they exist, which is fine
      };
      
      // Remove undefined keys to avoid Firestore errors
      Object.keys(userProfileData).forEach(key => userProfileData[key as keyof UserProfile] === undefined && delete userProfileData[key as keyof UserProfile]);

      transaction.set(userRef, userProfileData);
      console.log("User profile document queued for creation.");
      transaction.set(usernameRef, { uid: user.uid });
      console.log("Username document queued for creation.");
    });

    console.log(`Successfully created profile and username for user ${user.uid}.`);

    // If there's guest data, sync it in a separate batch write after the profile is created.
    if (guestData) {
      console.log(`Syncing guest data for user ${user.uid}...`);
      await syncGuestDataToProfile(user.uid, guestData);
      console.log(`Guest data sync complete for ${user.uid}.`);
    }

  } catch (error) {
    console.error(`Failed to create profile for user ${user.uid}:`, error);
    throw error; // Re-throw the error to be caught by the calling UI function
  }
}

/**
 * Fetches a user's profile from Firestore.
 * @param userId The UID of the user.
 * @returns The user profile data, or null if it doesn't exist.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    const userRef = doc(db, 'users', userId);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null; // Profile does not exist
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}


/**
 * Overwrites an existing user's cloud data with local guest data.
 * This is an "upsert" operation - it creates the document if it doesn't exist.
 * @param userId The UID of the user whose data will be overwritten.
 * @param guestData The local guest data to sync.
 */
export async function syncGuestDataToProfile(userId: string, guestData: GuestData): Promise<void> {
    if (!userId) return;
    const batch = writeBatch(db);

    // 1. Update main user document with points and coins
    const userRef = doc(db, 'users', userId);
    // Use set with merge to create the document if it's missing, or update it if it exists.
    batch.set(userRef, {
        sPoints: guestData.sPoints,
        sCoins: guestData.sCoins,
    }, { merge: true });

    // 2. Overwrite game stats
    const statsRef = collection(db, 'users', userId, 'gameStats');
    guestData.gameStats.forEach(stat => {
        const statDocRef = doc(statsRef, stat.gameId);
        batch.set(statDocRef, stat); // Use set to overwrite completely
    });

    // 3. Overwrite reward history
    const historyRef = collection(db, 'users', userId, 'rewardHistory');
    guestData.rewardHistory.forEach(event => {
        const eventDocRef = doc(historyRef, event.id);
        batch.set(eventDocRef, event); // Use set to overwrite completely
    });

    await batch.commit();
}


/**
 * Syncs locally stored guest data to the currently logged-in user's Firebase profile.
 */
export async function syncLocalDataToFirebase() {
    const user = auth.currentUser;
    if (!user) {
        console.warn("syncLocalDataToFirebase called but no user is logged in.");
        return;
    }
    const guestData = getGuestData();
    if (guestData) {
        // This function is intended to sync data to an *existing* profile during login.
        // It's safer to use syncGuestDataToProfile which handles upserts.
        await syncGuestDataToProfile(user.uid, guestData);
    }
}
