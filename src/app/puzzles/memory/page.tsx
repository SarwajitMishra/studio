
"use client";

import type { NextPage } from 'next';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card as ShadCNCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Award, Brain, Timer, ArrowLeft, Shield, Star, Gem } from 'lucide-react';
import { MEMORY_ICONS } from '@/lib/constants';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Client component to inject metadata
const HeadMetadata = () => {
  return (
    <>
      <title>Memory Match Puzzle | Shravya Playhouse</title>
      <meta name="description" content="Test your memory by matching pairs of icons in Shravya Playhouse!" />
    </>
  );
};

interface MemoryCardType {
  id: number;
  value: LucideIcon;
  isFlipped: boolean;
  isMatched: boolean;
  uniqueId: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_LEVELS: Record<Difficulty, { pairs: number; gridClass: string; label: string; Icon: LucideIcon }> = {
  easy: { pairs: 6, gridClass: 'grid-cols-4', label: 'Easy', Icon: Shield },
  medium: { pairs: 8, gridClass: 'grid-cols-4', label: 'Medium', Icon: Star },
  hard: { pairs: 10, gridClass: 'grid-cols-5', label: 'Hard', Icon: Gem },
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateCards = (pairCount: number): MemoryCardType[] => {
  const icons = shuffleArray(MEMORY_ICONS).slice(0, pairCount);
  const pairedIcons = [...icons, ...icons];
  const shuffledIcons = shuffleArray(pairedIcons);

  return shuffledIcons.map((IconComponent, index) => ({
    id: index,
    value: IconComponent,
    isFlipped: false,
    isMatched: false,
    uniqueId: `${index}-${new Date().getTime()}`,
  }));
};

const MemoryMatchPage: NextPage = () => {
  const [view, setView] = useState<'select' | 'playing'>('select');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const [cards, setCards] = useState<MemoryCardType[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  
  const timerRef =  useRef<NodeJS.Timeout | null>(null);

  const cleanupTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startGame = useCallback((selectedDifficulty: Difficulty) => {
    cleanupTimer();
    const config = DIFFICULTY_LEVELS[selectedDifficulty];
    setDifficulty(selectedDifficulty);
    setCards(generateCards(config.pairs));
    setFlippedIndices([]);
    setMatchedPairsCount(0);
    setMoves(0);
    setTime(0);
    setIsChecking(false);
    setIsGameWon(false);
    setView('playing');
  }, []);
  
  // Timer effect
  useEffect(() => {
    if (view === 'playing' && !isGameWon) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      cleanupTimer();
    }
    return cleanupTimer;
  }, [view, isGameWon]);
  

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) {
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsChecking(true);
      setMoves((prevMoves) => prevMoves + 1);
      const [firstIndex, secondIndex] = newFlippedIndices;
      const card1 = newCards[firstIndex];
      const card2 = newCards[secondIndex];

      if (card1.value === card2.value) { // Comparing icon components directly
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        const newMatchedCount = matchedPairsCount + 1;
        setMatchedPairsCount(newMatchedCount);

        const totalPairs = difficulty ? DIFFICULTY_LEVELS[difficulty].pairs : 0;
        if (newMatchedCount === totalPairs) {
            setIsGameWon(true);
            cleanupTimer();
        }
        
        setCards(newCards);
        setFlippedIndices([]);
        setIsChecking(false);
      } else {
        setTimeout(() => {
          const resetCards = [...cards]; // get fresh cards state
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (view === 'select') {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <HeadMetadata />
        <ShadCNCard className="w-full max-w-lg shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <Brain size={36} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Memory Match</CardTitle>
            </div>
            <CardDescription className="text-center text-xl text-foreground/80 pt-3">
              Select your difficulty!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 gap-4">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(level => {
              const { label, Icon, pairs } = DIFFICULTY_LEVELS[level];
              return (
                 <Button
                    key={level}
                    variant="outline"
                    className="h-auto py-4 text-left flex items-start space-y-1 hover:bg-accent/10 group"
                    onClick={() => startGame(level)}
                >
                    <div className="flex items-center w-full">
                      <Icon size={24} className="mr-3 transition-colors duration-200"/>
                      <div className="flex-grow">
                          <p className="text-lg font-semibold">{label}</p>
                           <p className="text-sm text-muted-foreground">{pairs} pairs</p>
                      </div>
                    </div>
                </Button>
              )
            })}
          </CardContent>
        </ShadCNCard>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <HeadMetadata />
      <ShadCNCard className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="mr-3 h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Memory Match</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => setView('select')}>
              <ArrowLeft size={16} className="mr-1" /> Change Difficulty
            </Button>
          </div>
          <CardDescription className="text-center text-lg text-foreground/80 pt-1">
            Find all matching pairs! Difficulty: <span className="capitalize">{difficulty}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2 p-2 rounded-md bg-card border">
                <Timer size={20} className="text-primary"/>
                <span className="font-mono font-semibold text-lg">{formatTime(time)}</span>
            </div>
            <p className="text-xl font-medium text-foreground">Moves: <span className="text-accent font-bold">{moves}</span></p>
            <Button onClick={() => difficulty && startGame(difficulty)} variant="outline" className="shadow-md">
              <RefreshCw className="mr-2 h-5 w-5" /> Reset
            </Button>
          </div>

          {isGameWon ? (
            <div className="text-center py-10 bg-green-100 rounded-lg shadow-inner">
              <Award className="mx-auto h-20 w-20 text-yellow-500 mb-4" />
              <h2 className="text-3xl font-bold text-green-700">Congratulations!</h2>
              <p className="text-xl text-green-600 mt-2">You found all pairs!</p>
              <p className="text-lg text-green-600 mt-1">Moves: {moves} | Time: {formatTime(time)}</p>
              <Button onClick={() => difficulty && startGame(difficulty)} className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                Play Again
              </Button>
            </div>
          ) : (
            <div className={cn("grid gap-3 sm:gap-4 aspect-square max-w-md mx-auto", difficulty && DIFFICULTY_LEVELS[difficulty].gridClass)}>
              {cards.map((card, index) => (
                <MemoryCard
                  key={card.uniqueId}
                  card={card}
                  onClick={() => handleCardClick(index)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </ShadCNCard>
    </div>
  );
};

interface MemoryCardProps {
  card: MemoryCardType;
  onClick: () => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ card, onClick }) => {
  const CardIcon = card.value;
  return (
    <button
      onClick={onClick}
      disabled={card.isFlipped || card.isMatched}
      className={cn(
        "aspect-square rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        card.isFlipped || card.isMatched ? "bg-secondary rotate-y-180" : "bg-primary/70 hover:bg-primary/90",
        card.isMatched ? "opacity-70 border-2 border-green-500" : "border-2 border-transparent"
      )}
      aria-label={card.isFlipped ? `Card showing ${card.value.displayName || 'icon'}` : "Facedown card"}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={cn("transition-opacity duration-300", card.isFlipped || card.isMatched ? "opacity-100" : "opacity-0")}>
        {card.isFlipped || card.isMatched ? (
          <CardIcon size={40} className="text-accent-foreground" />
        ) : (
          <span className="sr-only">Hidden card content</span>
        )}
      </div>
       {!card.isFlipped && !card.isMatched && (
        <Brain size={32} className="text-primary-foreground opacity-50" />
      )}
    </button>
  );
};

export default MemoryMatchPage;
