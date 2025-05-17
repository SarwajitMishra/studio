
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATARS } from "@/lib/constants";
import { UserCircle, BarChart3, Settings, CheckCircle, LogIn, LogOut, UploadCloud, Edit3, User as UserIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  auth, 
  storage, 
  googleProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  type User 
} from '@/lib/firebase';
import { ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingUserName, setEditingUserName] = useState<string>("Kiddo");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setEditingUserName(user.displayName || "Kiddo");
        setSelectedAvatar(user.photoURL || AVATARS[0]?.src || 'https://placehold.co/100x100.png');
      } else {
        setCurrentUser(null);
        setEditingUserName("Kiddo");
        setSelectedAvatar(AVATARS[0]?.src || 'https://placehold.co/100x100.png');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // State will be updated by onAuthStateChanged listener
      toast({ title: "Logged In!", description: `Welcome back, ${user.displayName || 'User'}!` });
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Could not sign in with Google. Please try again." });
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      // State will be updated by onAuthStateChanged listener
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
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
      setCurrentUser(auth.currentUser); // Refresh current user data
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
        setSelectedAvatar(reader.result as string);
        toast({ title: "Avatar Preview Updated", description: "Click 'Save Avatar' to apply." });
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
      toast({ variant: "destructive", title: "No Avatar", description: "No avatar selected to save." });
      return;
    }

    setIsUploading(true);
    try {
      let photoURLToSave = selectedAvatar;

      if (selectedAvatar.startsWith('data:image')) { // New custom avatar uploaded
        const avatarPath = `avatars/${currentUser.uid}/profileImage.png`;
        const imageRef = storageRef(storage, avatarPath);
        
        // If there's an old custom avatar, delete it first (optional, good practice)
        // This assumes previous custom avatar was stored at the same path.
        // For simplicity, we're not tracking the old path if it was a predefined one.
        // try {
        //   const currentPhotoURL = currentUser.photoURL;
        //   if (currentPhotoURL && currentPhotoURL.includes(currentUser.uid)) { // Heuristic to check if it's a custom one
        //      const oldImageRef = storageRef(storage, currentPhotoURL); // This needs exact path or URL parsing
        //      await deleteObject(oldImageRef);
        //   }
        // } catch (deleteError) {
        //   console.warn("Could not delete old avatar, or no old custom avatar:", deleteError);
        // }

        await uploadString(imageRef, selectedAvatar, 'data_url');
        photoURLToSave = await getDownloadURL(imageRef);
      }
      
      await updateProfile(currentUser, { photoURL: photoURLToSave });
      setCurrentUser(auth.currentUser); // Refresh current user data
      setSelectedAvatar(photoURLToSave); // Ensure local preview matches saved URL
      toast({ title: "Avatar Saved!", description: "Your new avatar has been saved." });

    } catch (error: any) {
      console.error("Error saving avatar:", error);
      toast({ variant: "destructive", title: "Avatar Save Failed", description: error.message || "Could not save avatar." });
    } finally {
      setIsUploading(false);
    }
  };
  
  const userNameDisplay = currentUser?.displayName || editingUserName || "Kiddo";
  const avatarDisplayUrl = selectedAvatar || currentUser?.photoURL || AVATARS[0]?.src || 'https://placehold.co/100x100.png';


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Information</CardTitle>
          <CardDescription>Manage your login status and username.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser ? (
            <div className="space-y-3">
              <p className="text-foreground">Logged in as: <span className="font-semibold">{currentUser.email}</span></p>
              <div className="flex items-center gap-3">
                <Label htmlFor="username" className="text-base">Display Name:</Label>
                <Input
                  id="username"
                  type="text"
                  value={editingUserName}
                  onChange={(e) => setEditingUserName(e.target.value)}
                  className="max-w-xs text-base"
                  aria-label="Edit display name"
                />
                <Button onClick={handleUserNameSave} size="sm" variant="outline">
                  <Edit3 className="mr-2 h-4 w-4" /> Save Name
                </Button>
              </div>
              <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-5 w-5" /> Logout
              </Button>
            </div>
          ) : (
            <Button onClick={handleGoogleLogin} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15.3 18.09C14.54 18.89 13.56 19.5 12.45 19.83C11.34 20.16 10.17 20.26 9 20.12C5.79 19.43 3.51 16.68 3.12 13.4C3.03 12.51 3.15 11.61 3.48 10.77C3.81 9.93 4.32 9.18 4.98 8.57C6.26 7.36 7.97 6.66 9.78 6.54C11.72 6.42 13.66 6.93 15.24 7.99L16.99 6.28C15.01 4.88 12.73 4.08 10.36 4.01C8.05 3.91 5.81 4.62 3.98 5.99C2.15 7.36 0.810001 9.32 0.200001 11.58C-0.419999 13.84 0.0300012 16.24 1.13 18.25C2.23 20.26 3.92 21.77 5.99 22.56C8.06 23.35 10.36 23.37 12.48 22.62C14.6 21.87 16.44 20.41 17.67 18.51L15.3 18.09Z"/><path d="M22.94 12.14C22.98 11.74 23 11.33 23 10.91C23 10.32 22.92 9.73 22.77 9.16H12V12.83H18.24C18.03 13.71 17.55 14.5 16.86 15.08L16.82 15.11L19.28 16.91L19.45 17.06C21.58 15.22 22.94 12.14 22.94 12.14Z"/><path d="M12 23C14.47 23 16.56 22.19 18.05 20.96L15.24 17.99C14.48 18.59 13.53 18.98 12.52 18.98C10.92 18.98 9.48001 18.13 8.82001 16.76L8.78001 16.72L6.21001 18.58L6.15001 18.7C7.02001 20.39 8.68001 21.83 10.62 22.48C11.09 22.64 11.56 22.77 12 22.81V23Z"/><path d="M12.01 3.00997C13.37 2.94997 14.7 3.43997 15.73 4.40997L17.97 2.21997C16.31 0.799971 14.21 -0.0600291 12.01 0.0099709C7.37001 0.0099709 3.44001 3.36997 2.02001 7.49997L4.98001 8.56997C5.60001 6.33997 7.72001 4.00997 10.22 4.00997C10.86 3.99997 11.49 4.12997 12.01 4.36997V3.00997Z"/></svg>
              Sign In with Google
            </Button>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                User login is managed by Firebase. Avatars and display names are saved to your Firebase profile.
            </p>
        </CardFooter>
      </Card>

      <header className="flex items-center space-x-4 p-6 bg-primary/10 rounded-lg shadow">
        {avatarDisplayUrl ? (
          <Avatar className="h-24 w-24 border-4 border-accent shadow-md">
            <AvatarImage src={avatarDisplayUrl} alt={`${userNameDisplay}'s Avatar`} data-ai-hint="avatar character" />
            <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
              {userNameDisplay.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserIcon size={96} className="text-primary" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-lg text-muted-foreground">Welcome back, {userNameDisplay}!</p>
        </div>
      </header>

      <Tabs defaultValue="avatar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary/20">
          <TabsTrigger value="avatar" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <UserCircle className="mr-2 h-5 w-5" /> Avatar
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" disabled={!currentUser}>
            <BarChart3 className="mr-2 h-5 w-5" /> Progress
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground" disabled={!currentUser}>
            <Settings className="mr-2 h-5 w-5" /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avatar">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Choose Your Avatar</CardTitle>
              <CardDescription>Select a predefined avatar or upload your own (max 2MB).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Predefined Avatars</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {AVATARS.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAvatar(avatar.src)}
                      className={cn(
                        "rounded-full p-1 border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/50 relative",
                        selectedAvatar === avatar.src ? "border-accent ring-2 ring-accent" : "border-transparent hover:border-primary/50"
                      )}
                      aria-label={`Select ${avatar.alt}`}
                      disabled={!currentUser || isUploading}
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
                  disabled={!currentUser || isUploading}
                />
                <Button 
                  variant="outline" 
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                  disabled={!currentUser || isUploading}
                >
                  <UploadCloud className="mr-2 h-5 w-5" /> Upload Image
                </Button>
                {!currentUser && <p className="text-xs text-muted-foreground mt-1">Login to upload a custom avatar.</p>}
                <p className="text-xs text-muted-foreground mt-2">Max file size: 2MB. PNG, JPG, GIF accepted.</p>
              </div>
              
              <Button onClick={handleSaveAvatar} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 mt-4" disabled={!currentUser || isUploading}>
                {isUploading ? "Saving..." : "Save Avatar"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>See how much you've learned and played!</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <BarChart3 size={64} className="mx-auto text-primary/50 mb-4" />
              <p className="text-lg text-muted-foreground">Game progress tracking is coming soon!</p>
              <p className="text-sm text-muted-foreground">Check back later to see your achievements.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your Shravya Playhouse experience.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Settings size={64} className="mx-auto text-primary/50 mb-4" />
              <p className="text-lg text-muted-foreground">Preference settings are under development.</p>
              <p className="text-sm text-muted-foreground">Soon you'll be able to adjust sound, themes, and more!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
