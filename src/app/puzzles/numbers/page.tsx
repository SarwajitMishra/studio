
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash, Target, RotateCcw, Lightbulb, Award, Brain, Calculator, ListOrdered, ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

interface MathPuzzleType {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

const MATH_PUZZLE_TYPES: MathPuzzleType[] = [
  {
    id: "guessTheNumber",
    name: "Guess the Number",
    description: "I'm thinking of a number. Can you find it with the fewest guesses?",
    Icon: Target,
    color: "text-blue-500",
  },
  {
    id: "arithmeticChallenge",
    name: "Arithmetic Challenge",
    description: "Solve quick math problems. How many can you get right?",
    Icon: Calculator,
    color: "text-green-500",
  },
  {
    id: "numberSequence",
    name: "Number Sequence",
    description: "What comes next? Figure out the pattern in the number sequence.",
    Icon: ListOrdered,
    color: "text-purple-500",
  },
];

const MAX_NUMBER_GUESS_GAME = 100;

const GuessTheNumberGame = ({ onBack }: { onBack: () => void }) => {
  const [secretNumber, setSecretNumber] = useState<number | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("Make your first guess!");
  const [attempts, setAttempts] = useState<number>(0);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const { toast } = useToast();

  const generateNewSecretNumber = useCallback(() => {
    setSecretNumber(Math.floor(Math.random() * MAX_NUMBER_GUESS_GAME) + 1);
  }, []);

  const resetGame = useCallback(() => {
    generateNewSecretNumber();
    setCurrentGuess("");
    setFeedback(`I'm thinking of a number between 1 and ${MAX_NUMBER_GUESS_GAME}.`);
    setAttempts(0);
    setIsGameWon(false);
    setShowHint(false);
  }, [generateNewSecretNumber]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleGuessSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGameWon || secretNumber === null) return;
    const guessNum = parseInt(currentGuess, 10);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > MAX_NUMBER_GUESS_GAME) {
      setFeedback(`Please enter a valid number between 1 and ${MAX_NUMBER_GUESS_GAME}.`);
      toast({
        variant: "destructive",
        title: "Invalid Guess",
        description: `Your guess must be a number from 1 to ${MAX_NUMBER_GUESS_GAME}.`,
      });
      return;
    }
    setAttempts(prev => prev + 1);
    if (guessNum === secretNumber) {
      setFeedback(`Congratulations! You guessed it in ${attempts + 1} attempts.`);
      setIsGameWon(true);
      toast({
        title: "You Win!",
        description: `You guessed ${secretNumber} in ${attempts + 1} tries!`,
        className: "bg-green-500 text-white",
      });
    } else if (guessNum < secretNumber) {
      setFeedback("Too low! Try a higher number.");
    } else {
      setFeedback("Too high! Try a lower number.");
    }
    setCurrentGuess("");
  };

  const getHintText = () => {
    if (secretNumber === null) return "Game not started yet.";
    setShowHint(true);
    if (secretNumber % 2 === 0) {
      return "Hint: The number is even.";
    } else {
      return "Hint: The number is odd.";
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Guess the Number</CardTitle>
          </div>
           <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          I'm thinking of a number between 1 and {MAX_NUMBER_GUESS_GAME}. Can you guess it?
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGameWon ? (
          <div className="text-center p-6 bg-green-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-green-700">You Guessed It!</h2>
            <p className="text-lg text-green-600 mt-1">{feedback}</p>
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleGuessSubmit} className="space-y-4">
            <div>
              <Label htmlFor="guessInput" className="text-base font-medium flex items-center mb-1">
                <Target className="mr-2 h-5 w-5 text-muted-foreground" /> Your Guess:
              </Label>
              <Input
                id="guessInput"
                type="number"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                placeholder={`Enter a number (1-${MAX_NUMBER_GUESS_GAME})`}
                className="text-base"
                disabled={isGameWon || secretNumber === null}
                min="1"
                max={MAX_NUMBER_GUESS_GAME}
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isGameWon || secretNumber === null}>
              Submit Guess
            </Button>
          </form>
        )}
        {!isGameWon && secretNumber !== null && (
          <div className="text-center space-y-3 pt-4 border-t border-border">
            <p className={cn(
              "text-lg font-medium min-h-[1.5em]",
              feedback.includes("Too high") || feedback.includes("Too low") ? "text-red-600" : "text-foreground",
              feedback.includes("Congratulations") || feedback.includes("guessed it") ? "text-green-600" : ""
            )}>
              {feedback}
            </p>
            <p className="text-sm text-muted-foreground">Attempts: {attempts}</p>
            {!showHint && (
              <Button variant="outline" size="sm" onClick={() => setFeedback(getHintText())}>
                <Lightbulb className="mr-2 h-4 w-4" /> Get a Hint
              </Button>
            )}
          </div>
        )}
        {!isGameWon && (
          <Button onClick={resetGame} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-5 w-5" /> Reset Game
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const PlaceholderPuzzleGame = ({ puzzle, onBack }: { puzzle: MathPuzzleType; onBack: () => void; }) => {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="bg-primary/10">
         <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <puzzle.Icon size={28} className={cn("text-primary", puzzle.color)} />
              <CardTitle className="text-2xl font-bold text-primary">{puzzle.name}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-4">
        <puzzle.Icon size={48} className={cn("mx-auto mb-4 text-muted-foreground", puzzle.color)} />
        <p className="text-xl text-foreground">{puzzle.description}</p>
        <p className="text-2xl font-semibold text-accent animate-pulse">Coming Soon!</p>
        <Button onClick={onBack} variant="ghost" className="mt-4">
          Choose Another Puzzle
        </Button>
      </CardContent>
    </Card>
  );
};


export default function NumberPuzzlesPage() {
  const [currentView, setCurrentView] = useState<string>("selectPuzzle"); // 'selectPuzzle' or puzzle.id

  const selectedPuzzleDetails = MATH_PUZZLE_TYPES.find(p => p.id === currentView);

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

  // Render selected puzzle game
  return (
    <>
      <HeadMetadata puzzleName={selectedPuzzleDetails?.name} />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        {currentView === "guessTheNumber" && (
          <GuessTheNumberGame onBack={() => setCurrentView("selectPuzzle")} />
        )}
        {currentView === "arithmeticChallenge" && selectedPuzzleDetails && (
          <PlaceholderPuzzleGame puzzle={selectedPuzzleDetails} onBack={() => setCurrentView("selectPuzzle")} />
        )}
        {currentView === "numberSequence" && selectedPuzzleDetails && (
          <PlaceholderPuzzleGame puzzle={selectedPuzzleDetails} onBack={() => setCurrentView("selectPuzzle")} />
        )}
      </div>
    </>
  );
}
