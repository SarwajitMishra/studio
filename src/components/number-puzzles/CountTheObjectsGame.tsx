
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sigma, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle, Apple, Star, Heart, Smile, Cloud, Sun, HelpCircle, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { updateGameStats } from "@/lib/progress";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";


const QUESTIONS_PER_ROUND = 5;

const DIFFICULTY_CONFIG = {
    easy: { min: 2, max: 8 },
    medium: { min: 5, max: 15 },
    hard: { min: 10, max: 25 },
};

const OBJECT_ICONS: { name: string; Icon: LucideIcon; color: string }[] = [
  { name: "Apple", Icon: Apple, color: "text-red-500" },
  { name: "Star", Icon: Star, color: "text-yellow-400" },
  { name: "Heart", Icon: Heart, color: "text-pink-500" },
  { name: "Smiley Face", Icon: Smile, color: "text-blue-500" },
  { name: "Cloud", Icon: Cloud, color: "text-sky-500" },
  { name: "Sun", Icon: Sun, color: "text-orange-400" },
];

interface CountTheObjectsProblem {
  id: string;
  ObjectIcon: LucideIcon;
  iconName: string;
  iconColor: string;
  count: number;
}

interface CountTheObjectsGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

export default function CountTheObjectsGame({ onBack, difficulty }: CountTheObjectsGameProps) {
  const [currentProblem, setCurrentProblem] = useState<CountTheObjectsProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRoundOver, setIsRoundOver] = useState<boolean>(false);
  const { toast } = useToast();
  const [allIconsUsed, setAllIconsUsed] = useState<boolean>(false);
  
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

  const sessionKey = `usedCountIcons_${difficulty}`;

  const getUsedIconsFromSession = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = sessionStorage.getItem(sessionKey);
    return stored ? JSON.parse(stored) : [];
  };

  const addUsedIconToSession = (iconName: string) => {
    if (typeof window === 'undefined') return;
    const currentIcons = getUsedIconsFromSession();
    const newIcons = [...currentIcons, iconName];
    sessionStorage.setItem(sessionKey, JSON.stringify(newIcons));
  };

  const resetSessionHistory = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(sessionKey);
    }
  };
  
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <Star key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const calculateStars = (score: number, maxScore: number): number => {
      const percentage = (score / maxScore) * 100;
      if (percentage === 100) return 3;
      if (percentage >= 80) return 2;
      if (percentage >= 50) return 1;
      return 0;
  };
  
  const handleGameOver = useCallback(async (finalScore: number) => {
    setIsRoundOver(true);
    setIsCalculatingReward(true);
    const didWin = finalScore === QUESTIONS_PER_ROUND;
    updateGameStats({ gameId: 'countTheObjects', didWin, score: finalScore * 100 });
    
    try {
        const rewards = await calculateRewards({
            gameId: 'countTheObjects',
            difficulty,
            performanceMetrics: { score: finalScore, maxScore: QUESTIONS_PER_ROUND }
        });
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Count The Objects (${difficulty})`);
        const stars = calculateStars(finalScore, QUESTIONS_PER_ROUND);
        setLastReward({ points: earned.points, coins: earned.coins, stars });
    } catch (error) {
        console.error("Reward calculation failed:", error);
        toast({ variant: 'destructive', title: 'Reward Error' });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [difficulty, toast]);

  const loadNewProblem = useCallback(() => {
    const usedIcons = getUsedIconsFromSession();
    let availableIcons = OBJECT_ICONS.filter(icon => !usedIcons.includes(icon.name));
    
    if (availableIcons.length === 0 && OBJECT_ICONS.length > 0) {
      setAllIconsUsed(true); // Mark that we've used all icons once
      resetSessionHistory(); // Reset history for the next round
      availableIcons = OBJECT_ICONS; // Use all icons again
    }

    const selectedObject = availableIcons[Math.floor(Math.random() * availableIcons.length)];
    addUsedIconToSession(selectedObject.name);

    const config = DIFFICULTY_CONFIG[difficulty];
    const count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;

    setCurrentProblem({
      id: `cto-${Date.now()}-${Math.random()}`,
      ObjectIcon: selectedObject.Icon,
      iconName: selectedObject.name,
      iconColor: selectedObject.color,
      count,
    });
    setUserAnswer("");
    setFeedback(null);
  }, [difficulty]);

  const startNewRound = useCallback(() => {
    if (questionsAnswered > 0 && !isRoundOver) {
        updateGameStats({ gameId: 'countTheObjects', didWin: false, score: score * 100 });
    }
    setScore(0);
    setQuestionsAnswered(0);
    setIsRoundOver(false);
    setAllIconsUsed(false);
    setFeedback(null);
    setLastReward(null);
    setIsCalculatingReward(false);
    resetSessionHistory();
    loadNewProblem();
  }, [loadNewProblem, questionsAnswered, isRoundOver, score]);
  
  useEffect(() => {
    startNewRound();
  }, [difficulty, startNewRound]);


  const handleSubmitAnswer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProblem || isRoundOver || feedback) return;

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback("Please enter a valid number.");
      toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
      return;
    }

    const isCorrect = answerNum === currentProblem.count;

    setFeedback(isCorrect ? "Correct!" : `Not quite. There were ${currentProblem.count} ${currentProblem.iconName.toLowerCase()}s.`);

    if (isCorrect) {
      setScore(prev => prev + 1);
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct count was ${currentProblem.count}.` });
    }
    
    setTimeout(() => {
        setQuestionsAnswered(prev => {
            const newTotalAnswered = prev + 1;
            if (newTotalAnswered >= QUESTIONS_PER_ROUND) {
                const finalScore = score + (isCorrect ? 1 : 0);
                handleGameOver(finalScore);
                setFeedback(`Round Over! Final Score: ${finalScore}/${QUESTIONS_PER_ROUND}`);
                setCurrentProblem(null);
            } else {
                loadNewProblem();
            }
            return newTotalAnswered;
        });
    }, isCorrect ? 1500 : 3000);
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
                    Final Score: {score}/{QUESTIONS_PER_ROUND}
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
                <h2 className="text-2xl font-bold text-pink-700">Round Over!</h2>
                <p className="text-lg text-pink-600 mt-1">{feedback || `Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
             </div>
        )}
        <Button onClick={() => startNewRound()} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isCalculatingReward}>
          <RotateCcw className="mr-2 h-5 w-5" /> Play Again
        </Button>
      </div>
  );

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sigma size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Count the Objects</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          Question: {Math.min(questionsAnswered + 1, QUESTIONS_PER_ROUND)}/{QUESTIONS_PER_ROUND} | Score: {score} | Difficulty: <span className="capitalize">{difficulty}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isRoundOver ? (
          renderGameOverView()
        ) : currentProblem ? (
          <>
            <div className="text-center p-4 bg-muted rounded-lg min-h-[150px] flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {Array.from({ length: currentProblem.count }).map((_, index) => (
                <currentProblem.ObjectIcon
                  key={index}
                  size={32}
                  className={cn("transition-transform duration-200 hover:scale-110", currentProblem.iconColor)}
                  aria-hidden="true"
                />
              ))}
            </div>
             <p className="text-center text-lg font-medium mt-2">
                How many <span className={cn("font-bold", currentProblem.iconColor)}>{currentProblem.iconName.toLowerCase()}s</span> do you see?
            </p>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <Label htmlFor="countAnswer" className="text-base font-medium flex items-center mb-1">
                  <Hash className="mr-2 h-5 w-5 text-muted-foreground" /> Your Count:
                </Label>
                <Input
                  id="countAnswer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your count"
                  className="text-base"
                  disabled={!!feedback}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={!!feedback || !userAnswer.trim()}>
                Submit Answer
              </Button>
            </form>
            {feedback && !isRoundOver && (
              <div className={cn(
                "mt-4 p-3 rounded-md text-center font-medium flex items-center justify-center",
                feedback.startsWith("Correct") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                 {feedback.startsWith("Correct") ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                {feedback}
              </div>
            )}
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
