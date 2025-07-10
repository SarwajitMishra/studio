
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Eye, Hash, RotateCw, Award, ArrowLeft, Loader2, Star as StarIcon, Rock, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { updateGameStats } from "@/lib/progress";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";

const GAME_DURATION_S = 60;

const DIFFICULTY_CONFIG: Record<Difficulty, { gridSize: number, maxTarget: number, maxDistractors: number }> = {
    easy: { gridSize: 8, maxTarget: 10, maxDistractors: 15 },
    medium: { gridSize: 10, maxTarget: 15, maxDistractors: 30 },
    hard: { gridSize: 12, maxTarget: 20, maxDistractors: 50 },
};

const TARGET_ICONS: { name: string; Icon: LucideIcon; color: string }[] = [
  { name: "Star", Icon: StarIcon, color: "text-yellow-400" },
  { name: "Sprout", Icon: Sprout, color: "text-green-500" },
];

const DISTRACTOR_ICONS: { name: string; Icon: LucideIcon; color: string }[] = [
    { name: "Rock", Icon: Rock, color: "text-gray-400" },
];

interface Problem {
  id: string;
  grid: { Icon: LucideIcon; color: string; rotation: number }[];
  target: { name: string; Icon: LucideIcon; color: string; count: number };
}

interface CountGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

