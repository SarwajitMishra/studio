
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  AVATARS, 
  GAMES, 
  type Game, 
  S_POINTS_ICON as SPointsIcon, 
  S_COINS_ICON as SCoinsIcon,
  LOCAL_STORAGE_S_POINTS_KEY,
  LOCAL_STORAGE_S_COINS_KEY
} from "@/lib/constants";
import { UserCircle, BarChart3, Settings, CheckCircle, LogIn, LogOut, UploadCloud, Edit3, User as UserIcon, Palette, Sun, Moon, Trophy, Gamepad2, Star, Coins, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  auth,
  storage,
  getRedirectResult,
  googleProvider,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from '@/lib/firebase';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light Mode', Icon: Sun },
  { value: 'dark', label: 'Dark Mode', Icon: Moon },
];

const FAVORITE_COLOR_OPTIONS = [
  { value: 'default', label: 'Default Theme Accent' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'teal', label: 'Teal' },
];

const LOCAL_STORAGE_USER_NAME_KEY = 'shravyaPlayhouse_userName';
const LOCAL_STORAGE_AVATAR_KEY = 'shravyaPlayhouse_avatar';
const DEFAULT_AVATAR_SRC = AVATARS[0]?.src || '/images/avatars/modern_girl.png';
const DEFAULT_USER_NAME = "Kiddo";

interface GameStat {
  gameId: string;
  gamesPlayed: number | string;
  wins: number | string;
  highScore: number | string;
}

const getStoredGameCurrency = (key: string): number => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      console.error("Error reading from localStorage", e);
      return 0;
    }
  }
  return 0;
};

const setStoredGameCurrency = (key: string, value: number): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value.toString());
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }
  }
};


