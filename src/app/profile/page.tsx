
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
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AVATARS, GAMES, type GameCategory } from "@/lib/constants";
import { UserCircle, BarChart3, Settings, CheckCircle, LogIn, LogOut, UploadCloud, Edit3, User as UserIcon, Palette, Sun, Moon, Brain, ToyBrick, BookOpen, Trophy } from 'lucide-react';
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
import type { LucideIcon } from 'lucide-react';
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
const LOCAL_STORAGE_PROGRESS_DATA_KEY = 'shravyaPlayhouse_progressData';
const DEFAULT_AVATAR_SRC = AVATARS[0]?.src || '/images/avatars/modern_girl.png';
const DEFAULT_USER_NAME = "Kiddo";

const categoryIconsMap: Record<GameCategory, LucideIcon> = {
  'Strategy': Brain,
  'Puzzles': ToyBrick,
  'Learning': BookOpen,
};

interface ProgressDataItem {
  name: GameCategory;
  value: number;
  iconKey: GameCategory; // Store a key instead of the component itself
}

const getProgressData = (): ProgressDataItem[] => {
  const categories: GameCategory[] = ['Strategy', 'Puzzles', 'Learning'];
  const progressValues: Record<GameCategory, number> = {
    'Strategy': 0,
    'Puzzles': 0,
    'Learning': 0,
  };

  const gamesByCategory = GAMES.reduce((acc, game) => {
    if (!acc[game.category]) acc[game.category] = [];
    acc[game.category].push(game.id);
    return acc;
  }, {} as Record<GameCategory, string[]>);

  if (gamesByCategory['Strategy']?.length) progressValues['Strategy'] = Math.floor(Math.random() * 50) + 20;
  if (gamesByCategory['Puzzles']?.length) progressValues['Puzzles'] = Math.floor(Math.random() * 60) + 30;
  if (gamesByCategory['Learning']?.length) progressValues['Learning'] = Math.floor(Math.random() * 40) + 10;

  return categories.map(category => ({
    name: category,
    value: progressValues[category],
    iconKey: category, // Use category name as the key to lookup the icon later
  }));
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
  const [progressData, setProgressData] = useState<ProgressDataItem[]>([]);
  const [showLoginWarningDialog, setShowLoginWarningDialog] = useState(false);


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

    const storedProgress = localStorage.getItem(LOCAL_STORAGE_PROGRESS_DATA_KEY);
    if (storedProgress) {
      try {
        const parsedProgress = JSON.parse(storedProgress) as ProgressDataItem[];
        if (Array.isArray(parsedProgress) && parsedProgress.length > 0 && parsedProgress[0]?.name && parsedProgress[0]?.iconKey) {
            setProgressData(parsedProgress);
        } else {
            throw new Error("Invalid stored progress format");
        }
      } catch (e) {
        console.error("Failed to parse local progress data, generating new:", e);
        const newProgress = getProgressData();
        setProgressData(newProgress);
        localStorage.setItem(LOCAL_STORAGE_PROGRESS_DATA_KEY, JSON.stringify(newProgress));
      }
    } else {
      const newProgress = getProgressData();
      setProgressData(newProgress);
      localStorage.setItem(LOCAL_STORAGE_PROGRESS_DATA_KEY, JSON.stringify(newProgress));
    }
  }, []);


  // Effect for Firebase Auth state changes
  useEffect(() => {
    let isMounted = true; // To prevent state updates on unmounted component

    const handleUserUpdate = (user: User | null, isNewLoginEvent: boolean = false) => {
      if (!isMounted) return;

      if (user) { // User is LOGGED IN
        setCurrentUser(user);
        const firebaseDisplayName = user.displayName || localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || DEFAULT_USER_NAME;
        setEditingUserName(firebaseDisplayName);
        localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, firebaseDisplayName);

        const firebasePhotoURL = user.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC;
        setSelectedAvatar(firebasePhotoURL);
        localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, firebasePhotoURL);

        const onlineProgress = getProgressData(); // Simulate fetching/generating "online" progress
        setProgressData(onlineProgress);
        localStorage.setItem(LOCAL_STORAGE_PROGRESS_DATA_KEY, JSON.stringify(onlineProgress));

        if (isNewLoginEvent) {
          toast({ title: "Logged In!", description: `Welcome back, ${user.displayName || 'User'}!` });
        }
      } else { // User is LOGGED OUT
        setCurrentUser(null);
        // Username and avatar remain as per localStorage (loaded in initial useEffect)
        // Reload progress from localStorage to reflect local/offline state
        const storedProgress = localStorage.getItem(LOCAL_STORAGE_PROGRESS_DATA_KEY);
        if (storedProgress) {
          try {
            const parsedProgress = JSON.parse(storedProgress) as ProgressDataItem[];
             if (Array.isArray(parsedProgress) && parsedProgress.length > 0 && parsedProgress[0]?.name && parsedProgress[0]?.iconKey) {
                setProgressData(parsedProgress);
            } else { throw new Error("Invalid stored progress format on logout"); }
          } catch (e) {
            console.error("Failed to parse local progress on logout, generating new:", e);
            const newProgress = getProgressData();
            setProgressData(newProgress);
            localStorage.setItem(LOCAL_STORAGE_PROGRESS_DATA_KEY, JSON.stringify(newProgress));
          }
        } else {
          const newProgress = getProgressData();
          setProgressData(newProgress);
          localStorage.setItem(LOCAL_STORAGE_PROGRESS_DATA_KEY, JSON.stringify(newProgress));
        }
      }
    };

    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user && isMounted) {
                // Data will be handled by onAuthStateChanged.
                // We can pre-populate here if needed for quicker UI update, but onAuthStateChanged is the source of truth.
                const user = result.user;
                const firebaseDisplayName = user.displayName || localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || DEFAULT_USER_NAME;
                setEditingUserName(firebaseDisplayName);

                const firebasePhotoURL = user.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC;
                setSelectedAvatar(firebasePhotoURL);
            }
        } catch (error: any) {
            if (isMounted) {
                console.error("Error during Google sign-in redirect result:", error);
                toast({ variant: "destructive", title: "Login Failed", description: error.message || "Could not sign in with Google. Please try again." });
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
  }, [toast, currentUser]);


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
      console.error("Error during Google sign-in:", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Could not sign in with Google. Please try again." });
    }
  };

  const handleGoogleLoginAttempt = async () => {
    const localProgressIsPresent = !!localStorage.getItem(LOCAL_STORAGE_PROGRESS_DATA_KEY);
    if (!currentUser && localProgressIsPresent) {
      setShowLoginWarningDialog(true);
    } else {
      await actualSignInWithGoogle();
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
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
    if (!isDataUrl && selectedAvatar === (currentUser.photoURL || localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY))) {
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

          {currentUser ? (
            <div className="space-y-3">
              <p className="text-foreground">Logged in as: <span className="font-semibold">{currentUser.email}</span></p>
              <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-5 w-5" /> Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Log in to save your display name, avatar, and progress to your online profile. Local progress will be overwritten upon login.</p>
                <Button onClick={handleGoogleLoginAttempt} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15.3 18.09C14.54 18.89 13.56 19.5 12.45 19.83C11.34 20.16 10.17 20.26 9 20.12C5.79 19.43 3.51 16.68 3.12 13.4C3.03 12.51 3.15 11.61 3.48 10.77C3.81 9.93 4.32 9.18 4.98 8.57C6.26 7.36 7.97 6.66 9.78 6.54C11.72 6.42 13.66 6.93 15.24 7.99L16.99 6.28C15.01 4.88 12.73 4.08 10.36 4.01C8.05 3.91 5.81 4.62 3.98 5.99C2.15 7.36 0.810001 9.32 0.200001 11.58C-0.419999 13.84 0.0300012 16.24 1.13 18.25C2.23 20.26 3.92 21.77 5.99 22.56C8.06 23.35 10.36 23.37 12.48 22.62C14.6 21.87 16.44 20.41 17.67 18.51L15.3 18.09Z"/><path d="M22.94 12.14C22.98 11.74 23 11.33 23 10.91C23 10.32 22.92 9.73 22.77 9.16H12V12.83H18.24C18.03 13.71 17.55 14.5 16.86 15.08L16.82 15.11L19.28 16.91L19.45 17.06C21.58 15.22 22.94 12.14 22.94 12.14Z"/><path d="M12 23C14.47 23 16.56 22.19 18.05 20.96L15.24 17.99C14.48 18.59 13.53 18.98 12.52 18.98C10.92 18.98 9.48001 18.13 8.82001 16.76L8.78001 16.72L6.21001 18.58L6.15001 18.7C7.02001 20.39 8.68001 21.83 10.62 22.48C11.09 22.64 11.56 22.77 12 22.81V23Z"/><path d="M12.01 3.00997C13.37 2.94997 14.7 3.43997 15.73 4.40997L17.97 2.21997C16.31 0.799971 14.21 -0.0600291 12.01 0.0099709C7.37001 0.0099709 3.44001 3.36997 2.02001 7.49997L4.98001 8.56997C5.60001 6.33997 7.72001 4.00997 10.22 4.00997C10.86 3.99997 11.49 4.12997 12.01 4.36997V3.00997Z"/></svg>
                Sign In with Google
                </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Your display name, avatar, and game progress are saved in your browser. Log in to sync them with your Shravya Playhouse online profile.
            </p>
        </CardFooter>
      </Card>

      <header className="flex items-center space-x-4 p-6 bg-primary/10 rounded-lg shadow">
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-lg text-muted-foreground">Welcome back, {editingUserName}!</p>
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
                {currentUser ? "A quick look at your activity." : "Your local activity. Log in to sync with your online profile."} (Mock Data)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {progressData.map((categoryProgress) => {
                const IconComponent = categoryIconsMap[categoryProgress.iconKey];
                return (
                  <div key={categoryProgress.name}>
                    <div className="flex justify-between items-center mb-1">
                      <Label htmlFor={`progress-${categoryProgress.name.toLowerCase()}`} className="text-base font-medium flex items-center">
                        {IconComponent && <IconComponent className="mr-2 h-5 w-5 text-muted-foreground" />}
                        {categoryProgress.name}
                      </Label>
                      <span className="text-sm font-semibold text-primary">{categoryProgress.value}%</span>
                    </div>
                    <Progress id={`progress-${categoryProgress.name.toLowerCase()}`} value={categoryProgress.value} className="w-full h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current activity level in {categoryProgress.name.toLowerCase()} games.
                    </p>
                  </div>
                );
              })}
              <div className="text-center pt-4">
                <BarChart3 size={48} className="mx-auto text-primary/30 mb-3" />
                <p className="text-md text-foreground/90">
                  Detailed stats for each game and achievements are on their way!
                </p>
                <p className="text-sm text-muted-foreground mt-1">Keep playing to see your progress grow.</p>
              </div>
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
            <AlertDialogTitle>Overwrite Local Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              Logging in will replace your current local game progress with your online profile's data.
              Any progress made while offline may be lost if not previously synced. Continue to login?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay Offline</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowLoginWarningDialog(false); // Close dialog first
              await actualSignInWithGoogle();
            }}>Continue to Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    