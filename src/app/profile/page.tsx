
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
} from "@/lib/constants";
import { UserCircle, BarChart3, Settings, CheckCircle, LogIn, LogOut, UploadCloud, Edit3, User as UserIcon, Palette, Sun, Moon, Trophy, Gamepad2, Star, Coins, AlertTriangle, Loader2, History, Bookmark, Lock, BookOpen } from 'lucide-react';
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
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { getGameStats, type GameStat } from '@/lib/progress';
import { getRewardHistory, type RewardEvent } from '@/lib/rewards';

const LOCAL_STORAGE_USER_NAME_KEY = 'shravyaPlayhouse_userName';
const LOCAL_STORAGE_AVATAR_KEY = 'shravyaPlayhouse_avatar';
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
  const [editingUserName, setEditingUserName] = useState<string>(DEFAULT_USER_NAME);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR_SRC);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showLoginWarningDialog, setShowLoginWarningDialog] = useState(false);

  const [sPoints, setSPoints] = useState<number>(0);
  const [sCoins, setSCoins] = useState<number>(0);
  const [rewardHistory, setRewardHistory] = useState<RewardEvent[]>([]);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);

  const [isConfigMissing, setIsConfigMissing] = useState(false);
  
  const updateLocalData = useCallback(() => {
    setSPoints(getStoredGameCurrency(LOCAL_STORAGE_S_POINTS_KEY));
    setSCoins(getStoredGameCurrency(LOCAL_STORAGE_S_COINS_KEY));
    setRewardHistory(getRewardHistory());
    setGameStats(getGameStats());
  }, []);

  const unlockedBadges = useMemo(() => {
    const checkBadgeCriteria = (badge: Badge): boolean => {
        switch (badge.id) {
            case 'beginner-explorer':
                return sPoints >= 100;
            case 'star-starter':
                return gameStats.some(stat => stat.wins > 0);
            case 'puzzle-master':
                const puzzleGames = new Set(GAMES.filter(g => g.category === 'Puzzles').map(g => g.id));
                const puzzleWins = gameStats.filter(stat => puzzleGames.has(stat.gameId) && stat.wins > 0).length;
                return puzzleWins >= 3;
            case 'typing-titan':
                const typingStat = gameStats.find(stat => stat.gameId === 'typingRush');
                return (typingStat?.highScore || 0) >= 150;
            case 'strategy-sovereign':
                const chessStat = gameStats.find(stat => stat.gameId === 'chess');
                return (chessStat?.wins || 0) >= 5;
            default:
                return false;
        }
    };
    return BADGES.filter(checkBadgeCriteria);
  }, [sPoints, gameStats]);

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
  const blogsWritten = 0; // Placeholder

  // Effect to listen for currency and stats updates from other components
  useEffect(() => {
    window.addEventListener('storageUpdated', updateLocalData);
    return () => {
      window.removeEventListener('storageUpdated', updateLocalData);
    };
  }, [updateLocalData]);


  // Effect for loading local data on initial mount
  useEffect(() => {
    updateLocalData(); // Load all local data on mount
  }, [updateLocalData]);

  // Simplified, single effect for handling Firebase Auth state changes
  useEffect(() => {
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
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);

        if (user) { 
            // User is logged in, sync state from Firebase profile or fall back to local storage/defaults
            const firebaseDisplayName = user.displayName ?? localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) ?? DEFAULT_USER_NAME;
            setEditingUserName(firebaseDisplayName);
            localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, firebaseDisplayName);

            const firebasePhotoURL = user.photoURL ?? localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) ?? DEFAULT_AVATAR_SRC;
            setSelectedAvatar(firebasePhotoURL);
            localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, firebasePhotoURL);

            setSPoints(100); 
            setSCoins(10);  
            setRewardHistory([]); // Placeholder for online history
            setGameStats(getGameStats()); // Always load stats, but cloud sync would go here
            
        } else { 
            // User is logged out, load all data from local storage
            setEditingUserName(localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || DEFAULT_USER_NAME);
            setSelectedAvatar(localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY) || DEFAULT_AVATAR_SRC);
            updateLocalData();
        }
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
      if (currentUser) {
        handleAutoSaveAvatar(avatarSrc);
      } else {
        toast({ title: "Avatar Preview Changed", description: "Log in to save this avatar to your profile." });
      }
    };

    useEffect(() => {
      if (!currentUser || editingUserName === (currentUser.displayName ?? DEFAULT_USER_NAME)) {
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
    }, [editingUserName, currentUser, toast]);


  const actualSignInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({ title: "Logged In!", description: `Welcome back, ${result.user.displayName || 'User'}!` });
    } catch (error: any) {
      console.error("Error during Google sign-in with popup:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({ variant: "destructive", title: "Login Failed", description: error.message || "Could not sign in with Google. Please try again." });
      }
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
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any)      {
      console.error("Error during sign-out:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not sign out. Please try again." });
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

  const playedGameStats = gameStats.filter(s => s.gamesPlayed > 0);
  const strategyStats = playedGameStats.filter(s => gameDefsMap.get(s.gameId)?.category === 'Strategy');
  const puzzleStats = playedGameStats.filter(s => gameDefsMap.get(s.gameId)?.category === 'Puzzles');
  const numberPuzzleIds = new Set(MATH_PUZZLE_TYPES.map(p => p.id));
  const numberPuzzleStats = playedGameStats.filter(s => numberPuzzleIds.has(s.gameId));
  const englishPuzzleIds = new Set(ENGLISH_PUZZLE_TYPES.map(p => p.id));
  const englishPuzzleStats = playedGameStats.filter(s => englishPuzzleIds.has(s.gameId));


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Information</CardTitle>
          <CardDescription>Manage your login status and username. Changes for logged-in users are auto-saved to your online profile.</CardDescription>
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
                <p className="text-xs text-muted-foreground">Log in to save your display name, avatar, and game progress to your online profile. Local S-Points and S-Coins will be replaced by online data upon login.</p>
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
                            <TableCell className="font-medium">{index + 1}</TableCell>
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
        <TabsList className="grid w-full grid-cols-4 bg-primary/20">
          <TabsTrigger value="avatar" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <UserCircle className="mr-2 h-5 w-5" /> Avatar
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <BarChart3 className="mr-2 h-5 w-5" /> Progress
          </TabsTrigger>
           <TabsTrigger value="achievements" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Trophy className="mr-2 h-5 w-5" /> Achievements
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
        
        <TabsContent value="achievements">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center space-x-3">
                        <Trophy size={28} className="text-primary" />
                        <CardTitle className="text-2xl">Your Achievements</CardTitle>
                    </div>
                    <CardDescription>
                        A summary of your stats, badges, and titles earned in the Playhouse.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Mini Stats Review */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
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
                            <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                                <BookOpen className="mr-3 h-6 w-6 text-primary" />
                                <div>
                                <p className="font-semibold">Blogs Written</p>
                                <p className="text-2xl font-bold">{blogsWritten}</p>
                                </div>
                            </div>
                            <div className="flex items-center p-3 bg-muted/50 rounded-lg">
                                <Trophy className="mr-3 h-6 w-6 text-primary" />
                                <div>
                                <p className="font-semibold">Challenges Completed</p>
                                <p className="text-2xl font-bold">{totalWins}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Titles Earned */}
                    {primaryBadge && (
                        <div>
                        <h3 className="text-lg font-semibold mb-4">Title Earned</h3>
                        <div className={cn("p-4 rounded-lg border-2", primaryBadge.color.replace('text-', 'border-'))}>
                            <div className="flex items-center gap-3">
                                <primaryBadge.Icon size={32} className={cn(primaryBadge.color)} />
                                <div>
                                    <p className="text-xl font-bold">{primaryBadge.title}</p>
                                    <p className="text-sm text-muted-foreground">{primaryBadge.description}</p>
                                </div>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* Badges Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Badges Collection</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {BADGES.map(badge => {
                                const isUnlocked = unlockedBadges.some(ub => ub.id === badge.id);
                                return (
                                    <TooltipProvider key={badge.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Card className={cn(
                                                    "p-4 text-center transition-all",
                                                    isUnlocked ? `border-2 ${badge.color.replace('text-', 'border-')}` : 'bg-muted/50'
                                                )}>
                                                    <badge.Icon size={40} className={cn("mx-auto", isUnlocked ? badge.color : 'text-muted-foreground')} />
                                                    <p className="font-bold mt-2 text-sm">{badge.title}</p>
                                                    {!isUnlocked && <Lock size={16} className="mx-auto mt-1 text-muted-foreground" />}
                                                </Card>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold">{badge.title}</p>
                                                <p className="text-xs">{badge.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>


        <TabsContent value="progress">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BarChart3 size={28} className="text-primary" />
                <CardTitle className="text-2xl">Game Progress</CardTitle>
              </div>
              <CardDescription>
                Your performance across all games. Stats are stored locally in your browser. Only games you've played are shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
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

      <AlertDialog open={showLoginWarningDialog} onOpenChange={setShowLoginWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Logging in will sync your profile with our servers. Your online S-Points and S-Coins will be shown, replacing any locally stored values. Your local game progress will remain. Continue to login?
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
    

    

    