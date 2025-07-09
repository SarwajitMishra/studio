
'use client';

import { db, auth, type User } from './firebase';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
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
 * Now optionally accepts guest data to sync on creation.
 * @param user The Firebase User object.
 * @param additionalData An object containing additional profile data to store.
 * @param guestData Optional guest data to sync to the new profile.
 */
export async function createUserProfile(user: User, additionalData: any, guestData?: GuestData | null) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);

  const data: any = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    ...additionalData
  };

  // If there's guest data, add it to the initial profile document
  if (guestData) {
    data.sPoints = guestData.sPoints;
    data.sCoins = guestData.sCoins;
  }
  
  await setDoc(userRef, data, { merge: true });

  // If there's guest data, also sync stats and history to subcollections
  if (guestData) {
    const batch = writeBatch(db);
    
    // Sync Game Stats
    if (guestData.gameStats && guestData.gameStats.length > 0) {
      const statsRef = collection(db, 'users', user.uid, 'gameStats');
      guestData.gameStats.forEach(stat => {
        const statDocRef = doc(statsRef, stat.gameId);
        batch.set(statDocRef, stat);
      });
    }

    // Sync Reward History
    if (guestData.rewardHistory && guestData.rewardHistory.length > 0) {
      const historyRef = collection(db, 'users', user.uid, 'rewardHistory');
      guestData.rewardHistory.forEach(event => {
        const eventDocRef = doc(historyRef, event.id);
        batch.set(eventDocRef, event);
      });
    }

    if ((guestData.gameStats && guestData.gameStats.length > 0) || (guestData.rewardHistory && guestData.rewardHistory.length > 0)) {
        await batch.commit();
    }
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
        await syncGuestDataToProfile(user.uid, guestData);
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
