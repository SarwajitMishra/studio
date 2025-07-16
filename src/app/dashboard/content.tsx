
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Component, Terminal, X, Award } from 'lucide-react';
import { 
  GAMES,
  type GameCategory,
  S_POINTS_ICON as SPointsIcon,
  S_COINS_ICON as SCoinsIcon,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import GameCard from '@/components/game-card';
import { onAuthStateChanged, type User } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { applyRewards } from '@/lib/rewards';
import { addNotification } from '@/lib/notifications';


const CATEGORIES_ORDER: GameCategory[] = ['Strategy', 'Puzzles', 'Learning'];

export default function DashboardContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const guestNotificationSent = useRef(false);

  // New state and hooks for the welcome reward
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [newUserInfo, setNewUserInfo] = useState<{ points: number; coins: number } | null>(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);

      // If user is a guest and we haven't sent the notification this session...
      if (!user && !guestNotificationSent.current) {
        addNotification(
          "Playing as a guest! Sign up to save your progress and rewards.",
          "guest-warning", // A unique type for this notification
          "/signup"
        );
        guestNotificationSent.current = true; // Mark as sent for this session
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to handle the new user welcome reward
  useEffect(() => {
    const handleNewUser = () => {
      // Prevent double-awarding in React StrictMode by using sessionStorage
      if (sessionStorage.getItem('welcomeBonusAwarded') === 'true') {
        if (searchParams.get('new_user') === 'true') {
          router.replace('/dashboard', { scroll: false });
        }
        return;
      }

      // 1. Apply the welcome bonus to local storage so the UI updates instantly.
      const earned = applyRewards(100, 5, "Welcome Bonus!");
      setNewUserInfo(earned);
      setShowRewardDialog(true);
      
      // Mark bonus as awarded for this session
      sessionStorage.setItem('welcomeBonusAwarded', 'true');
      
      // 3. Clean up the URL to prevent the dialog from showing again on refresh
      router.replace('/dashboard', { scroll: false });
    };

    if (searchParams.get('new_user') === 'true') {
      handleNewUser();
    }
  }, [searchParams, router]);


  const groupedGames = useMemo(() => GAMES.reduce((acc, game) => {
    const category = game.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(game);
    return acc;
  }, {} as Record<GameCategory, typeof GAMES>), []);

  return (
    <div className="space-y-6">
      <AlertDialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                <Award size={28} /> Welcome to Shravya Playhouse!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base pt-2">
                As a special welcome gift, we've added some rewards to your account to get you started.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {newUserInfo && (
            <div className="py-4 flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-6 mt-2">
                    <span className="flex items-center font-bold text-2xl">
                        +{newUserInfo.points} <SPointsIcon className="ml-2 h-7 w-7 text-yellow-400" />
                    </span>
                    <span className="flex items-center font-bold text-2xl">
                        +{newUserInfo.coins} <SCoinsIcon className="ml-2 h-7 w-7 text-amber-500" />
                    </span>
                </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowRewardDialog(false)}>Start Playing!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="text-center py-8 bg-primary/10 rounded-lg shadow">
        <h1 className="text-4xl font-bold text-primary tracking-tight">Welcome to Shravya Playhouse!</h1>
        <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
          Explore a world of fun and learning with our exciting collection of games and features.
        </p>
      </header>

      <div className="space-y-12">
          {CATEGORIES_ORDER.map((category) => {
              const gamesInCategory = groupedGames[category];
              if (!gamesInCategory || gamesInCategory.length === 0) return null;
              
              // Sort games: Chess vs AI should come after Chess (PvP)
              gamesInCategory.sort((a, b) => {
                  if (a.id === 'chess' && b.id === 'chess-ai') return -1;
                  if (a.id === 'chess-ai' && b.id === 'chess') return 1;
                  return 0; // Keep original order for others
              });

              const CategoryIconComponent = gamesInCategory[0]?.Icon || Component;
              return (
                  <section key={category} aria-labelledby={`category-title-${category.toLowerCase()}`}>
                      <div className="flex items-center mb-6">
                      <CategoryIconComponent size={32} className={cn("mr-3", gamesInCategory[0]?.color || "text-primary")} />
                      <h2 id={`category-title-${category.toLowerCase()}`} className="text-3xl font-semibold text-foreground">
                          {category} Games
                      </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {gamesInCategory.map((game) => (
                          <GameCard key={game.id} game={game} />
                      ))}
                      </div>
                      {category !== CATEGORIES_ORDER[CATEGORIES_ORDER.length -1] && <Separator className="my-12" />}
                  </section>
              );
          })}
      </div>
    </div>
  );
}
