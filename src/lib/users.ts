
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
    displayName: string;
    email: string;
    username: string;
    country: string;
    phoneNumber?: string;
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

  const usernameDocRef = doc(db, "usernames", username.toLowerCase());

  try {
    const docSnap = await getDoc(usernameDocRef);
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
      // First, check if the username document already exists inside the transaction
      const usernameDoc = await transaction.get(usernameRef);
      if (usernameDoc.exists()) {
        throw new Error("This username is already taken. Please choose another one.");
      }

      // If the username is free, create both the user profile and the username document
      const userProfileData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        ...additionalData,
      };
      transaction.set(userRef, userProfileData);
      transaction.set(usernameRef, { uid: user.uid });
    });

    console.log(`Successfully created profile and username for user ${user.uid}.`);

    // If there's guest data, sync it in a separate batch write after the profile is created.
    if (guestData) {
      console.log(`Syncing guest data for user ${user.uid}...`);
      const batch = writeBatch(db);
      
      if (guestData.gameStats && guestData.gameStats.length > 0) {
        const statsRef = collection(db, 'users', user.uid, 'gameStats');
        guestData.gameStats.forEach(stat => {
          const statDocRef = doc(statsRef, stat.gameId);
          batch.set(statDocRef, stat);
        });
      }

      if (guestData.rewardHistory && guestData.rewardHistory.length > 0) {
        const historyRef = collection(db, 'users', user.uid, 'rewardHistory');
        guestData.rewardHistory.forEach(event => {
          const eventDocRef = doc(historyRef, event.id);
          batch.set(eventDocRef, event);
        });
      }

      const hasDataToCommit = (guestData.gameStats?.length > 0) || (guestData.rewardHistory?.length > 0);
      if (hasDataToCommit) {
          await batch.commit();
          console.log(`Guest data sync complete for ${user.uid}.`);
      }
    }

  } catch (error) {
    console.error(`Failed to create profile for user ${user.uid}:`, error);
    throw error; // Re-throw the error to be caught by the calling UI function
  }
}

/**
 * Overwrites an existing user's cloud data with local guest data.
 * @param userId The UID of the user whose data will be overwritten.
 * @param guestData The local guest data to sync.
 */
export async function syncGuestDataToProfile(userId: string, guestData: GuestData): Promise<void> {
    if (!userId) return;
    const batch = writeBatch(db);

    // 1. Update main user document with points and coins
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
        sPoints: guestData.sPoints,
        sCoins: guestData.sCoins,
    });

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
        await createUserProfile(user, {}, guestData);
    }
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
