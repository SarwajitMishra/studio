
"use client";

import type { NextPage } from 'next';
import { Metadata } from 'next';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card as ShadCNCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Award, Brain } from 'lucide-react';
import { MEMORY_ICONS } from '@/lib/constants';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Component metadata can be exported for Server Components,
// but for client components, it's often handled in a parent or layout.
// export const metadata: Metadata = {
// title: 'Memory Match Puzzle',
// description: 'Test your memory by matching pairs of icons!',
// };


interface MemoryCardType {
  id: number;
  value: LucideIcon;
  isFlipped: boolean;
  isMatched: boolean;
  uniqueId: string; // To ensure key is unique even if values are same
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateCards = (): MemoryCardType[] => {
  const icons = MEMORY_ICONS; // 8 icons
  const pairedIcons = [...icons, ...icons]; // 16 cards total
  const shuffledIcons = shuffleArray(pairedIcons);

  return shuffledIcons.map((IconComponent, index) => ({
    id: index, // Index based ID
    value: IconComponent,
    isFlipped: false,
    isMatched: false,
    uniqueId: `${index}-${new Date().getTime()}`, // More robust unique key
  }));
};

const MemoryMatchPage: NextPage = () => {
  const [cards, setCards] = useState<MemoryCardType[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false); // To prevent rapid clicks during check

  const totalPairs = MEMORY_ICONS.length;

  const initializeGame = useCallback(() => {
    setCards(generateCards());
    setFlippedIndices([]);
    setMatchedPairsCount(0);
    setMoves(0);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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
        setMatchedPairsCount((prevCount) => prevCount + 1);
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

  const isGameWon = matchedPairsCount === totalPairs && cards.length > 0;

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <HeadMetadata />
      <ShadCNCard className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center">
            <Brain className="mr-3 h-8 w-8" /> Memory Match
          </CardTitle>
          <CardDescription className="text-center text-lg text-foreground/80 pt-1">
            Find all the matching pairs of icons!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xl font-medium text-foreground">Moves: <span className="text-accent font-bold">{moves}</span></p>
            <Button onClick={initializeGame} variant="outline" className="shadow-md">
              <RefreshCw className="mr-2 h-5 w-5" /> Reset Game
            </Button>
          </div>

          {isGameWon ? (
            <div className="text-center py-10 bg-green-100 rounded-lg shadow-inner">
              <Award className="mx-auto h-20 w-20 text-yellow-500 mb-4" />
              <h2 className="text-3xl font-bold text-green-700">Congratulations!</h2>
              <p className="text-xl text-green-600 mt-2">You found all pairs in {moves} moves!</p>
              <Button onClick={initializeGame} className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                Play Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:gap-4 aspect-square max-w-md mx-auto">
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
        <Brain size={32} className="text-primary-foreground opacity-50" /> // Placeholder for card back
      )}
    </button>
  );
};

// Client component to inject metadata
const HeadMetadata = () => {
  return (
    <>
      <title>Memory Match Puzzle | Shravya Playhouse</title>
      <meta name="description" content="Test your memory by matching pairs of icons in Shravya Playhouse!" />
    </>
  );
};


export default MemoryMatchPage;

// Basic CSS for card flip (can be enhanced)
// Add this to your global CSS or a style tag if needed,
// but Tailwind handles transform with 'rotate-y-180'
// .rotate-y-180 { transform: rotateY(180deg); }
