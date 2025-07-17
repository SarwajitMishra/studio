
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { 
  AVATARS, 
  GAMES, 
  type Game,
  MATH_PUZZLE_TYPES,
  ENGLISH_PUZZLE_TYPES,
  S_POINTS_ICON as SPointsIcon, 
  S_COINS_ICON as SCoinsIcon,
  LOCAL_STORAGE_S_POINTS_KEY,
  LOCAL_STORAGE_S_COINS_KEY,
  BADGES,
  type Badge,
} from '@/lib/constants';
import { UserCircle, BarChart3, Settings, CheckCircle, LogIn, LogOut, UploadCloud, Edit3, User as UserIcon, Palette, Sun, Moon, Trophy, Gamepad2, Star, Coins, AlertTriangle, Loader2, History, Bookmark, Lock, BookOpen, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  auth,
  storage,
  onAuthStateChanged,
  updateProfile,
  type User
} from '@/lib/firebase';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { getGameStats, type GameStat, checkAndTriggerAchievements } from '@/lib/progress';
import { getRewardHistory, type RewardEvent } from '@/lib/rewards';
import { addNotification } from '@/lib/notifications';
import { getUserProfile, type UserProfile } from '@/lib/users';

const LOCAL_STORAGE_USER_NAME_KEY = 'shravyaPlaylab_userName';
const LOCAL_STORAGE_AVATAR_KEY = 'shravyaPlaylab_avatar';
const DEFAULT_AVATAR_SRC = '/images/avatars/modern_girl.png';
const DEFAULT_USER_NAME = "Kiddo";

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

// Create a map of all game definitions for easy lookup
const allGameDefs = [
  ...GAMES,
  ...MATH_PUZZLE_TYPES,
  ...ENGLISH_PUZZLE_TYPES,
];
const gameDefsMap = new Map(allGameDefs.map(g => [g.id, g]));

