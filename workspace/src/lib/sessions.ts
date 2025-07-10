
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
    getDocs,
    Timestamp,
} from 'firebase/firestore';

export interface OnlineSession {
    id: string;
    hostUid: string;
    hostName: string;
    participants: { uid: string; name: string; }[];
    status: 'waiting' | 'playing' | 'finished';
    gameId: string | null;
    createdAt: Timestamp;
}

/**
 * Creates a new online session in Firestore.
 * @param user The user object of the host.
 * @returns The data of the newly created session.
 */
export async function createOnlineSession(user: User): Promise<OnlineSession> {
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionRef = doc(db, 'sessions', sessionId);

    const newSession: Omit<OnlineSession, 'createdAt'> & { createdAt: any } = {
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
    
    // Fetch the doc to get the server-generated timestamp
    const docSnap = await getDoc(sessionRef);
    return docSnap.data() as OnlineSession;
}

/**
 * Allows a user to join an existing online session.
 * @param sessionId The ID of the session to join.
 * @param user The user object of the person joining.
 * @returns The session data if join was successful, null otherwise.
 */
export async function joinOnlineSession(sessionId: string, user: User): Promise<OnlineSession | null> {
    const sessionRef = doc(db, 'sessions', sessionId.toUpperCase());
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
        console.error(`[Session] Join failed: Session with ID ${sessionId} not found.`);
        return null;
    }

    const sessionData = sessionDoc.data() as OnlineSession;

    // Prevent joining if already full (e.g., 4 players max for now)
    if (sessionData.participants.length >= 4) {
        console.error(`[Session] Join failed: Session ${sessionId} is already full.`);
        return null;
    }

    // Prevent joining if already a participant
    if (sessionData.participants.some(p => p.uid === user.uid)) {
        console.log(`[Session] User ${user.uid} is already in session ${sessionId}.`);
        return sessionData; // Already in, so "successful"
    }

    await updateDoc(sessionRef, {
        participants: arrayUnion({ uid: user.uid, name: user.displayName || 'Anonymous' })
    });
    
    console.log(`[Session] User ${user.uid} successfully joined session ${sessionId}.`);
    
    const updatedDoc = await getDoc(sessionRef);
    return updatedDoc.data() as OnlineSession;
}
