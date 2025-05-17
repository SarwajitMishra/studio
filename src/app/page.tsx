import GameCard from '@/components/game-card';
import { GAMES, type GameCategory } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Component } from 'lucide-react';
import { cn } from '@/lib/utils'; // Added this import

const CATEGORIES_ORDER: GameCategory[] = ['Strategy', 'Puzzles', 'Learning'];

export default function GameLibraryPage() {
  const groupedGames = GAMES.reduce((acc, game) => {
    const category = game.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(game);
    return acc;
  }, {} as Record<GameCategory, typeof GAMES>);

  return (
    <div className="space-y-12">
      <header className="text-center py-8 bg-primary/10 rounded-lg shadow">
        <h1 className="text-4xl font-bold text-primary tracking-tight">Welcome to Shravya Playhouse!</h1>
        <p className="mt-3 text-lg text-foreground/80 max-w-2xl mx-auto">
          Explore a world of fun and learning with our exciting collection of games designed for kids.
        </p>
      </header>

      {CATEGORIES_ORDER.map((category) => {
        const gamesInCategory = groupedGames[category];
        if (!gamesInCategory || gamesInCategory.length === 0) return null;
        
        // The actual icon component used for rendering, taken from the first game in the category or a fallback.
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
  );
}
