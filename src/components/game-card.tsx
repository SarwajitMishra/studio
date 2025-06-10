import Link from 'next/link';
import type { Game } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <Card className="group flex flex-col h-full shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden transform hover:-translate-y-1 hover:animate-gentle-bounce">
      <CardHeader className="bg-muted/50 p-4">
        <div className="flex items-center gap-3">
          <game.Icon size={40} className={cn("text-primary group-hover:scale-110 transition-transform duration-300", game.color)} />
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{game.title}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{game.category}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <p className="text-sm text-foreground/80 mb-4 flex-grow">{game.description}</p>
        <Button asChild variant="default" className="mt-auto bg-accent text-accent-foreground hover:bg-accent/90 w-full">
          <Link href={game.href}>
            Play Now <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
