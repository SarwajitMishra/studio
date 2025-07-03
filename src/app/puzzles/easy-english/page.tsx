
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, ArrowLeft, Shield, Star, Gem, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENGLISH_PUZZLE_TYPES, type EnglishPuzzleSubtype, type Difficulty, type EnglishPuzzleType } from "@/lib/constants";
import EnglishPuzzleGame from "@/components/english-puzzles/EnglishPuzzleGame";
import TypingRushGame from "@/components/english-puzzles/TypingRushGame";

// Client component to inject metadata
const HeadMetadata = ({ puzzleName }: { puzzleName?: string }) => {
  const baseTitle = "Easy English Fun | Shravya Playhouse";
  const title = puzzleName ? `${puzzleName} - ${baseTitle}` : baseTitle;
  const description = puzzleName
    ? `Play ${puzzleName} to improve your English vocabulary!`
    : "Choose a fun English puzzle to play, like matching words to pictures or improving your typing speed!";
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
};

const DIFFICULTY_LEVELS: { level: Difficulty, label: string, Icon: React.ElementType }[] = [
    { level: "easy", label: "Easy", Icon: Shield },
    { level: "medium", label: "Medium", Icon: Star },
    { level: "hard", label: "Hard", Icon: Gem },
];

export default function EasyEnglishPuzzlesPage() {
  const [view, setView] = useState<'selectPuzzle' | 'selectDifficulty' | 'playing'>('selectPuzzle');
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<EnglishPuzzleType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const handlePuzzleSelect = (puzzleType: EnglishPuzzleType) => {
    setSelectedPuzzleType(puzzleType);
    setView('selectDifficulty');
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setView('playing');
  };

  const handleBack = () => {
    if (view === 'playing') {
      setView('selectDifficulty');
    } else if (view === 'selectDifficulty') {
      setView('selectPuzzle');
      setSelectedPuzzleType(null);
    }
  };

  if (view === 'playing' && selectedPuzzleType && selectedDifficulty) {
    const commonProps = {
      difficulty: selectedDifficulty,
      onBack: handleBack,
    };

    let gameComponent;

    switch (selectedPuzzleType.id) {
      case 'typingRush':
        gameComponent = <TypingRushGame {...commonProps} />;
        break;
      
      case 'matchWord':
      case 'missingLetter':
      case 'sentenceScramble':
      case 'oddOneOut':
        gameComponent = <EnglishPuzzleGame 
          puzzleType={selectedPuzzleType.id}
          puzzleName={selectedPuzzleType.name}
          Icon={selectedPuzzleType.Icon}
          {...commonProps} 
        />;
        break;

      default:
        gameComponent = (
          <div className="text-center">
            <p>Game not found.</p>
            <Button onClick={handleBack} className="mt-4">Go Back</Button>
          </div>
        );
    }

    return (
      <>
        <HeadMetadata puzzleName={selectedPuzzleType.name} />
        {gameComponent}
      </>
    );
  }

  if (view === 'selectDifficulty' && selectedPuzzleType) {
    return (
      <>
        <HeadMetadata puzzleName={selectedPuzzleType.name} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
            <Card className="w-full max-w-lg shadow-xl">
                 <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <selectedPuzzleType.Icon size={28} className={cn("text-primary", selectedPuzzleType.color)} />
                            <CardTitle className="text-2xl font-bold text-primary">{selectedPuzzleType.name}</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleBack}>
                            <ArrowLeft size={16} className="mr-1" /> Back
                        </Button>
                    </div>
                    <CardDescription className="text-center text-lg text-foreground/80 pt-3">
                        Select your challenge level!
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 gap-4">
                     {DIFFICULTY_LEVELS.map((diff) => (
                        <Button
                            key={diff.level}
                            variant="outline"
                            className="h-auto py-4 text-left flex items-start space-y-1 hover:bg-accent/10 group"
                            onClick={() => handleDifficultySelect(diff.level)}
                        >
                             <div className="flex items-center w-full">
                                <diff.Icon size={24} className="mr-3 transition-colors duration-200"/>
                                <div className="flex-grow">
                                    <p className="text-lg font-semibold">{diff.label}</p>
                                </div>
                                <CheckCircle size={24} className="text-transparent group-hover:text-accent transition-colors duration-200" />
                            </div>
                        </Button>
                     ))}
                </CardContent>
            </Card>
        </div>
      </>
    );
  }

  // Default view: selectPuzzle
  return (
    <>
      <HeadMetadata />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <BookMarked size={36} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Easy English Puzzles</CardTitle>
            </div>
            <CardDescription className="text-center text-xl text-foreground/80 pt-3">
              Choose a fun way to learn!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {ENGLISH_PUZZLE_TYPES.map((puzzle) => (
              <Button
                key={puzzle.id}
                variant="outline"
                className="h-auto py-4 text-left flex flex-col items-start space-y-1 hover:bg-accent/10 group"
                onClick={() => handlePuzzleSelect(puzzle)}
              >
                <div className="flex items-center w-full">
                  <puzzle.Icon size={24} className={cn("mr-3 transition-colors duration-200", puzzle.color)} />
                  <div className="flex-grow">
                    <p className={cn("text-lg font-semibold", puzzle.color)}>{puzzle.name}</p>
                    <p className="text-sm text-muted-foreground">{puzzle.description}</p>
                  </div>
                  <ArrowLeft size={24} className="text-transparent rotate-180 group-hover:text-accent transition-colors duration-200" />
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
