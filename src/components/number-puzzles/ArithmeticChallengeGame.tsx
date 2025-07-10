
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { updateGameStats } from "@/lib/progress";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from "@/lib/constants";
import { applyRewards, calculateRewards } from "@/lib/rewards";

const QUESTIONS_PER_ROUND = 10;

const DIFFICULTY_CONFIG = {
    easy: { maxNum: 10, operators: ["+"] },
    medium: { maxNum: 25, operators: ["+", "-"] },
    hard: { maxNum: 50, operators: ["+", "-"] },
};

interface ArithmeticProblem {
  num1: number;
  num2: number;
  operator: "+" | "-";
  answer: number;
  problemString: string;
}

interface ArithmeticChallengeGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

export default function ArithmeticChallengeGame({ onBack, difficulty }: ArithmeticChallengeGameProps) {
  const [currentProblem, setCurrentProblem] = useState<ArithmeticProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const { toast } = useToast();
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

  const generateProblem = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    let num1 = Math.floor(Math.random() * config.maxNum) + 1;
    let num2 = Math.floor(Math.random() * config.maxNum) + 1;
    const operator = config.operators[Math.floor(Math.random() * config.operators.length)] as "+" | "-";
    let answer: number;
    let problemString: string;

    if (operator === "-") {
      if (num1 < num2) { 
        [num2, num1] = [num1, num2]; 
      }
      answer = num1 - num2;
      problemString = `${num1} - ${num2} = ?`;
    } else {
      answer = num1 + num2;
      problemString = `${num1} + ${num2} = ?`;
    }
    setCurrentProblem({ num1, num2, operator, answer, problemString });
    setUserAnswer("");
    setFeedback(null);
  }, [difficulty]);

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
    setIsGameOver(true);
    setIsCalculatingReward(true);
    const didWin = finalScore === QUESTIONS_PER_ROUND;
    updateGameStats({ gameId: 'arithmeticChallenge', didWin, score: finalScore * 100 });

    try {
        const rewards = await calculateRewards({
            gameId: 'arithmeticChallenge',
            difficulty,
            performanceMetrics: { score: finalScore, maxScore: QUESTIONS_PER_ROUND }
        });
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Arithmetic Challenge (${difficulty})`);
        const stars = calculateStars(finalScore, QUESTIONS_PER_ROUND);
        setLastReward({ points: earned.points, coins: earned.coins, stars });
    } catch (error) {
        console.error("Reward calculation failed:", error);
        toast({ variant: 'destructive', title: 'Reward Error' });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [difficulty, toast]);

  const resetGame = useCallback(() => {
    if (questionsAnswered > 0 && !isGameOver) {
        updateGameStats({ gameId: 'arithmeticChallenge', didWin: false, score: score * 100 });
    }
    setScore(0);
    setQuestionsAnswered(0);
    setIsGameOver(false);
    setLastReward(null);
    setIsCalculatingReward(false);
    generateProblem();
  }, [generateProblem, questionsAnswered, isGameOver, score]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleSubmitAnswer = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProblem || isGameOver || feedback) return;

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback("Please enter a valid number.");
      toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
      return;
    }

    const isCorrect = answerNum === currentProblem.answer;

    setFeedback(isCorrect ? "Correct!" : `Not quite. The answer was ${currentProblem.answer}.`);

    if (isCorrect) {
      setScore(prev => prev + 1);
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct answer was ${currentProblem.answer}.` });
    }

    setTimeout(() => {
      setQuestionsAnswered(prevQuestionsAnswered => {
        const newTotalAnswered = prevQuestionsAnswered + 1;
        
        if (newTotalAnswered >= QUESTIONS_PER_ROUND) {
          // Use a functional update for score here as well to ensure we have the final correct score
          setScore(prevScore => {
            const finalScore = prevScore; // The score has already been updated
            handleGameOver(finalScore);
            setFeedback(`Round Over! Final Score: ${finalScore}/${QUESTIONS_PER_ROUND}`);
            return finalScore;
          });
        } else {
          generateProblem();
        }
        return newTotalAnswered;
      });
    }, isCorrect ? 1000 : 2000);
  }, [currentProblem, userAnswer, isGameOver, feedback, toast, handleGameOver, generateProblem]);
  
  const renderGameOverView = () => (
     <div className="text-center p-6 bg-blue-100 rounded-lg shadow-inner">
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
                <h2 className="text-2xl font-bold text-blue-700">Round Over!</h2>
                <p className="text-lg text-blue-600 mt-1">{feedback || `Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
             </div>
        )}
        <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={isCalculatingReward}>
          <RotateCcw className="mr-2 h-5 w-5" /> Play Again
        </Button>
      </div>
  );

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
      <CardContent className="p-6 space-y-6">
        {isGameOver ? (
          renderGameOverView()
        ) : currentProblem && (
          <>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-foreground">{currentProblem.problemString}</p>
            </div>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <Label htmlFor="arithmeticAnswer" className="text-base font-medium flex items-center mb-1">
                  <Hash className="mr-2 h-5 w-5 text-muted-foreground" /> Your Answer:
                </Label>
                <Input
                  id="arithmeticAnswer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="text-base"
                  disabled={isGameOver || !!feedback}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isGameOver || !!feedback || !userAnswer.trim()}>
                Submit Answer
              </Button>
            </form>
            {feedback && !isGameOver && (
              <div className={cn(
                "mt-4 p-3 rounded-md text-center font-medium flex items-center justify-center",
                feedback.startsWith("Correct") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {feedback.startsWith("Correct") ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                {feedback}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
