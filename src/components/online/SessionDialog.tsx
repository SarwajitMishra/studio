'use client';
import { useState, useEffect } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionDialog({ open, onOpenChange }: SessionDialogProps) {
  const [sessionId, setSessionId] = useState('');
  const [joinId, setJoinId] = useState('');
  const { toast } = useToast();

  const createNewSession = () => {
    // Generate a simple, user-friendly ID
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionId(newId);
    // In a real app, this would also create a session document in Firestore
  };

  // Generate a session ID when the dialog opens on the "Create" tab
  useEffect(() => {
    if (open && !sessionId) {
      createNewSession();
    }
    if (!open) {
        // Reset when dialog closes
        setSessionId('');
    }
  }, [open, sessionId]);

  const handleCopy = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    toast({ title: 'Copied!', description: 'Session ID copied to clipboard.' });
  };
  
  const handleJoin = () => {
      // Stub function for now
      if(!joinId) return;
      toast({ title: 'Joining...', description: `Attempting to join session ${joinId}. (Functionality coming soon!)`});
      onOpenChange(false); // Close dialog on join attempt
  }

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
            <TabsTrigger value="create" onClick={createNewSession}>Create Session</TabsTrigger>
            <TabsTrigger value="join">Join Session</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Share this ID with a friend so they can join your session.</p>
            <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
              <span className="text-2xl font-bold tracking-widest">{sessionId || '...'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleCopy} disabled={!sessionId}>
                <Copy className="mr-2" /> Copy ID
              </Button>
               <Button variant="outline" disabled={!sessionId}>
                <Share2 className="mr-2" /> Share
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="join" className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Enter the session ID you received from a friend.</p>
            <Input 
                placeholder="Enter Session ID" 
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                className="text-center tracking-widest"
                maxLength={6}
            />
            <Button className="w-full" onClick={handleJoin} disabled={!joinId || joinId.length < 6}>Join Session</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
