
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, RotateCcw, Lightbulb, Award, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";

const DIFFICULTY_CONFIG = {
  easy: { max: 20 },
  medium: { max: 100 },
  hard: { max: 500 },
};

interface GuessTheNumberGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

export default function GuessTheNumberGame({ onBack, difficulty }: GuessTheNumberGameProps) {
  const [secretNumber, setSecretNumber] = useState<number | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("Make your first guess!");
  const [attempts, setAttempts] = useState<number>(0);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCalculatingReward, setIsCalculatingReward] = useState<boolean>(false);
  const { toast } = useToast();

  const maxNumber = DIFFICULTY_CONFIG[difficulty].max;

  const resetGame = useCallback(() => {
    const newSecret = Math.floor(Math.random() * maxNumber) + 1;
    setSecretNumber(newSecret);
    setCurrentGuess("");
    setFeedback(`I'm thinking of a number between 1 and ${maxNumber}.`);
    setAttempts(0);
    setIsGameWon(false);
    setShowHint(false);
    setIsCalculatingReward(false);
  }, [maxNumber]);

  useEffect(() => {
    resetGame();
  }, [resetGame, difficulty]);

  const handleGuessSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGameWon || secretNumber === null || isCalculatingReward) return;
    const guessNum = parseInt(currentGuess, 10);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > maxNumber) {
      setFeedback(`Please enter a valid number between 1 and ${maxNumber}.`);
      toast({
        variant: "destructive",
        title: "Invalid Guess",
        description: `Your guess must be a number from 1 to ${maxNumber}.`,
      });
      return;
    }
    
    const newAttemptCount = attempts + 1;
    setAttempts(newAttemptCount);

    if (guessNum === secretNumber) {
      setFeedback(`Congratulations! You guessed it in ${newAttemptCount} attempts. Calculating your reward...`);
      setIsGameWon(true);
      setIsCalculatingReward(true);
      
      try {
        const rewards = await calculateRewards({
            gameId: 'guessTheNumber',
            difficulty,
            performanceMetrics: { attempts: newAttemptCount }
        });

        const earned = applyRewards(rewards.sPoints, rewards.sCoins);
        
        toast({
          title: "You Win! 🏆",
          description: `You earned ${earned.points} S-Points and ${earned.coins} S-Coins!`,
          className: "bg-green-500 text-white",
          duration: 5000,
        });
        setFeedback(`You guessed it in ${newAttemptCount} attempts! You've been awarded ${earned.points} S-Points and ${earned.coins} S-Coins.`);

      } catch (error) {
        console.error("Error calculating rewards:", error);
        toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        setFeedback(`You guessed it in ${newAttemptCount} attempts! There was an error calculating rewards.`);
      } finally {
        setIsCalculatingReward(false);
      }

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
          I'm thinking of a number between 1 and {maxNumber}. Can you guess it?
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGameWon ? (
          <div className="text-center p-6 bg-green-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-green-700">You Guessed It!</h2>
            <p className="text-lg text-green-600 mt-1">{feedback}</p>
            {isCalculatingReward && <Loader2 className="animate-spin mx-auto my-2" />}
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isCalculatingReward}>
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
                placeholder={`Enter a number (1-${maxNumber})`}
                className="text-base"
                disabled={isGameWon || secretNumber === null}
                min="1"
                max={maxNumber}
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
}
