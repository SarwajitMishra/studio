
"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  type UserCredential,
  type User,
} from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import SyncDataDialog from '@/components/auth/sync-data-dialog';
import { getGuestData, clearGuestData } from '@/lib/sync';
import { syncGuestDataToProfile } from '@/lib/users';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingLoginFn, setPendingLoginFn] = useState<(() => Promise<User | null>) | null>(null);

  const handleAuthError = (error: any) => {
    if (error.code === 'auth/popup-closed-by-user') {
      return; // Do nothing, user cancelled intentionally
    }
    console.error("Authentication error", error);
    toast({
      variant: "destructive",
      title: "Login Failed",
      description: error.message || "Please check your credentials and try again.",
    });
  };

  const handleLoginAttempt = async (loginFunction: () => Promise<UserCredential>) => {
    const guestData = getGuestData();
    if (!guestData) {
      // No guest data, just log in normally
      setIsLoading(true);
      try {
        await loginFunction();
        toast({ title: "Login Successful!", description: "Welcome back!" });
        router.push('/dashboard');
      } catch (error: any) {
        handleAuthError(error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Guest data exists, show the dialog.
    // Store the login function to be executed after the user makes a choice.
    setPendingLoginFn(() => async () => {
      try {
        const userCredential = await loginFunction();
        return userCredential.user;
      } catch (error) {
        handleAuthError(error);
        return null;
      }
    });
    setIsSyncDialogOpen(true);
  };

  const performEmailLogin = () => signInWithEmailAndPassword(auth, email, password);
  const performGoogleLogin = () => signInWithPopup(auth, googleProvider);

  const handleEmailLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLoginAttempt(performEmailLogin);
  };

  const handleGoogleLogin = () => {
    handleLoginAttempt(performGoogleLogin);
  };

  const onKeepOnline = async () => {
    if (!pendingLoginFn) return;
    setIsSyncing(true);
    try {
        await pendingLoginFn(); // Just log in
        clearGuestData(); // Clear local data
        toast({ title: "Login Successful!", description: "Your cloud data has been loaded." });
        router.push('/dashboard');
    } finally {
        setIsSyncing(false);
        setIsSyncDialogOpen(false);
    }
  };

  const onKeepLocal = async () => {
    if (!pendingLoginFn) return;
    setIsSyncing(true);
    try {
        const user = await pendingLoginFn(); // Log in first to get the user object
        if (user) {
            const guestData = getGuestData();
            if (guestData) {
                await syncGuestDataToProfile(user.uid, guestData);
            }
            clearGuestData();
        }
        toast({ title: "Sync Complete!", description: "Your local progress has been saved to your account." });
        router.push('/dashboard');
    } finally {
        setIsSyncing(false);
        setIsSyncDialogOpen(false);
    }
  };

  return (
    <>
      <SyncDataDialog
        open={isSyncDialogOpen}
        onOpenChange={setIsSyncDialogOpen}
        onKeepOnline={onKeepOnline}
        onKeepLocal={onKeepLocal}
        isSyncing={isSyncing}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>Log in to your account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log In"}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15.3 18.09C14.54 18.89 13.56 19.5 12.45 19.83C11.34 20.16 10.17 20.26 9 20.12C5.79 19.43 3.51 16.68 3.12 13.4C3.03 12.51 3.15 11.61 3.48 10.77C3.81 9.93 4.32 9.18 4.98 8.57C6.26 7.36 7.97 6.66 9.78 6.54C11.72 6.42 13.66 6.93 15.24 7.99L16.99 6.28C15.01 4.88 12.73 4.08 10.36 4.01C8.05 3.91 5.81 4.62 3.98 5.99C2.15 7.36 0.810001 9.32 0.200001 11.58C-0.419999 13.84 0.0300012 16.24 1.13 18.25C2.23 20.26 3.92 21.77 5.99 22.56C8.06 23.35 10.36 23.37 12.48 22.62C14.6 21.87 16.44 20.41 17.67 18.51L15.3 18.09Z"/><path d="M22.94 12.14C22.98 11.74 23 11.33 23 10.91C23 10.32 22.92 9.73 22.77 9.16H12V12.83H18.24C18.03 13.71 17.55 14.5 16.86 15.08L16.82 15.11L19.28 16.91L19.45 17.06C21.58 15.22 22.94 12.14 22.94 12.14Z"/><path d="M12 23C14.47 23 16.56 22.19 18.05 20.96L15.24 17.99C14.48 18.59 13.53 18.98 12.52 18.98C10.92 18.98 9.48001 18.13 8.82001 16.76L8.78001 16.72L6.21001 18.58L6.15001 18.7C7.02001 20.39 8.68001 21.83 10.62 22.48C11.09 22.64 11.56 22.77 12 22.81V23Z"/><path d="M12.01 3.00997C13.37 2.94997 14.7 3.43997 15.73 4.40997L17.97 2.21997C16.31 0.799971 14.21 -0.0600291 12.01 0.0099709C7.37001 0.0099709 3.44001 3.36997 2.02001 7.49997L4.98001 8.56997C5.60001 6.33997 7.72001 4.00997 10.22 4.00997C10.86 3.99997 11.49 4.12997 12.01 4.36997V3.00997Z"/></svg>
              Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="text-center text-sm">
            Don&apos;t have an account?&nbsp;
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
