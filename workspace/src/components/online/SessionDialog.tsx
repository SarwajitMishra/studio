
'use client';
import { useState, useEffect } from 'react';
import { Copy, Share2, Loader2, AlertTriangle, Users, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { auth, onAuthStateChanged, type User } from '@/lib/firebase';
import { createOnlineSession, joinOnlineSession, type OnlineSession } from '@/lib/sessions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionDialog({ open, onOpenChange }: SessionDialogProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joinId, setJoinId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const [session, setSession] = useState<OnlineSession | null>(null);
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  const createNewSession = async () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to create an online session.' });
      return;
    }
    setIsCreating(true);
    try {
      const newSessionData = await createOnlineSession(currentUser);
      setSession(newSessionData);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create a session. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!open) {
        setSession(null);
        setJoinId('');
    }
  }, [open]);

  // Firestore listener for session updates
  useEffect(() => {
      if (session?.id) {
          const unsub = onSnapshot(doc(db, "sessions", session.id), (doc) => {
              if (doc.exists()) {
                  setSession(doc.data() as OnlineSession);
              } else {
                  setSession(null); // Session was deleted or not found
                  toast({ variant: 'destructive', title: 'Session Closed', description: 'The session you were in is no longer active.' });
              }
          });
          return () => unsub();
      }
  }, [session?.id, toast]);

  const handleCopy = () => {
    if (!session?.id) return;
    navigator.clipboard.writeText(session.id);
    toast({ title: 'Copied!', description: 'Session ID copied to clipboard.' });
  };
  
  const handleJoin = async () => {
      if (!currentUser) {
        toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to join a session.' });
        return;
      }
      if(!joinId || joinId.length < 6) {
        toast({ variant: 'destructive', title: 'Invalid ID', description: 'Please enter a valid 6-character session ID.' });
        return;
      };

      setIsJoining(true);
      try {
        const joinedSession = await joinOnlineSession(joinId, currentUser);
        if (joinedSession) {
            setSession(joinedSession);
            toast({ title: 'Joined!', description: `Successfully joined session ${joinId}.`});
        } else {
            toast({ variant: 'destructive', title: 'Join Failed', description: 'Session not found or is full. Please check the ID.'});
        }
      } catch (error) {
        console.error("Error joining session:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not join session. Please try again.' });
      } finally {
        setIsJoining(false);
      }
  }
  
  const NotLoggedInAlert = () => (
    <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Login Required</AlertTitle>
        <AlertDescription>
            You must be logged in to use online mode.
        </AlertDescription>
    </Alert>
  );

  const renderSetupView = () => (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create">Create Session</TabsTrigger>
        <TabsTrigger value="join">Join Session</TabsTrigger>
      </TabsList>
      <TabsContent value="create" className="pt-4 space-y-4">
        {currentUser ? (
          <>
            <p className="text-sm text-muted-foreground">Click the button to generate a new session ID to share with a friend.</p>
            <Button className="w-full" onClick={createNewSession} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 animate-spin"/> : null}
              {isCreating ? 'Creating...' : 'Create New Session ID'}
            </Button>
          </>
        ) : (
            <NotLoggedInAlert />
        )}
      </TabsContent>
      <TabsContent value="join" className="pt-4 space-y-4">
          {currentUser ? (
            <>
                <p className="text-sm text-muted-foreground">Enter the session ID you received from a friend.</p>
                <Input 
                    placeholder="Enter Session ID" 
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                    className="text-center tracking-widest"
                    maxLength={6}
                />
                <Button className="w-full" onClick={handleJoin} disabled={isJoining || !joinId || joinId.length < 6}>
                  {isJoining ? <Loader2 className="mr-2 animate-spin" /> : null}
                  {'Join Session'}
                </Button>
            </>
          ) : (
            <NotLoggedInAlert />
          )}
      </TabsContent>
    </Tabs>
  );

  const renderConnectedView = () => (
    <div className="pt-4 space-y-4">
        <div className="text-center">
            <p className="text-sm text-muted-foreground">Session ID</p>
            <div className="flex items-center justify-center p-3 mt-1 border-2 border-dashed rounded-lg">
                <span className="text-2xl font-bold tracking-widest">{session?.id}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="mt-2">
                <Copy className="mr-2 h-4 w-4" /> Copy ID
            </Button>
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold flex items-center"><Users className="mr-2 h-4 w-4"/>Connected Users ({session?.participants.length})</h3>
            <div className="p-3 bg-muted rounded-lg space-y-2 max-h-24 overflow-y-auto">
                {session?.participants.map(p => (
                    <p key={p.uid} className="text-sm">{p.name} {p.uid === currentUser?.uid && '(You)'}</p>
                ))}
            </div>
        </div>

        <div className="space-y-2">
            <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>Chat Enabled!</AlertTitle>
                <AlertDescription>
                    Multiplayer games are coming soon! For now, you can chat with others in this session.
                </AlertDescription>
            </Alert>
            <div className="h-48 p-3 border rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                <p>Real-time chat coming soon...</p>
            </div>
        </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Online Session</DialogTitle>
          <DialogDescription>
            {session ? `You are connected to session ${session.id}.` : 'Create a session to play with friends or join an existing one.'}
          </DialogDescription>
        </DialogHeader>
        {session ? renderConnectedView() : renderSetupView()}
      </DialogContent>
    </Dialog>
  );
}

