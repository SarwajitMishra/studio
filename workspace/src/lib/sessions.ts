
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
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    type Timestamp,
} from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    text: string;
    uid: string;
    name: string;
    photoURL: string | null;
    createdAt: Timestamp;
}

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


/**
 * Sends a chat message to a session.
 * @param sessionId The ID of the session.
 * @param user The user sending the message.
 * @param text The message content.
 */
export async function sendMessage(sessionId: string, user: User, text: string): Promise<void> {
    const messagesColRef = collection(db, 'sessions', sessionId, 'messages');
    await addDoc(messagesColRef, {
        text,
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
    });
}

/**
 * Listens for new messages in a session and calls a callback with the messages.
 * @param sessionId The ID of the session.
 * @param callback The function to call with the array of messages.
 * @returns An unsubscribe function for the listener.
 */
export function onNewMessage(sessionId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesQuery = query(
        collection(db, 'sessions', sessionId, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        callback(messages);
    });

    return unsubscribe;
}