const GameStatRow = ({ stat, game }: { stat: GameStat, game: any }) => (
    <div key={stat.gameId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-3">
            <game.Icon size={24} className={cn("text-primary", game.color)} />
            <div>
                <p className="font-semibold text-foreground">{game.title || game.name}</p>
                <p className="text-xs text-muted-foreground">{stat.gamesPlayed} {stat.gamesPlayed === 1 ? 'play' : 'plays'}</p>
            </div>
        </div>
        <div className="flex flex-col items-end text-sm">
            <span className="font-semibold flex items-center">{stat.wins} {stat.wins === 1 ? 'win' : 'wins'}</span>
            <span className="text-xs text-muted-foreground">High Score: {stat.highScore}</span>
        </div>
    </div>
);


export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [editingUserName, setEditingUserName] = useState<string>(DEFAULT_USER_NAME);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR_SRC);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [sPoints, setSPoints] = useState<number>(0);
  const [sCoins, setSCoins] = useState<number>(0);
  const [rewardHistory, setRewardHistory] = useState<RewardEvent[]>([]);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);

  const [isConfigMissing, setIsConfigMissing] = useState(false);
  
  const updateLocalData = useCallback(() => {
    const points = getStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY);
    const stats = getGameStats();
    setSPoints(points);
    setSCoins(getStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY));
    setRewardHistory(getRewardHistory());
    setGameStats(stats);
    checkAndTriggerAchievements(points, stats);
  }, []);

  const unlockedBadges = useMemo(() => {
    return BADGES.filter(badge => {
        const stats = getGameStats();
        const points = getStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY);
        switch (badge.id) {
            case 'beginner-explorer': return points >= 100;
            case 'star-starter': return stats.some(stat => stat.wins > 0);
            case 'puzzle-master':
                const puzzleGames = new Set(GAMES.filter(g => g.category === 'Puzzles').map(g => g.id));
                return stats.filter(stat => puzzleGames.has(stat.gameId) && stat.wins > 0).length >= 3;
            case 'typing-titan': return (stats.find(stat => stat.gameId === 'typingRush')?.highScore || 0) >= 150;
            case 'strategy-sovereign': return (stats.find(stat => stat.gameId === 'chess')?.wins || 0) >= 5;
            default: return false;
        }
    });
  }, [sPoints, gameStats]); // Rerun when local state updates

  const primaryBadge = unlockedBadges.length > 0 ? unlockedBadges[unlockedBadges.length - 1] : null;

  // -- Achievement Stats Calculation --
  const totalGamesPlayed = useMemo(() => gameStats.reduce((acc, stat) => acc + stat.gamesPlayed, 0), [gameStats]);
  const totalWins = useMemo(() => gameStats.reduce((acc, stat) => acc + stat.wins, 0), [gameStats]);
  const highestScoreInfo = useMemo(() => {
    if (gameStats.length === 0 || !gameStats.some(s => s.highScore > 0)) {
        return { score: 0, gameName: 'N/A' };
    }
    const statWithHighestScore = gameStats.reduce((max, stat) => stat.highScore > max.highScore ? stat : max, { highScore: 0 } as GameStat);
    const gameDef = gameDefsMap.get(statWithHighestScore.gameId);
    return {
        score: statWithHighestScore.highScore,
        gameName: gameDef?.title || gameDef?.name || 'a game'
    };
  }, [gameStats]);

  useEffect(() => {
    window.addEventListener('storageUpdated', updateLocalData);
    return () => {
      window.removeEventListener('storageUpdated', updateLocalData);
    };
  }, [updateLocalData]);


  useEffect(() => {
    updateLocalData();
  }, [updateLocalData]);

  useEffect(() => {
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!authDomain || !projectId) {
      setIsConfigMissing(true);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        
        if (user) {
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);

            const displayName = profile?.displayName ?? user.displayName ?? localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) ?? DEFAULT_USER_NAME;
            setEditingUserName(displayName);
            localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, displayName);

            const photoURL = user.photoURL ?? localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) ?? DEFAULT_AVATAR_SRC;
            setSelectedAvatar(photoURL);
            localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, photoURL);
            
            updateLocalData();
            
        } else { 
            setUserProfile(null);
            setEditingUserName(localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || DEFAULT_USER_NAME);
            setSelectedAvatar(localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            updateLocalData();
        }
        setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [toast, updateLocalData]);

  const handleAutoSaveAvatar = useCallback(async (avatarToSave: string) => {
      if (!currentUser) return;

      const isDataUrl = avatarToSave.startsWith('data:image');
      
      setIsUploading(true);
      try {
        let photoURLToSave = avatarToSave;
        if (isDataUrl) {
          const avatarPath = `avatars/${currentUser.uid}/profileImage.png`;
          const imageRef = storageRef(storage, avatarPath);
          await uploadString(imageRef, avatarToSave, 'data_url');
          photoURLToSave = await getDownloadURL(imageRef);
        }
        await updateProfile(currentUser, { photoURL: photoURLToSave });
        localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, photoURLToSave);
        setSelectedAvatar(photoURLToSave);
        addNotification("You updated your avatar!", "profile-avatar", "/profile");
        toast({ title: "Avatar Auto-Saved!", description: "Your new avatar has been saved to your profile." });
      } catch (error: any) {
        console.error("Error auto-saving avatar:", error);
        let description = "Could not save avatar. Please try again.";
        if (error.message && (error.message.toLowerCase().includes('cors') || error.message.toLowerCase().includes('network')) ) {
            description = "A server configuration error (CORS) is preventing the upload. See the browser console for details and ensure your Firebase Storage is correctly configured to allow requests from this domain.";
        }
        toast({ variant: "destructive", title: "Avatar Upload Failed", description, duration: 8000 });
      } finally {
        setIsUploading(false);
      }
    }, [currentUser, toast]);

    const handleSelectedAvatarChange = (avatarSrc: string) => {
      setSelectedAvatar(avatarSrc);
      localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, avatarSrc);
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      if (currentUser) {
        handleAutoSaveAvatar(avatarSrc);
      } else {
        toast({ title: "Avatar Preview Changed", description: "Log in to save this avatar to your profile." });
      }
    };

    useEffect(() => {
      if (!currentUser || !userProfile || editingUserName === (userProfile.displayName ?? DEFAULT_USER_NAME)) {
        return;
      }
  
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
  
      debounceTimeoutRef.current = setTimeout(async () => {
        if (editingUserName.trim() === "") {
          toast({ variant: "destructive", title: "Invalid Name", description: "Username cannot be empty." });
          return;
        }
        try {
          await updateProfile(currentUser, { displayName: editingUserName });
          localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, editingUserName);
          window.dispatchEvent(new CustomEvent('profileUpdated'));
          addNotification("You changed your display name!", "profile-name", "/profile");
          toast({ title: "Username Auto-Saved!", description: `Your display name is now ${editingUserName}.` });
        } catch (error: any) {
          console.error("Error auto-saving username:", error);
          toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not update username." });
        }
      }, 1500);
  
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, [editingUserName, currentUser, userProfile, toast]);

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

  const playedGameStats = gameStats.filter(s => s.gamesPlayed > 0);
  const strategyStats = playedGameStats.filter(s => gameDefsMap.get(s.gameId)?.category === 'Strategy');
  const puzzleStats = playedGameStats.filter(s => gameDefsMap.get(s.gameId)?.category === 'Puzzles');
  const numberPuzzleIds = new Set(MATH_PUZZLE_TYPES.map(p => p.id));
  const numberPuzzleStats = playedGameStats.filter(s => numberPuzzleIds.has(s.gameId));
  const englishPuzzleIds = new Set(ENGLISH_PUZZLE_TYPES.map(p => p.id));
  const englishPuzzleStats = playedGameStats.filter(s => englishPuzzleIds.has(s.gameId));
  
  const isGuest = authChecked && !currentUser;

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       {isGuest && (
        <Card className="shadow-lg bg-accent/20 border-accent/50 text-center">
            <CardHeader>
                <CardTitle>You're Playing as a Guest!</CardTitle>
                <CardDescription className="text-foreground/80">Your progress is saved on this device only.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Create a free account to save your progress, achievements, and rewards permanently!</p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
                <Button asChild>
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="secondary">
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </CardFooter>
        </Card>
      )}
      
      {currentUser && (
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle className="text-2xl font-bold">Account Information</CardTitle>
            <CardDescription>Manage your display name. Changes are auto-saved to your online profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
                <Label htmlFor="username" className="text-base">Display Name:</Label>
                <Input
                id="username"
                type="text"
                value={editingUserName}
                onChange={(e) => setEditingUserName(e.target.value)}
                className="max-w-xs text-base"
                aria-label="Edit display name"
                placeholder="Enter your display name"
                />
            </div>
            <div className="space-y-3">
                <p className="text-foreground">Logged in as: <span className="font-semibold">{userProfile?.username ? `@${userProfile.username}` : (userProfile?.email || 'Loading...')}</span></p>
            </div>
            </CardContent>
        </Card>
      )}

      <header className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-primary/10 rounded-lg shadow">
        {isUploading ? (
          <div className="h-24 w-24 rounded-full border-4 border-accent shadow-md flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Avatar className="h-24 w-24 border-4 border-accent shadow-md">
            <AvatarImage src={selectedAvatar} alt={`${editingUserName}'s Avatar`} data-ai-hint="avatar character" />
            <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
              {editingUserName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="text-center sm:text-left flex-grow">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-lg text-muted-foreground">Welcome back, {editingUserName}!</p>
           {primaryBadge && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-1 flex items-center justify-center sm:justify-start gap-2 cursor-pointer">
                    <span className={cn("font-extrabold", primaryBadge.color)}>●</span>
                    <span className={cn("font-semibold text-sm", primaryBadge.color)}>
                      {primaryBadge.title}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{primaryBadge.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
         <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="mt-2 sm:mt-0">
                    <History className="mr-2 h-4 w-4" /> View Reward History
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Reward History</DialogTitle>
                    <DialogDescription>
                        A passbook-style view of your S-Point and S-Coin transactions.
                    </DialogDescription>
                </DialogHeader>
                {rewardHistory.length > 0 ? (
                <ScrollArea className="h-96 w-full mt-4">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50px]">Sl.No</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rewardHistory.map((event, index) => {
                        let balancePoints = sPoints;
                        let balanceCoins = sCoins;
                        for (let i = 0; i < index; i++) {
                            balancePoints -= rewardHistory[i].points;
                            balanceCoins -= rewardHistory[i].coins;
                        }

                        return (
                            <TableRow key={event.id}>
                            <TableCell className="font-medium">{rewardHistory.length - index}</TableCell>
                            <TableCell>
                                <div className="font-medium text-foreground">{event.description}</div>
                                <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                {event.points < 0 && (
                                <div className="font-semibold flex items-center justify-end text-red-600">
                                    {event.points} <SPointsIcon className="ml-1.5 h-4 w-4" />
                                </div>
                                )}
                                {event.coins < 0 && (
                                <div className="font-semibold flex items-center justify-end text-red-600">
                                    {event.coins} <SCoinsIcon className="ml-1.5 h-4 w-4" />
                                </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {event.points > 0 && (
                                <div className="font-semibold flex items-center justify-end text-green-600">
                                    +{event.points} <SPointsIcon className="ml-1.5 h-4 w-4" />
                                </div>
                                )}
                                {event.coins > 0 && (
                                <div className="font-semibold flex items-center justify-end text-green-600">
                                    +{event.coins} <SCoinsIcon className="ml-1.5 h-4 w-4" />
                                </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="font-semibold flex items-center justify-end">
                                {balancePoints} <SPointsIcon className="ml-1.5 h-4 w-4 text-yellow-400" />
                                </div>
                                <div className="font-semibold flex items-center justify-end text-sm text-muted-foreground">
                                {balanceCoins} <SCoinsIcon className="ml-1.5 h-4 w-4 text-amber-500" />
                                </div>
                            </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                    </Table>
                </ScrollArea>
                ) : (
                    <div className="text-center py-10">
                        <History size={48} className="mx-auto text-primary/30 mb-3" />
                        <p className="text-md text-foreground/90">No rewards earned yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Play some games to see your history!</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="avatar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary/20">
          <TabsTrigger value="avatar" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <UserCircle className="mr-2 h-5 w-5" /> Avatar
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Trophy className="mr-2 h-5 w-5" /> Progress & Achievements
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <BarChart3 className="mr-2 h-5 w-5" /> Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avatar">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Choose Your Avatar</CardTitle>
              <CardDescription>Select a predefined avatar or upload your own (max 2MB). Changes are saved locally and auto-saved to your online profile if you are logged in.</CardDescription>
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
                <p className="text-xs text-muted-foreground mt-2">Max file size: 2MB. PNG, JPG, GIF accepted. Changes auto-save when logged in.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center space-x-3">
                    <Trophy size={28} className="text-primary" />
                    <CardTitle className="text-2xl">Progress & Achievements</CardTitle>
                </div>
                <CardDescription>
                    A summary of your stats, badges, and game-by-game performance.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Achievements Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Achievement Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                            <Gamepad2 className="mr-3 h-6 w-6 text-primary" />
                            <div>
                            <p className="font-semibold">Games Played</p>
                            <p className="text-2xl font-bold">{totalGamesPlayed}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                            <BarChart3 className="mr-3 h-6 w-6 text-primary" />
                            <div>
                            <p className="font-semibold">Highest Score</p>
                            <p className="text-2xl font-bold">{highestScoreInfo.score}</p>
                            <p className="text-xs text-muted-foreground">in {highestScoreInfo.gameName}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-muted/50 rounded-lg col-span-1 sm:col-span-2">
                           <Trophy className="mr-3 h-6 w-6 text-primary" />
                            <div>
                            <p className="font-semibold">Badges Unlocked</p>
                             <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                {unlockedBadges.length > 0 ? (
                                    unlockedBadges.map(badge => (
                                        <TooltipProvider key={badge.id}>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <badge.Icon size={28} className={cn(badge.color)} />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-semibold">{badge.title}</p>
                                                    <p className="text-xs">{badge.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Play games to unlock badges!</p>
                                )}
                            </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Game-by-Game Stats</h3>
                    {playedGameStats.length > 0 ? (
                        <ScrollArea className="h-[450px] w-full pr-2">
                          <div className="space-y-4">
                            {/* Render Strategy & Puzzle Games */}
                            {[...strategyStats, ...puzzleStats].map(stat => {
                                const game = gameDefsMap.get(stat.gameId);
                                if (!game) return null;
                                return <GameStatRow key={stat.gameId} stat={stat} game={game} />;
                            })}
                          </div>
    
                          <Accordion type="multiple" className="w-full mt-4 space-y-2">
                            {/* Number Puzzles Accordion */}
                            {numberPuzzleStats.length > 0 && (
                              <AccordionItem value="number-puzzles" className="border rounded-lg bg-muted/20">
                                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                          <Gamepad2 className="h-6 w-6 text-green-600" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-left">Number Puzzles</h3>
                                        <p className="text-xs text-muted-foreground text-left">Click to see your stats for each number game.</p>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 pb-4 space-y-2">
                                    {numberPuzzleStats.map(stat => {
                                      const game = gameDefsMap.get(stat.gameId);
                                      if (!game) return null;
                                      return <GameStatRow key={stat.gameId} stat={stat} game={game} />;
                                    })}
                                  </AccordionContent>
                              </AccordionItem>
                            )}
                            {/* Easy English Accordion */}
                             {englishPuzzleStats.length > 0 && (
                              <AccordionItem value="easy-english" className="border rounded-lg bg-muted/20">
                                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                     <div className="flex items-center gap-3">
                                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                                          <Bookmark className="h-6 w-6 text-indigo-500" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-left">Easy English Fun</h3>
                                        <p className="text-xs text-muted-foreground text-left">Click to see your stats for each English game.</p>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 pb-4 space-y-2">
                                    {englishPuzzleStats.map(stat => {
                                      const game = gameDefsMap.get(stat.gameId);
                                      if (!game) return null;
                                      return <GameStatRow key={stat.gameId} stat={stat} game={game} />;
                                    })}
                                  </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        </ScrollArea>
                    ) : (
                        <div className="text-center py-10">
                            <BarChart3 size={48} className="mx-auto text-primary/30 mb-3" />
                            <p className="text-md text-foreground/90">No game stats yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">Play some games to see your progress!</p>
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Leaderboards</CardTitle>
              <CardDescription>
                See how you rank against other players! Coming soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-10">
              <BarChart3 size={48} className="mx-auto text-primary/30 mb-3" />
              <p className="text-md text-foreground/90">
                Leaderboards are under construction.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back soon to see the top players!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
