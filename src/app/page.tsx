
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import {
  ToyBrick,
  Brain,
  Sparkles,
  Calendar,
  Trophy,
  BarChart3,
  Store,
  BookOpen,
  Settings,
  Lock,
  Component,
  ArrowRight
} from 'lucide-react';
import { 
  BADGES, 
  type Badge, 
  GAMES,
  type GameCategory,
  LOCAL_STORAGE_S_POINTS_KEY 
} from '@/lib/constants';
import { getGameStats, type GameStat } from '@/lib/progress';
import { cn } from '@/lib/utils';
import GameCard from '@/components/game-card';

const CATEGORIES_ORDER: GameCategory[] = ['Strategy', 'Puzzles', 'Learning'];

const getStoredSPoints = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_S_POINTS_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      console.error("Error reading S-Points from localStorage", e);
      return 0;
    }
  }
  return 0;
};

const PlaceholderContent = ({ title, description, Icon, href, buttonText }: { title: string, description: string, Icon: React.ElementType, href?: string, buttonText?: string }) => (
    <div className="flex flex-col items-center justify-center text-center p-10 h-full bg-muted/50 rounded-lg min-h-[50vh]">
        <Icon className="w-16 h-16 text-primary/50 mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {href && buttonText && (
            <Button asChild>
                <Link href={href}>{buttonText} <ArrowRight className="ml-2"/></Link>
            </Button>
        )}
    </div>
);


export default function DashboardPage() {
  const [sPoints, setSPoints] = useState<number>(0);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);

  const updateLocalData = useCallback(() => {
    setSPoints(getStoredSPoints());
    setGameStats(getGameStats());
  }, []);

  useEffect(() => {
    updateLocalData();
    window.addEventListener('storageUpdated', updateLocalData);
    return () => {
      window.removeEventListener('storageUpdated', updateLocalData);
    };
  }, [updateLocalData]);

  const unlockedBadges = useMemo(() => {
    const checkBadgeCriteria = (badge: Badge): boolean => {
        switch (badge.id) {
            case 'beginner-explorer': return sPoints >= 100;
            case 'star-starter': return gameStats.some(stat => stat.wins > 0);
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
            default: return false;
        }
    };
    return BADGES.filter(checkBadgeCriteria);
  }, [sPoints, gameStats]);

  const groupedGames = GAMES.reduce((acc, game) => {
    const category = game.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(game);
    return acc;
  }, {} as Record<GameCategory, typeof GAMES>);

  return (
    <div className="space-y-6">
      <header className="text-center py-8 bg-primary/10 rounded-lg shadow">
        <h1 className="text-4xl font-bold text-primary tracking-tight">Welcome to Shravya Playhouse!</h1>
        <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
          Explore a world of fun and learning with our exciting collection of games and features.
        </p>
      </header>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 h-auto py-2">
            <TabsTrigger value="games"><ToyBrick className="mr-2"/>Games</TabsTrigger>
            <TabsTrigger value="how-to-play"><Brain className="mr-2"/>How to Play</TabsTrigger>
            <TabsTrigger value="features"><Sparkles className="mr-2"/>Features</TabsTrigger>
            <TabsTrigger value="live-events"><Calendar className="mr-2"/>Live Events</TabsTrigger>
            <TabsTrigger value="achievements"><Trophy className="mr-2"/>Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard"><BarChart3 className="mr-2"/>Leaderboard</TabsTrigger>
            <TabsTrigger value="shop"><Store className="mr-2"/>Shop</TabsTrigger>
            <TabsTrigger value="blogs"><BookOpen className="mr-2"/>Blogs</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2"/>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="mt-6">
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
        </TabsContent>

        <TabsContent value="how-to-play" className="mt-6">
             <PlaceholderContent 
                title="How to Play"
                description="Find instructions and tips for all our games here. Learn the rules and master your strategy!"
                Icon={Brain}
             />
        </TabsContent>

        <TabsContent value="features" className="mt-6">
             <PlaceholderContent 
                title="New Features"
                description="Check out the latest additions and updates to Shravya Playhouse. We're always adding new fun!"
                Icon={Sparkles}
             />
        </TabsContent>

        <TabsContent value="live-events" className="mt-6">
             <PlaceholderContent 
                title="Live Events"
                description="Join special events, tournaments, and seasonal celebrations. Stay tuned for our event schedule!"
                Icon={Calendar}
             />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-3">
                        <Trophy size={28} className="text-primary" />
                        <CardTitle className="text-2xl">Your Badges & Achievements</CardTitle>
                    </div>
                    <CardDescription>
                        Unlock new titles and badges by playing games and reaching milestones.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="mt-6">
            <PlaceholderContent 
                title="Leaderboards"
                description="See how you stack up against other players! Leaderboards for top scores and game wins are coming soon."
                Icon={BarChart3}
             />
        </TabsContent>

        <TabsContent value="shop" className="mt-6">
            <PlaceholderContent 
                title="S-Coin Shop"
                description="Use your S-Coins to enter contests, unlock new avatars, and get special items! Enter the monthly contest now."
                Icon={Store}
                href="/contest"
                buttonText="Go to Monthly Contest"
             />
        </TabsContent>

        <TabsContent value="blogs" className="mt-6">
            <PlaceholderContent 
                title="Playhouse Blogs"
                description="Read articles from our team about game strategies, learning tips, and upcoming features."
                Icon={BookOpen}
             />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
            <PlaceholderContent 
                title="Settings & Preferences"
                description="Customize your app experience, manage your account, and set your favorite theme."
                Icon={Settings}
                href="/profile"
                buttonText="Go to Your Profile"
             />
        </TabsContent>

      </Tabs>
    </div>
  );
}
