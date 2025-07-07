
"use client";

import React, { useState, useEffect, useCallback, FormEvent, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, RotateCcw, Lightbulb, Award, ArrowLeft, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";
import { updateGameStats } from "@/lib/progress";

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
  const [feedback, setFeedback] = useState<ReactNode>("Make your first guess!");
  const [attempts, setAttempts] = useState<number>(0);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCalculatingReward, setIsCalculatingReward] = useState<boolean>(false);
  const { toast } = useToast();

  const maxNumber = DIFFICULTY_CONFIG[difficulty].max;

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <Star key={i} className={cn("h-8 w-8", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const calculateStars = (attempts: number): number => {
    const thresholds = {
        easy: { best: 3, good: 6 },
        medium: { best: 5, good: 10 },
        hard: { best: 8, good: 15 },
    };
    const diffThresholds = thresholds[difficulty];

    if (attempts <= diffThresholds.best) return 3;
    if (attempts <= diffThresholds.good) return 2;
    return 1;
  };


  const resetGame = useCallback(() => {
    // If a game was in progress and is being reset, count it as played (but not won)
    if (attempts > 0 && !isGameWon) {
        updateGameStats({ gameId: 'number-puzzles', didWin: false });
    }
    const newSecret = Math.floor(Math.random() * maxNumber) + 1;
    setSecretNumber(newSecret);
    setCurrentGuess("");
    setFeedback(`I'm thinking of a number between 1 and ${maxNumber}.`);
    setAttempts(0);
    setIsGameWon(false);
    setShowHint(false);
    setIsCalculatingReward(false);
  }, [maxNumber, attempts, isGameWon]);

  useEffect(() => {
    const newSecret = Math.floor(Math.random() * maxNumber) + 1;
    setSecretNumber(newSecret);
    setCurrentGuess("");
    setFeedback(`I'm thinking of a number between 1 and ${maxNumber}.`);
    setAttempts(0);
    setIsGameWon(false);
    setShowHint(false);
    setIsCalculatingReward(false);
  }, [difficulty, maxNumber]);

  const handleGuessSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGameWon || secretNumber === null || isCalculatingReward) return;
    const guessNum = parseInt(currentGuess, 10);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > maxNumber) {
      setFeedback(<span className="text-red-600">{`Please enter a valid number between 1 and ${maxNumber}.`}</span>);
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
      setFeedback(<span className="text-green-600">Congratulations! You guessed it. Calculating reward...</span>);
      setIsGameWon(true);
      setIsCalculatingReward(true);

      const scoreForStat = Math.max(0, 1000 - newAttemptCount * 50);
      updateGameStats({ gameId: 'number-puzzles', didWin: true, score: scoreForStat });
      
      try {
        const rewards = await calculateRewards({
            gameId: 'guessTheNumber',
            difficulty,
            performanceMetrics: { attempts: newAttemptCount }
        });

        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Won 'Guess the Number' (${difficulty})`);
        const stars = calculateStars(newAttemptCount);
        
        toast({
          title: "You Win! 🏆",
          description: (
             <div className="flex flex-col gap-1">
                <div className="flex items-center">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Star key={i} size={16} className={cn(i < stars ? "text-yellow-300 fill-yellow-300" : "text-white/50")} />
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>You earned:</span>
                <span className="flex items-center font-bold">
                    {earned.points} <SPointsIcon className="ml-1.5 h-5 w-5 text-yellow-300" />
                </span>
                <span className="flex items-center font-bold">
                    {earned.coins} <SCoinsIcon className="ml-1.5 h-5 w-5 text-amber-400" />
                </span>
                </div>
            </div>
          ),
          className: "bg-green-600 border-green-700 text-white",
          duration: 5000,
        });

        setFeedback(
            <div className="flex flex-col items-center gap-2 text-center text-green-700">
                <StarRating rating={stars} />
                <span className="mt-2">You guessed it in {newAttemptCount} attempts! You earned:</span>
                <div className="flex items-center gap-6 mt-1">
                    <span className="flex items-center font-bold text-xl">
                        +{earned.points} <SPointsIcon className="ml-1.5 h-6 w-6 text-yellow-400" />
                    </span>
                    <span className="flex items-center font-bold text-xl">
                        +{earned.coins} <SCoinsIcon className="ml-1.5 h-6 w-6 text-amber-500" />
                    </span>
                </div>
            </div>
        );

      } catch (error) {
        console.error("Error calculating rewards:", error);
        toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        setFeedback(<span className="text-green-600">You guessed it in {newAttemptCount} attempts! There was an error calculating rewards.</span>);
      } finally {
        setIsCalculatingReward(false);
      }

    } else if (guessNum < secretNumber) {
      setFeedback(<span className="text-red-600">Too low! Try a higher number.</span>);
    } else {
      setFeedback(<span className="text-red-600">Too high! Try a lower number.</span>);
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
            <div className="text-lg mt-1 min-h-[5em] flex items-center justify-center">{feedback}</div>
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
            <div className="text-lg font-medium min-h-[1.5em] flex items-center justify-center">
              {feedback}
            </div>
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
