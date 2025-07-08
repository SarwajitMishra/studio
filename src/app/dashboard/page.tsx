"use client";

import { useState, useEffect, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Component, Terminal, X } from 'lucide-react';
import { 
  GAMES,
  type GameCategory,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import GameCard from '@/components/game-card';
import { onAuthStateChanged, type User } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

const CATEGORIES_ORDER: GameCategory[] = ['Strategy', 'Puzzles', 'Learning'];

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const isGuest = authChecked && !currentUser;

  const groupedGames = useMemo(() => GAMES.reduce((acc, game) => {
    const category = game.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(game);
    return acc;
  }, {} as Record<GameCategory, typeof GAMES>), []);

  return (
    <div className="space-y-6">
      {isGuest && showGuestWarning && (
        <Alert variant="default" className="relative bg-accent/20 border-accent/50">
           <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setShowGuestWarning(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
           </Button>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Playing as Guest!</AlertTitle>
          <AlertDescription>
            Your progress won't be saved permanently. Sign in anytime to sync your rewards and achievements.
          </AlertDescription>
        </Alert>
      )}

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