export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingUserName, setEditingUserName] = useState<string>(DEFAULT_USER_NAME);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR_SRC);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const [theme, setTheme] = useState<string>('light');
  const [favoriteColor, setFavoriteColor] = useState<string>('default');
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [showLoginWarningDialog, setShowLoginWarningDialog] = useState(false);

  const [sPoints, setSPoints] = useState<number>(0);
  const [sCoins, setSCoins] = useState<number>(0);

  const [isConfigMissing, setIsConfigMissing] = useState(false);


  // Effect for loading all local data on initial mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      setTheme(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    const storedColor = localStorage.getItem('favoriteColor');
    if (storedColor) {
      setFavoriteColor(storedColor);
    }

    const localUserName = localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY);
    setEditingUserName(localUserName || DEFAULT_USER_NAME);

    const localAvatar = localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY);
    setSelectedAvatar(localAvatar || DEFAULT_AVATAR_SRC);
    
    // Load S-Points and S-Coins - this will be updated by auth state if user logs in
    setSPoints(getStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY));
    setSCoins(getStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY));

    const initialStats = GAMES.map(game => ({
        gameId: game.id,
        gamesPlayed: 'N/A',
        wins: 'N/A',
        highScore: 'N/A',
    }));
    setGameStats(initialStats);

  }, []);


  // Effect for Firebase Auth state changes
  useEffect(() => {
    // Config validation first
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!authDomain || !projectId) {
      console.error("CRITICAL: Firebase configuration is missing from environment variables. Login will be disabled. Please set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN and NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
      setIsConfigMissing(true);
      toast({
        variant: "destructive",
        title: "Firebase Config Missing",
        description: "Login is disabled. See console for details.",
        duration: 8000,
      });
      return; // Stop the rest of the effect from running if config is bad
    }

    let isMounted = true; 

    // Log Firebase config being used by the SDK for diagnostics
    if (auth && auth.app && auth.app.options) {
      console.log("DIAGNOSTIC: Firebase Auth Domain (from SDK):", auth.app.options.authDomain);
      console.log("DIAGNOSTIC: Firebase Project ID (from SDK):", auth.app.options.projectId);
    } else {
      console.log("DIAGNOSTIC: Firebase auth object or options not yet available for logging.");
    }

    const handleUserUpdate = (user: User | null, isNewLoginEvent: boolean = false) => {
      if (!isMounted) return;

      setCurrentUser(user); // Set current user first

      if (user) { 
        const firebaseDisplayName = user.displayName || localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || DEFAULT_USER_NAME;
        setEditingUserName(firebaseDisplayName);
        localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, firebaseDisplayName);

        const firebasePhotoURL = user.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC;
        setSelectedAvatar(firebasePhotoURL);
        localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, firebasePhotoURL);

        // Simulate fetching points for logged-in user (actual Firestore would go here)
        setSPoints(100); // Mock S-Points for logged-in user
        setSCoins(10);  // Mock S-Coins for logged-in user
        // TODO: Display a message "Cloud points loaded" or similar

        const onlineStats = GAMES.map(game => ({
            gameId: game.id,
            gamesPlayed: Math.floor(Math.random() * 10),
            wins: Math.floor(Math.random() * 5),
            highScore: Math.floor(Math.random() * 1000),
        }));
        setGameStats(onlineStats);

        if (isNewLoginEvent) {
          toast({ title: "Logged In!", description: `Welcome back, ${user.displayName || 'User'}!` });
        }
      } else { 
        // User is logged out, revert to local storage for points/coins
        setSPoints(getStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY));
        setSCoins(getStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY));
        // Username and avatar remain from localStorage (or defaults if nothing there).
        
        const offlineStats = GAMES.map(game => ({
            gameId: game.id,
            gamesPlayed: 'N/A',
            wins: 'N/A',
            highScore: 'N/A',
        }));
        setGameStats(offlineStats);
      }
    };

    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            // User data handling will be managed by onAuthStateChanged
            // If result is not null, a sign-in just completed.
            if (result && result.user && isMounted) {
                 console.log("DIAGNOSTIC: Google sign-in redirect successful.", result.user.displayName);
            }
        } catch (error: any) {
            if (isMounted) {
                console.error("Error during Google sign-in redirect result processing:", error);
                // Log more details if available
                if (error.code) console.error("Firebase error code:", error.code);
                if (error.message) console.error("Firebase error message:", error.message);
                toast({ variant: "destructive", title: "Login Failed After Redirect", description: error.message || "Could not process sign-in with Google after redirect. Please try again." });
            }
        }
    };

    processRedirect();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
        const isNewLogin = !!user && (!currentUser || currentUser.uid !== user.uid); 
        handleUserUpdate(user, isNewLogin);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [toast]); // currentUser removed from dependency array.


  const handleUserNameChange = (name: string) => {
    setEditingUserName(name);
    localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, name);
  }

  const handleSelectedAvatarChange = (avatarSrc: string) => {
    setSelectedAvatar(avatarSrc);
    localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, avatarSrc);
     if (!currentUser) {
        toast({ title: "Avatar Preview Changed", description: "Log in to save this avatar to your profile." });
    }
  }

  const actualSignInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Error during Google sign-in initiation:", error);
      if (error.code) console.error("Firebase error code (initiation):", error.code);
      if (error.message) console.error("Firebase error message (initiation):", error.message);
      toast({ variant: "destructive", title: "Login Initiation Failed", description: error.message || "Could not start sign in with Google. Please try again." });
    }
  };

  const handleGoogleLoginAttempt = async () => {
    const localDataMayExist = !currentUser; 
    if (localDataMayExist) {
      setShowLoginWarningDialog(true);
    } else {
      await actualSignInWithGoogle();
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null and reloading local S-Points/Coins.
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any)      {
      console.error("Error during sign-out:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not sign out. Please try again." });
    }
  };

  const handleUserNameSave = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to save your username." });
      return;
    }
    if (editingUserName.trim() === "") {
      toast({ variant: "destructive", title: "Invalid Name", description: "Username cannot be empty." });
      return;
    }
    try {
      await updateProfile(currentUser, { displayName: editingUserName });
      localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, editingUserName);
      toast({ title: "Username Updated!", description: `Your display name is now ${editingUserName}.` });
    } catch (error: any) {
      console.error("Error updating username:", error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not update username." });
    }
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select an image smaller than 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarDataUrl = reader.result as string;
        handleSelectedAvatarChange(newAvatarDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to save your avatar." });
      return;
    }
    if (!selectedAvatar) {
        toast({ variant: "destructive", title: "No Avatar Selected", description: "Please select or upload an avatar." });
        return;
    }
    const isDataUrl = selectedAvatar.startsWith('data:image');
    const hasChangedFromProfile = selectedAvatar !== currentUser.photoURL;
    if (!isDataUrl && !hasChangedFromProfile) {
         toast({ title: "No Change", description: "Avatar is already up to date with your profile." });
         return;
    }
    setIsUploading(true);
    try {
      let photoURLToSave = selectedAvatar;
      if (isDataUrl) {
        const avatarPath = `avatars/${currentUser.uid}/profileImage.png`;
        const imageRef = storageRef(storage, avatarPath);
        await uploadString(imageRef, selectedAvatar, 'data_url');
        photoURLToSave = await getDownloadURL(imageRef);
      }
      await updateProfile(currentUser, { photoURL: photoURLToSave });
      localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, photoURLToSave);
      setSelectedAvatar(photoURLToSave);
      toast({ title: "Avatar Saved!", description: "Your new avatar has been saved to your profile." });
    } catch (error: any) {
      console.error("Error saving avatar:", error);
      toast({ variant: "destructive", title: "Avatar Save Failed", description: error.message || "Could not save avatar." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast({ title: "Theme Changed", description: `Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode.` });
  };

  const handleFavoriteColorChange = (newColor: string) => {
    setFavoriteColor(newColor);
    localStorage.setItem('favoriteColor', newColor);
    toast({ title: "Favorite Color Set", description: `Your favorite color is now ${FAVORITE_COLOR_OPTIONS.find(c => c.value === newColor)?.label || newColor}.` });
  };

  const isSaveNameDisabled = !currentUser || isUploading || editingUserName === (currentUser?.displayName);
  const isSaveAvatarDisabled = !currentUser || isUploading || (selectedAvatar === (currentUser?.photoURL) && !selectedAvatar?.startsWith('data:image'));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Information</CardTitle>
          <CardDescription>Manage your login status and username. Changes are saved locally and can be synced to your profile when logged in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="username" className="text-base">Display Name:</Label>
            <Input
              id="username"
              type="text"
              value={editingUserName}
              onChange={(e) => handleUserNameChange(e.target.value)}
              className="max-w-xs text-base"
              aria-label="Edit display name"
              placeholder="Enter your display name"
            />
            <Button onClick={handleUserNameSave} size="sm" variant="outline" disabled={isSaveNameDisabled}>
              <Edit3 className="mr-2 h-4 w-4" /> Save to Profile
            </Button>
          </div>
          {isConfigMissing ? (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm space-y-1">
              <p className="font-bold flex items-center gap-2"><AlertTriangle size={16} /> Firebase Configuration Error</p>
              <p>Google login is disabled because your Firebase configuration is incomplete. Please ensure `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` are set correctly in your environment.</p>
            </div>
          ) : currentUser ? (
            <div className="space-y-3">
              <p className="text-foreground">Logged in as: <span className="font-semibold">{currentUser.email}</span></p>
              <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-5 w-5" /> Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Log in to save your display name, avatar, and game progress to your online profile. Local S-Points/S-Coins will be replaced by online data upon login.</p>
                <Button onClick={handleGoogleLoginAttempt} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15.3 18.09C14.54 18.89 13.56 19.5 12.45 19.83C11.34 20.16 10.17 20.26 9 20.12C5.79 19.43 3.51 16.68 3.12 13.4C3.03 12.51 3.15 11.61 3.48 10.77C3.81 9.93 4.32 9.18 4.98 8.57C6.26 7.36 7.97 6.66 9.78 6.54C11.72 6.42 13.66 6.93 15.24 7.99L16.99 6.28C15.01 4.88 12.73 4.08 10.36 4.01C8.05 3.91 5.81 4.62 3.98 5.99C2.15 7.36 0.810001 9.32 0.200001 11.58C-0.419999 13.84 0.0300012 16.24 1.13 18.25C2.23 20.26 3.92 21.77 5.99 22.56C8.06 23.35 10.36 23.37 12.48 22.62C14.6 21.87 16.44 20.41 17.67 18.51L15.3 18.09Z"/><path d="M22.94 12.14C22.98 11.74 23 11.33 23 10.91C23 10.32 22.92 9.73 22.77 9.16H12V12.83H18.24C18.03 13.71 17.55 14.5 16.86 15.08L16.82 15.11L19.28 16.91L19.45 17.06C21.58 15.22 22.94 12.14 22.94 12.14Z"/><path d="M12 23C14.47 23 16.56 22.19 18.05 20.96L15.24 17.99C14.48 18.59 13.53 18.98 12.52 18.98C10.92 18.98 9.48001 18.13 8.82001 16.76L8.78001 16.72L6.21001 18.58L6.15001 18.7C7.02001 20.39 8.68001 21.83 10.62 22.48C11.09 22.64 11.56 22.77 12 22.81V23Z"/><path d="M12.01 3.00997C13.37 2.94997 14.7 3.43997 15.73 4.40997L17.97 2.21997C16.31 0.799971 14.21 -0.0600291 12.01 0.0099709C7.37001 0.0099709 3.44001 3.36997 2.02001 7.49997L4.98001 8.56997C5.60001 6.33997 7.72001 4.00997 10.22 4.00997C10.86 3.99997 11.49 4.12997 12.01 4.36997V3.00997Z"/></svg>
                Sign In with Google
                </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Your display name, avatar, and app preferences are saved in your browser. Game progress, S-Points, and S-Coins are displayed from your online profile when logged in.
            </p>
        </CardFooter>
      </Card>

      <header className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-primary/10 rounded-lg shadow">
        {selectedAvatar ? (
          <Avatar className="h-24 w-24 border-4 border-accent shadow-md">
            <AvatarImage src={selectedAvatar} alt={`${editingUserName}'s Avatar`} data-ai-hint="avatar character" />
            <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
              {editingUserName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserIcon size={96} className="text-primary" />
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-lg text-muted-foreground">Welcome back, {editingUserName}!</p>
          <div className="mt-3 flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 items-center justify-center sm:justify-start">
            <div className="flex items-center text-foreground">
              <SPointsIcon className="mr-2 h-6 w-6 text-yellow-400" />
              <span className="font-semibold text-lg">{sPoints}</span>
              <span className="ml-1 text-sm text-muted-foreground">S-Points</span>
            </div>
            <div className="flex items-center text-foreground">
              <SCoinsIcon className="mr-2 h-6 w-6 text-amber-500" />
              <span className="font-semibold text-lg">{sCoins}</span>
              <span className="ml-1 text-sm text-muted-foreground">S-Coins</span>
            </div>
          </div>
           {currentUser && (
             <p className="text-xs text-muted-foreground mt-1">(Online points shown. Actual cloud sync coming soon!)</p>
           )}
           {!currentUser && (
             <p className="text-xs text-muted-foreground mt-1">(Locally stored points shown)</p>
           )}
        </div>
      </header>

      <Tabs defaultValue="avatar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary/20">
          <TabsTrigger value="avatar" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <UserCircle className="mr-2 h-5 w-5" /> Avatar
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <BarChart3 className="mr-2 h-5 w-5" /> Progress
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Settings className="mr-2 h-5 w-5" /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avatar">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Choose Your Avatar</CardTitle>
              <CardDescription>Select a predefined avatar or upload your own (max 2MB). Changes are saved locally. Log in and click "Save to Profile" to update your online profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Predefined Avatars</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {AVATARS.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectedAvatarChange(avatar.src)}
                      className={cn(
                        "rounded-full p-1 border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/50 relative",
                        selectedAvatar === avatar.src ? "border-accent ring-2 ring-accent" : "border-transparent hover:border-primary/50",
                        isUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      )}
                      aria-label={`Select ${avatar.alt}`}
                      disabled={isUploading}
                    >
                      <Image
                        src={avatar.src}
                        alt={avatar.alt}
                        width={100}
                        height={100}
                        className="rounded-full aspect-square object-cover"
                        data-ai-hint={avatar.hint}
                      />
                      {selectedAvatar === avatar.src && (
                          <CheckCircle size={24} className="absolute bottom-0 right-0 text-accent bg-background rounded-full p-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Custom Avatar</h3>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleAvatarFileChange}
                  ref={avatarFileInputRef}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                  disabled={isUploading}
                >
                  <UploadCloud className="mr-2 h-5 w-5" /> Upload Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Max file size: 2MB. PNG, JPG, GIF accepted. Avatar is saved locally.</p>
              </div>

              <Button onClick={handleSaveAvatar} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 mt-4" disabled={isSaveAvatarDisabled}>
                {isUploading ? "Saving..." : "Save to Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Trophy size={28} className="text-primary" />
                <CardTitle className="text-2xl">Your Game Journey</CardTitle>
              </div>
              <CardDescription>
                {currentUser ? "Your activity across Shravya Playhouse games." : "Log in to see your game progress and achievements. Placeholder data shown below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {GAMES.map((game) => {
                const stat = gameStats.find(s => s.gameId === game.id);
                const IconComponent = game.Icon || Gamepad2; 
                return (
                  <Card key={game.id} className="p-4 bg-muted/30">
                    <div className="flex items-center mb-3">
                      <IconComponent size={24} className={cn("mr-3", game.color || "text-primary")} />
                      <h3 className="text-lg font-semibold text-foreground">{game.title}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Played:</p>
                        <p className="font-medium">{currentUser && stat ? stat.gamesPlayed : '--'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wins:</p>
                        <p className="font-medium">{currentUser && stat ? stat.wins : '--'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">High Score:</p>
                        <p className="font-medium">{currentUser && stat ? stat.highScore : '--'}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {!currentUser && (
                <div className="text-center py-6">
                    <BarChart3 size={48} className="mx-auto text-primary/30 mb-3" />
                    <p className="text-md text-foreground/90">
                        Log in to track your progress and compete!
                    </p>
                     <p className="text-sm text-muted-foreground mt-1">Your game stats will be saved to your online profile.</p>
                </div>
              )}
               {currentUser && gameStats.length === 0 && (
                 <div className="text-center py-6">
                    <Gamepad2 size={48} className="mx-auto text-primary/30 mb-3" />
                    <p className="text-md text-foreground/90">No game activity yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Play some games to see your stats here!</p>
                </div>
               )}
               {currentUser && gameStats.length > 0 && (
                 <p className="text-xs text-muted-foreground text-center pt-4">
                    (Note: Current stats are illustrative. Real-time detailed tracking coming soon!)
                 </p>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your Shravya Playhouse experience. These settings are saved locally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-3">
                <Label className="text-lg font-medium flex items-center">
                  <Palette className="mr-2 h-5 w-5 text-primary" /> App Theme
                </Label>
                <RadioGroup
                  value={theme}
                  onValueChange={handleThemeChange}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {THEME_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`theme-${option.value}`}
                      className={cn(
                        "flex items-center space-x-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        theme === option.value && "border-primary ring-2 ring-primary"
                      )}
                    >
                      <RadioGroupItem value={option.value} id={`theme-${option.value}`} className="sr-only peer" />
                      <option.Icon className="h-6 w-6 text-muted-foreground peer-checked:text-primary" />
                      <span className="font-medium peer-checked:text-primary">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="favoriteColor" className="text-lg font-medium flex items-center">
                  <Palette className="mr-2 h-5 w-5 text-primary" /> Favorite Color
                </Label>
                <Select value={favoriteColor} onValueChange={handleFavoriteColorChange}>
                  <SelectTrigger id="favoriteColor" className="w-full sm:w-[280px] text-base">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAVORITE_COLOR_OPTIONS.map((colorOption) => (
                      <SelectItem key={colorOption.value} value={colorOption.value} className="text-base">
                        <div className="flex items-center">
                          {colorOption.value !== 'default' && (
                            <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: colorOption.value === 'sky' ? '#87CEEB' : colorOption.value }}></span>
                          )}
                          {colorOption.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This color preference is saved locally. It might be used for UI highlights in the future.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showLoginWarningDialog} onOpenChange={setShowLoginWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Logging in will sync your profile with our servers. Your online S-Points and S-Coins (currently mock data) will be shown, replacing any locally stored values for this session. Any unsaved local changes to your name or avatar preview might be overwritten by your online profile data. Continue to login?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Offline</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowLoginWarningDialog(false); 
              await actualSignInWithGoogle();
            }}>Continue to Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
    

    
