
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hash, Brain, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MATH_PUZZLE_TYPES, type MathPuzzleType } from "@/lib/constants";

// Import the refactored components
import GuessTheNumberGame from "@/components/number-puzzles/GuessTheNumberGame";
import ArithmeticChallengeGame from "@/components/number-puzzles/ArithmeticChallengeGame";
import NumberSequenceGame from "@/components/number-puzzles/NumberSequenceGame";
import MissingNumberGame from "@/components/number-puzzles/MissingNumberGame";
import CountTheObjectsGame from "@/components/number-puzzles/CountTheObjectsGame"; // Import new component
import PlaceholderPuzzleGame from "@/components/number-puzzles/PlaceholderPuzzleGame";

// Client component to inject metadata
const HeadMetadata = ({ puzzleName }: { puzzleName?: string }) => {
  const baseTitle = "Number Puzzles | Shravya Playhouse";
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

export default function NumberPuzzlesPage() {
  const [currentView, setCurrentView] = useState<string>("selectPuzzle"); 

  const selectedPuzzleDetails = MATH_PUZZLE_TYPES.find(p => p.id === currentView);
  const onBackToSelect = () => setCurrentView("selectPuzzle");

  if (currentView === "selectPuzzle") {
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
                  onClick={() => setCurrentView(puzzle.id)}
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

  return (
    <>
      <HeadMetadata puzzleName={selectedPuzzleDetails?.name} />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        {currentView === "guessTheNumber" && (
          <GuessTheNumberGame onBack={onBackToSelect} />
        )}
        {currentView === "arithmeticChallenge" && (
          <ArithmeticChallengeGame onBack={onBackToSelect} />
        )}
        {currentView === "numberSequence" && (
          <NumberSequenceGame onBack={onBackToSelect} />
        )}
        {currentView === "missingNumber" && ( 
          <MissingNumberGame onBack={onBackToSelect} />
        )}
        {currentView === "countTheObjects" && ( // Add this case
          <CountTheObjectsGame onBack={onBackToSelect} />
        )}
        {selectedPuzzleDetails && 
         !["guessTheNumber", "arithmeticChallenge", "numberSequence", "missingNumber", "countTheObjects"].includes(currentView) && 
          <PlaceholderPuzzleGame puzzle={selectedPuzzleDetails} onBack={onBackToSelect} />
        }
         {!selectedPuzzleDetails && currentView !== "selectPuzzle" && (
          <div className="text-center">
            <p className="text-xl text-destructive">Error: Puzzle not found.</p>
            <Button onClick={onBackToSelect} variant="link" className="mt-4">
                <ArrowLeft size={16} className="mr-2"/> Go Back
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
