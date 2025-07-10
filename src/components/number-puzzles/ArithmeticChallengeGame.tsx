
"use client";

import { useState, useEffect, useCallback, FormEvent, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, RotateCcw, Award, ArrowLeft, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { updateGameStats } from "@/lib/progress";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";

const QUESTIONS_PER_ROUND = 10;

type Operator = "+" | "-" | "*" | "/";

const DIFFICULTY_CONFIG: Record<Difficulty, { operators: Operator[], maxNum: number }> = {
    easy: { operators: ["+", "-"], maxNum: 20 },
    medium: { operators: ["+", "-", "*", "/"], maxNum: 50 },
    hard: { operators: ["+", "-", "*", "/"], maxNum: 100 },
};

interface ArithmeticProblem {
  problemString: string;
  answer: number;
}

interface ArithmeticChallengeGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

export default function ArithmeticChallengeGame({ onBack, difficulty }: ArithmeticChallengeGameProps) {
  const [gameState, setGameState] = useState<"playing" | "answered" | "gameOver">("playing");
  const [currentProblem, setCurrentProblem] = useState<ArithmeticProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

  const { toast } = useToast();

  const generateProblem = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const operator = config.operators[Math.floor(Math.random() * config.operators.length)];

    let num1 = Math.floor(Math.random() * config.maxNum) + 1;
    let num2 = Math.floor(Math.random() * config.maxNum) + 1;
    let answer: number;

    switch (operator) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive result
        answer = num1 - num2;
        break;
      case "*":
        num1 = Math.floor(Math.random() * 10) + 2; // Keep multiplication manageable
        num2 = Math.floor(Math.random() * 10) + 2;
        answer = num1 * num2;
        break;
      case "/":
        num2 = Math.floor(Math.random() * 10) + 2; // Divisor
        answer = Math.floor(Math.random() * 10) + 2; // Result
        num1 = num2 * answer; // Ensure whole number division
        break;
    }

    setCurrentProblem({
      problemString: `${num1} ${operator} ${num2} = ?`,
      answer,
    });
  }, [difficulty]);
  
  const startNewGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setQuestionsAnswered(0);
    setUserAnswer("");
    setLastReward(null);
    setIsCalculatingReward(false);
    generateProblem();
  }, [generateProblem]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const calculateStars = (finalScore: number): number => {
    const percentage = (finalScore / QUESTIONS_PER_ROUND) * 100;
    if (percentage === 100) return 3;
    if (percentage >= 80) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };

  const handleGameOver = useCallback(async (finalScore: number) => {
    setIsCalculatingReward(true);
    updateGameStats({ gameId: 'arithmeticChallenge', didWin: finalScore === QUESTIONS_PER_ROUND, score: finalScore });

    try {
      const rewards = await calculateRewards({
        gameId: 'arithmeticChallenge',
        difficulty,
        performanceMetrics: { score: finalScore, maxScore: QUESTIONS_PER_ROUND }
      });
      const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Arithmetic Challenge (${difficulty})`);
      const stars = calculateStars(finalScore);
      setLastReward({ points: earned.points, coins: earned.coins, stars });
    } catch (error) {
      console.error("Reward calculation failed:", error);
      toast({ variant: 'destructive', title: 'Reward Error' });
    } finally {
      setIsCalculatingReward(false);
    }
  }, [difficulty, toast]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (gameState !== "playing" || !currentProblem) return;

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a number." });
      return;
    }

    setGameState("answered");
    const isCorrect = answerNum === currentProblem.answer;

    if (isCorrect) {
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
      setScore(prev => prev + 1);
    } else {
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct answer was ${currentProblem.answer}.` });
    }

    setTimeout(() => {
      const newQuestionsAnswered = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsAnswered);

      if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
        setGameState("gameOver");
        const finalScore = isCorrect ? score + 1 : score;
        handleGameOver(finalScore);
      } else {
        setUserAnswer("");
        setGameState("playing");
        generateProblem();
      }
    }, isCorrect ? 1000 : 2000);
  };
  
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <Star key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const renderGameContent = () => {
    if (gameState === "gameOver") {
      return (
        <div className="text-center p-6 bg-blue-100 rounded-lg shadow-inner">
          {isCalculatingReward ? (
            <div className="flex flex-col items-center justify-center gap-2 pt-4 min-h-[150px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
            </div>
          ) : lastReward ? (
            <div className="flex flex-col items-center gap-3 text-center min-h-[150px]">
              <StarRating rating={lastReward.stars} />
              <p className="text-xl font-semibold text-accent mt-2">Final Score: {score}/{QUESTIONS_PER_ROUND}</p>
              <div className="flex items-center gap-6 mt-1">
                <span className="flex items-center font-bold text-xl">+{lastReward.points} <SPointsIcon className="ml-1.5 h-6 w-6 text-yellow-400" /></span>
                <span className="flex items-center font-bold text-xl">+{lastReward.coins} <SCoinsIcon className="ml-1.5 h-6 w-6 text-amber-500" /></span>
              </div>
            </div>
          ) : (
            <div className="min-h-[150px]">
              <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
              <h2 className="text-2xl font-bold text-blue-700">Round Over!</h2>
              <p className="text-lg text-blue-600 mt-1">Your final score is {score}/{QUESTIONS_PER_ROUND}.</p>
            </div>
          )}
          <Button onClick={startNewGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isCalculatingReward}>
            <RotateCcw className="mr-2 h-5 w-5" /> Play Again
          </Button>
        </div>
      );
    }
    
    if (!currentProblem) {
        return <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-4xl font-bold text-foreground tracking-wider">{currentProblem.problemString}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="arithmeticAnswer" className="text-base font-medium">Your Answer:</Label>
          <Input
            id="arithmeticAnswer"
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter your answer"
            className="text-lg text-center h-12"
            disabled={gameState !== "playing"}
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full text-lg" disabled={gameState !== "playing" || !userAnswer.trim()}>
          Submit
        </Button>
      </form>
    );
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calculator size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Arithmetic Challenge</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          Question: {Math.min(questionsAnswered + 1, QUESTIONS_PER_ROUND)}/{QUESTIONS_PER_ROUND} | Score: {score} | Difficulty: <span className="capitalize">{difficulty}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {renderGameContent()}
      </CardContent>
    </Card>
  );
}
