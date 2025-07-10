
'use client';
import { useState, useEffect } from 'react';
import { Copy, Share2, Loader2, AlertTriangle, Users, MessageSquare, Send } from 'lucide-react';
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
import { 
  createOnlineSession, 
  joinOnlineSession, 
  sendMessage,
  onNewMessage,
  type OnlineSession,
  type ChatMessage
} from '@/lib/sessions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
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
        setMessages([]);
    }
  }, [open]);

  // Firestore listener for session updates (participants)
  useEffect(() => {
      if (session?.id) {
          const unsub = onSnapshot(doc(db, "sessions", session.id), (doc) => {
              if (doc.exists()) {
                  const updatedSession = doc.data() as OnlineSession;
                  // Only update participants to avoid re-rendering chat on every message
                  setSession(prev => ({...prev, ...updatedSession}));
              } else {
                  setSession(null);
                  toast({ variant: 'destructive', title: 'Session Closed', description: 'The session you were in is no longer active.' });
              }
          });
          return () => unsub();
      }
  }, [session?.id, toast]);

  // Firestore listener for chat messages
  useEffect(() => {
    if (session?.id) {
        const unsubscribeMessages = onNewMessage(session.id, (newMessages) => {
            setMessages(newMessages);
        });
        return () => unsubscribeMessages();
    }
  }, [session?.id]);

  const handleCopy = () => {
    if (!session?.id) return;
    navigator.clipboard.writeText(session.id);
    toast({ title: 'Copied!', description: 'Session ID copied to clipboard.' });
  };
  
  const handleShare = async () => {
    if (!session?.id) return;
    const shareData = {
      title: 'Join my Shravya Playhouse Session!',
      text: `Join my game session on Shravya Playhouse with this code: ${session.id}`,
      url: window.location.origin, // optional
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        handleCopy();
        toast({ title: 'Sharing not supported', description: 'Session ID copied to clipboard instead.'});
      }
    } catch (err) {
      console.error('Share failed:', err);
      toast({ variant: 'destructive', title: 'Share Failed', description: 'Could not share session.'});
    }
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
  
  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!session?.id || !currentUser || !chatInput.trim()) return;

      try {
        await sendMessage(session.id, currentUser, chatInput.trim());
        setChatInput('');
      } catch (error) {
         console.error("Error sending message:", error);
         toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.' });
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
    <div className="pt-4 space-y-4 flex flex-col h-[60vh]">
        <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleCopy}>
                <Copy className="mr-2" /> Copy ID
            </Button>
            <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2" /> Share
            </Button>
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold flex items-center"><Users className="mr-2 h-4 w-4"/>Participants ({session?.participants.length})</h3>
            <div className="p-3 bg-muted rounded-lg space-y-2 max-h-24 overflow-y-auto">
                {session?.participants.map(p => (
                    <p key={p.uid} className="text-sm font-medium">{p.name} {p.uid === currentUser?.uid && <span className="text-muted-foreground">(You)</span>}</p>
                ))}
            </div>
        </div>
        
        <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>Game Chat</AlertTitle>
            <AlertDescription>
                Multiplayer games are coming soon! For now, you can chat with others in this session.
            </AlertDescription>
        </Alert>

        <div className="flex-grow flex flex-col min-h-0">
           <ScrollArea className="flex-grow pr-4 -mr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex items-start gap-3", msg.uid === currentUser?.uid ? 'justify-end' : 'justify-start')}>
                        {msg.uid !== currentUser?.uid && (
                           <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.photoURL || undefined} />
                            <AvatarFallback>{msg.name?.charAt(0) || 'U'}</AvatarFallback>
                           </Avatar>
                        )}
                        <div className={cn("max-w-[75%] p-2 px-3 rounded-lg shadow-sm", msg.uid === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                            <p className="text-xs font-bold mb-0.5">{msg.name}</p>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
              </div>
            </ScrollArea>
             <form onSubmit={handleSendMessage} className="flex-shrink-0 flex items-center gap-2 pt-4 border-t">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." />
                <Button type="submit" size="icon" disabled={!chatInput.trim()}><Send /></Button>
            </form>
        </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Online Session</DialogTitle>
          <DialogDescription>
            {session ? `Connected to session ${session.id}.` : 'Create or join a session to play with friends.'}
          </DialogDescription>
        </DialogHeader>
        {session ? renderConnectedView() : renderSetupView()}
      </DialogContent>
    </Dialog>
  );
}