export default function CountTheObjectsGame({ onBack, difficulty }: CountGameProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const { toast } = useToast();
  
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

  const generateProblem = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const targetIcon = TARGET_ICONS[Math.floor(Math.random() * TARGET_ICONS.length)];
    const distractorIcon = DISTRACTOR_ICONS[0];

    const targetCount = Math.floor(Math.random() * (config.maxTarget - 5 + 1)) + 5;
    const distractorCount = Math.floor(Math.random() * (config.maxDistractors - 10 + 1)) + 10;
    
    const gridItems = [
      ...Array(targetCount).fill(0).map(() => ({ ...targetIcon, rotation: Math.random() * 360 })),
      ...Array(distractorCount).fill(0).map(() => ({ ...distractorIcon, rotation: Math.random() * 360 }))
    ];

    // Shuffle the items for random placement
    for (let i = gridItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gridItems[i], gridItems[j]] = [gridItems[j], gridItems[i]];
    }

    setProblem({
      id: `problem-${Date.now()}`,
      grid: gridItems,
      target: { ...targetIcon, count: targetCount },
    });
    setUserAnswer("");
    setFeedback(null);
  }, [difficulty]);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const calculateStars = (finalScore: number): number => {
    const thresholds: Record<Difficulty, {oneStar: number, twoStars: number, threeStars: number}> = {
      easy: { oneStar: 5, twoStars: 8, threeStars: 12 },
      medium: { oneStar: 4, twoStars: 7, threeStars: 10 },
      hard: { oneStar: 3, twoStars: 5, threeStars: 8 },
    };
    const { oneStar, twoStars, threeStars } = thresholds[difficulty];
    if (finalScore >= threeStars) return 3;
    if (finalScore >= twoStars) return 2;
    if (finalScore >= oneStar) return 1;
    return 0;
  };
  
  const handleGameOver = useCallback(async (finalScore: number) => {
    setIsGameOver(true);
    setIsCalculatingReward(true);
    updateGameStats({ gameId: 'countTheObjects', didWin: finalScore > 0, score: finalScore });
    
    try {
        const rewards = await calculateRewards({
            gameId: 'countTheObjects',
            difficulty,
            performanceMetrics: { score: finalScore }
        });
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Count Me If You Can (${difficulty})`);
        const stars = calculateStars(finalScore);
        setLastReward({ points: earned.points, coins: earned.coins, stars });
    } catch (error) {
        console.error("Reward calculation failed:", error);
        toast({ variant: 'destructive', title: 'Reward Error' });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [difficulty, toast, calculateStars]);

  const resetGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION_S);
    setIsGameOver(false);
    setLastReward(null);
    setIsCalculatingReward(false);
    generateProblem();
  }, [generateProblem]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0 && !isGameOver) {
      handleGameOver(score);
    }
  }, [timeLeft, isGameOver, score, handleGameOver]);

  const handleSubmitAnswer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!problem || feedback) return;

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
      return;
    }

    if (answerNum === problem.target.count) {
      setScore(s => s + 1);
      setFeedback("correct");
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      setScore(s => Math.max(0, s - 1)); // Penalty for wrong answer
      setFeedback("incorrect");
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct count was ${problem.target.count}.` });
    }

    setTimeout(() => {
      generateProblem();
    }, 1000);
  };
  
  const renderGameOverView = () => (
     <div className="text-center p-6 bg-pink-100 rounded-lg shadow-inner">
        {isCalculatingReward ? (
            <div className="flex flex-col items-center justify-center gap-2 pt-4 min-h-[150px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
            </div>
        ) : lastReward ? (
            <div className="flex flex-col items-center gap-3 text-center min-h-[150px]">
                <StarRating rating={lastReward.stars} />
                <p className="text-xl font-semibold text-accent mt-2">
                    Final Score: {score}
                </p>
                <div className="flex items-center gap-6 mt-1">
                    <span className="flex items-center font-bold text-xl">
                        +{lastReward.points} <SPointsIcon className="ml-1.5 h-6 w-6 text-yellow-400" />
                    </span>
                    <span className="flex items-center font-bold text-xl">
                        +{lastReward.coins} <SCoinsIcon className="ml-1.5 h-6 w-6 text-amber-500" />
                    </span>
                </div>
            </div>
        ) : (
             <div className="min-h-[150px]">
                <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
                <h2 className="text-2xl font-bold text-pink-700">Time's Up!</h2>
                <p className="text-lg text-pink-600 mt-1">{`Your final score is ${score}.`}</p>
             </div>
        )}
        <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isCalculatingReward}>
          <RotateCw className="mr-2 h-5 w-5" /> Play Again
        </Button>
      </div>
  );

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Count me if you can</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
            <span>Score: {score}</span>
            <span>Difficulty: <span className="capitalize">{difficulty}</span></span>
        </CardDescription>
        <Progress value={(timeLeft / GAME_DURATION_S) * 100} className="w-full mt-2" />
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {isGameOver ? renderGameOverView() : problem ? (
          <>
            <p className="text-center text-lg font-medium">
                How many <strong className={cn("inline-flex items-center gap-1", problem.target.color)}>
                    <problem.target.Icon size={24}/> {problem.target.name.toLowerCase()}s
                </strong> do you see?
            </p>
            <div className={cn("relative p-4 border rounded-lg bg-muted/50 h-64 overflow-hidden",
                feedback === 'correct' && 'border-green-500 ring-4 ring-green-500/20',
                feedback === 'incorrect' && 'border-red-500 ring-4 ring-red-500/20'
            )}>
                {problem.grid.map((item, index) => (
                    <item.Icon 
                        key={`${problem.id}-${index}`} 
                        className={cn("absolute", item.color)} 
                        size={Math.random() * (35-20) + 20}
                        style={{
                            top: `${Math.random()*90}%`,
                            left: `${Math.random()*90}%`,
                            transform: `rotate(${item.rotation}deg)`
                        }}
                    />
                ))}
            </div>
            <form onSubmit={handleSubmitAnswer} className="flex items-end gap-2">
                <div className="flex-grow">
                    <Label htmlFor="countAnswer" className="text-sm text-muted-foreground">Your Count</Label>
                    <Input
                      id="countAnswer"
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Enter count"
                      className="text-lg h-12"
                      disabled={!!feedback}
                      autoFocus
                    />
                </div>
                <Button type="submit" className="h-12 text-lg" disabled={!!feedback || !userAnswer.trim()}>
                    Submit
                </Button>
            </form>
          </>
        ) : (
            <div className="text-center p-6 flex flex-col items-center justify-center min-h-[250px]">
                <Loader2 size={48} className="mx-auto text-primary/50 mb-4 animate-spin"/>
                <p className="text-lg text-muted-foreground">Loading puzzle...</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
