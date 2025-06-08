
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash, Target, RotateCcw, Lightbulb, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Client component to inject metadata
const HeadMetadata = () => {
  return (
    <>
      <title>Number Puzzles - Guess the Number | Shravya Playhouse</title>
      <meta name="description" content="Play 'Guess the Number' and test your logic skills! Sharpen your mind with this fun number puzzle." />
    </>
  );
};

const MAX_NUMBER = 100; // The upper limit for the secret number

export default function NumberPuzzlesPage() {
  const [secretNumber, setSecretNumber] = useState<number | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("Make your first guess!");
  const [attempts, setAttempts] = useState<number>(0);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const { toast } = useToast();

  const generateNewSecretNumber = useCallback(() => {
    // Ensure Math.random runs only on the client after hydration
    setSecretNumber(Math.floor(Math.random() * MAX_NUMBER) + 1);
  }, []);

  const resetGame = useCallback(() => {
    generateNewSecretNumber();
    setCurrentGuess("");
    setFeedback(`I'm thinking of a number between 1 and ${MAX_NUMBER}.`);
    setAttempts(0);
    setIsGameWon(false);
    setShowHint(false);
  }, [generateNewSecretNumber]);

  useEffect(() => {
    // Initial game setup on mount, only runs on client
    resetGame();
  }, [resetGame]);


  const handleGuessSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGameWon || secretNumber === null) return;

    const guessNum = parseInt(currentGuess, 10);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > MAX_NUMBER) {
      setFeedback(`Please enter a valid number between 1 and ${MAX_NUMBER}.`);
      toast({
        variant: "destructive",
        title: "Invalid Guess",
        description: `Your guess must be a number from 1 to ${MAX_NUMBER}.`,
      });
      return;
    }

    setAttempts(prev => prev + 1);

    if (guessNum === secretNumber) {
      setFeedback(`Congratulations! You guessed it in ${attempts + 1} attempts.`);
      setIsGameWon(true);
      toast({
        title: "You Win!",
        description: `You guessed the number ${secretNumber} in ${attempts + 1} tries!`,
        className: "bg-green-500 text-white", // Example of custom toast styling
      });
    } else if (guessNum < secretNumber) {
      setFeedback("Too low! Try a higher number.");
    } else {
      setFeedback("Too high! Try a lower number.");
    }
    setCurrentGuess(""); // Clear input after guess
  };

  const getHint = () => {
    if (secretNumber === null) return "Game not started yet.";
    setShowHint(true);
    if (secretNumber % 2 === 0) {
      return "Hint: The number is even.";
    } else {
      return "Hint: The number is odd.";
    }
  };

  return (
    <>
      <HeadMetadata />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="bg-primary/10">
            <div className="flex items-center justify-center space-x-3">
              <Hash size={32} className="text-primary" />
              <CardTitle className="text-3xl font-bold text-primary">Guess the Number</CardTitle>
            </div>
            <CardDescription className="text-center text-lg text-foreground/80 pt-2">
              I'm thinking of a number between 1 and {MAX_NUMBER}. Can you guess it?
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
                    placeholder={`Enter a number (1-${MAX_NUMBER})`}
                    className="text-base"
                    disabled={isGameWon || secretNumber === null}
                    min="1"
                    max={MAX_NUMBER}
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
                    <Button variant="outline" size="sm" onClick={() => setFeedback(getHint())}>
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
      </div>
    </>
  );
}
