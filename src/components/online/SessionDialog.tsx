'use client';
import { useState, useEffect } from 'react';
import { Copy, Share2, Loader2, AlertTriangle } from 'lucide-react';
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
import { createOnlineSession, joinOnlineSession } from '@/lib/sessions';

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionDialog({ open, onOpenChange }: SessionDialogProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const createNewSession = async () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to create an online session.' });
      return;
    }
    setIsCreating(true);
    try {
      const newId = await createOnlineSession(currentUser);
      setSessionId(newId);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create a session. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!open) {
        setSessionId('');
        setJoinId('');
    }
  }, [open]);

  const handleCopy = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
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
        const success = await joinOnlineSession(joinId, currentUser);
        if (success) {
            toast({ title: 'Joined!', description: `Successfully joined session ${joinId}.`});
            // TODO: Navigate to a lobby or the game itself
            onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Online Mode</DialogTitle>
          <DialogDescription>
            Create a session to play with friends or join an existing one.
          </DialogDescription>
        </DialogHeader>
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
                {sessionId && (
                  <>
                    <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
                      <span className="text-2xl font-bold tracking-widest">{sessionId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={handleCopy}>
                        <Copy className="mr-2" /> Copy ID
                      </Button>
                       <Button variant="outline" disabled>
                        <Share2 className="mr-2" /> Share
                      </Button>
                    </div>
                  </>
                )}
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
      </DialogContent>
    </Dialog>
  );
}
