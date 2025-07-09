'use client';

import { 
    db, 
    type User 
} from '@/lib/firebase';
import { 
    doc, 
    setDoc, 
    getDoc,
    updateDoc, 
    arrayUnion,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';

export interface OnlineSession {
    id: string;
    hostUid: string;
    hostName: string;
    participants: { uid: string; name: string; }[];
    status: 'waiting' | 'playing' | 'finished';
    gameId: string | null;
    createdAt: any; // Firestore ServerTimestamp
}

/**
 * Creates a new online session in Firestore.
 * @param user The user object of the host.
 * @returns The ID of the newly created session.
 */
export async function createOnlineSession(user: User): Promise<string> {
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionRef = doc(db, 'sessions', sessionId);

    const newSession: OnlineSession = {
        id: sessionId,
        hostUid: user.uid,
        hostName: user.displayName || 'Anonymous',
        participants: [{ uid: user.uid, name: user.displayName || 'Anonymous' }],
        status: 'waiting',
        gameId: null,
        createdAt: serverTimestamp(),
    };

    await setDoc(sessionRef, newSession);
    console.log(`[Session] Created new session with ID: ${sessionId}`);
    return sessionId;
}

/**
 * Allows a user to join an existing online session.
 * @param sessionId The ID of the session to join.
 * @param user The user object of the person joining.
 * @returns True if join was successful, false otherwise.
 */
export async function joinOnlineSession(sessionId: string, user: User): Promise<boolean> {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
        console.error(`[Session] Join failed: Session with ID ${sessionId} not found.`);
        return false;
    }

    const sessionData = sessionDoc.data() as OnlineSession;

    // Prevent joining if already full (e.g., 2 players max for now)
    if (sessionData.participants.length >= 2) {
        console.error(`[Session] Join failed: Session ${sessionId} is already full.`);
        return false;
    }

    // Prevent joining if already a participant
    if (sessionData.participants.some(p => p.uid === user.uid)) {
        console.log(`[Session] User ${user.uid} is already in session ${sessionId}.`);
        return true; // Already in, so "successful"
    }

    await updateDoc(sessionRef, {
        participants: arrayUnion({ uid: user.uid, name: user.displayName || 'Anonymous' })
    });
    
    console.log(`[Session] User ${user.uid} successfully joined session ${sessionId}.`);
    return true;
}
