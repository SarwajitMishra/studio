
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hash, Brain, ArrowLeft, Shield, Star, Gem, CheckCircle, Wand } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MATH_PUZZLE_TYPES, type MathPuzzleType, type Difficulty } from "@/lib/constants";

// Import the refactored components
import GuessTheNumberGame from "@/components/number-puzzles/GuessTheNumberGame";
import ArithmeticChallengeGame from "@/components/number-puzzles/ArithmeticChallengeGame";
import WhatComesNextGame from "@/components/number-puzzles/WhatComesNextGame";
import CountTheObjectsGame from "@/components/number-puzzles/CountTheObjectsGame";
import PlaceholderPuzzleGame from "@/components/number-puzzles/PlaceholderPuzzleGame";
import FastMathGame from "@/components/number-puzzles/FastMathGame";
import MagicSquareGame from "@/components/number-puzzles/MagicSquareGame";

// Client component to inject metadata
const HeadMetadata = ({ puzzleName }: { puzzleName?: string }) => {
  const baseTitle = "Number Puzzles | Shravya Playlab";
  const title = puzzleName ? `${puzzleName} - ${baseTitle}` : baseTitle;
  const description = puzzleName
    ? `Play ${puzzleName} and test your logic skills!`
    : "Challenge yourself with a variety of fun number puzzles like Guess the Number, Arithmetic Challenges, and more!";
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

export default function NumberPuzzlesPage() {
  const [view, setView] = useState<"selectPuzzle" | "selectDifficulty" | "playing">("selectPuzzle");
  const [selectedPuzzle, setSelectedPuzzle] = useState<MathPuzzleType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const handlePuzzleSelect = (puzzle: MathPuzzleType) => {
    setSelectedPuzzle(puzzle);
    setView("selectDifficulty");
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setView("playing");
  };

  const handleBack = () => {
    if (view === "playing") {
      setView("selectDifficulty");
    } else if (view === "selectDifficulty") {
      setView("selectPuzzle");
      setSelectedPuzzle(null);
      setSelectedDifficulty(null);
    }
  };

  const renderGameComponent = () => {
    if (!selectedPuzzle || !selectedDifficulty) return null;

    const gameProps = {
      onBack: handleBack,
      difficulty: selectedDifficulty,
    };

    switch (selectedPuzzle.id) {
      case "guessTheNumber":
        return <GuessTheNumberGame {...gameProps} />;
      case "arithmeticChallenge":
        return <ArithmeticChallengeGame {...gameProps} />;
      case "whatComesNext":
        return <WhatComesNextGame {...gameProps} />;
      case "countTheObjects":
        return <CountTheObjectsGame {...gameProps} />;
      case "magicSquare":
        return <MagicSquareGame {...gameProps} />;
      case "mathDuel":
        return <FastMathGame {...gameProps} />;
      default:
        return <PlaceholderPuzzleGame puzzle={selectedPuzzle} onBack={handleBack} />;
    }
  };

  if (view === "playing") {
    return (
      <>
        <HeadMetadata puzzleName={selectedPuzzle?.name} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
          {renderGameComponent()}
        </div>
      </>
    );
  }

  if (view === "selectDifficulty" && selectedPuzzle) {
    return (
      <>
        <HeadMetadata puzzleName={selectedPuzzle.name} />
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
            <Card className="w-full max-w-lg shadow-xl">
                 <CardHeader className="bg-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <selectedPuzzle.Icon size={28} className={cn("text-primary", selectedPuzzle.color)} />
                            <CardTitle className="text-2xl font-bold text-primary">{selectedPuzzle.name}</CardTitle>
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
              <Hash size={36} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Number Puzzles</CardTitle>
            </div>
            <CardDescription className="text-center text-xl text-foreground/80 pt-3">
              Choose a challenge!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-1 gap-6">
            {MATH_PUZZLE_TYPES.map((puzzle) => (
              <Button
                key={puzzle.id}
                variant="outline"
                className="h-auto py-4 text-left flex flex-col items-start space-y-1 hover:bg-accent/10 group"
                onClick={() => handlePuzzleSelect(puzzle)}
              >
                <div className="flex items-center w-full">
                  <puzzle.Icon size={24} className={cn("mr-3 transition-colors duration-200", puzzle.color, "group-hover:scale-110")} />
                  <div className="flex-grow">
                    <p className={cn("text-lg font-semibold", puzzle.color)}>{puzzle.name}</p>
                    <p className="text-sm text-muted-foreground">{puzzle.description}</p>
                  </div>
                  <Brain size={24} className="text-transparent group-hover:text-accent transition-colors duration-200" />
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
