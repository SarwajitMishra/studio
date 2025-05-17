"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/constants";
import { UserCircle, BarChart3, Settings, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

// Cannot use Metadata directly in client components.
// export const metadata: Metadata = {
// title: 'My Profile',
// };
// Title can be set in a parent server component or layout if needed dynamically.


export default function ProfilePage() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Kiddo"); // Default or fetched user name

  // useEffect to avoid hydration errors for client-side state like selectedAvatar
  useEffect(() => {
    // Potentially load saved avatar preference here
    if (AVATARS.length > 0) {
      setSelectedAvatar(AVATARS[0].src);
    }
  }, []);


  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
              <CardDescription>Select an avatar that represents you!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {AVATARS.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAvatar(avatar.src)}
                    className={cn(
                      "rounded-full p-1 border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent/50",
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
              <Button className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">Save Avatar</Button>
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
