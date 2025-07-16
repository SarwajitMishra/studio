
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users } from 'lucide-react';

export default function VisitorCountWidget() {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    // 1. Log the unique visitor for this session if not already done.
    const logVisitor = async () => {
        try {
            const sessionId = sessionStorage.getItem('visitor-session-id') || `session_${Date.now()}_${Math.random()}`;
            sessionStorage.setItem('visitor-session-id', sessionId);
            
            const hasBeenCounted = sessionStorage.getItem('visitor-counted');
            
            if (!hasBeenCounted) {
                // The doc ID is the unique session ID, so this is an upsert.
                await setDoc(doc(db, "visitors", sessionId), { timestamp: new Date() });
                sessionStorage.setItem('visitor-counted', 'true');
                console.log("Unique visitor logged:", sessionId);
            }
        } catch (error) {
            console.error("Failed to log visitor:", error);
        }
    };
    logVisitor();

    // 2. Set up a real-time listener for the total count.
    const unsubscribe = onSnapshot(collection(db, 'visitors'), (snapshot) => {
      setVisitorCount(snapshot.size); // The number of documents is the number of unique visitors
    }, (error) => {
        console.error("Error fetching visitor count:", error);
    });

    return () => unsubscribe();
  }, []);

  if (visitorCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 text-xs bg-muted text-foreground px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
      <Users size={14} />
      <span>Unique Visitors: <strong>{visitorCount}</strong></span>
    </div>
  );
}
