
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
import { UserCircle, BarChart3, Settings, CheckCircle, LogIn, LogOut, UploadCloud, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

// Title can be set in a parent server component or layout if needed dynamically.

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("Kiddo");
  const [editingUserName, setEditingUserName] = useState<string>("Kiddo");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Potentially load saved avatar preference here
    if (AVATARS.length > 0 && !selectedAvatar) {
      setSelectedAvatar(AVATARS[0].src);
    }
  }, [selectedAvatar]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    const mockUserName = "PlayfulPanda";
    setUserName(mockUserName);
    setEditingUserName(mockUserName);
    toast({ title: "Logged In!", description: `Welcome back, ${mockUserName}!` });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    const defaultUserName = "Kiddo";
    setUserName(defaultUserName);
    setEditingUserName(defaultUserName);
    if (AVATARS.length > 0) {
      setSelectedAvatar(AVATARS[0].src); // Reset to default avatar
    }
    toast({ title: "Logged Out", description: "You have been logged out." });
  };

  const handleUserNameSave = () => {
    setUserName(editingUserName);
    toast({ title: "Username Updated", description: `Your username is now ${editingUserName}.` });
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

  const handleSaveAvatar = () => {
    // In a real app, this would send selectedAvatar (which could be a data URL or a preset URL)
    // to a backend to save the preference, or upload the file if it's a data URL.
    toast({
      title: "Avatar Saved!",
      description: "Your new avatar has been set (simulated).",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Information</CardTitle>
          <CardDescription>Manage your login status and username.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoggedIn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label htmlFor="username" className="text-base">Username:</Label>
                <Input
                  id="username"
                  type="text"
                  value={editingUserName}
                  onChange={(e) => setEditingUserName(e.target.value)}
                  className="max-w-xs text-base"
                  aria-label="Edit username"
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
            <Button onClick={handleLogin} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <LogIn className="mr-2 h-5 w-5" /> Login (Simulated)
            </Button>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Note: Login and avatar uploads are simulated for demonstration and do not persist data.
            </p>
        </CardFooter>
      </Card>

      <header className="flex items-center space-x-4 p-6 bg-primary/10 rounded-lg shadow">
        {selectedAvatar ? (
          <Avatar className="h-24 w-24 border-4 border-accent shadow-md">
            <AvatarImage src={selectedAvatar} alt={`${userName}'s Avatar`} data-ai-hint="avatar character" />
            <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserCircle size={96} className="text-primary" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-lg text-muted-foreground">Welcome back, {userName}!</p>
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
              <CardDescription>Select a predefined avatar or upload your own.</CardDescription>
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
                />
                <Button 
                  variant="outline" 
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="w-full sm:w-auto"
                >
                  <UploadCloud className="mr-2 h-5 w-5" /> Upload Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Max file size: 2MB. PNG, JPG, GIF accepted.</p>
              </div>
              
              <Button onClick={handleSaveAvatar} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 mt-4">
                Save Avatar
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

    