
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, RotateCw, Award, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";

const GAME_DURATION_S = 60;
const GRID_SIZE = 9;

const DIFFICULTY_CONFIG = {
  easy: { maxNum: 10, operators: ["+"] },
  medium: { maxNum: 15, operators: ["+", "-"] },
  hard: { maxNum: 10, operators: ["+", "-", "*"] },
};

interface FastMathProblem {
  problemString: string;
  answer: number;
  options: number[];
}

interface FastMathGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function FastMathGame({ onBack, difficulty }: FastMathGameProps) {
  const [problem, setProblem] = useState<FastMathProblem | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const { toast } = useToast();
  
  const generateProblem = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const operator = config.operators[Math.floor(Math.random() * config.operators.length)];
    let num1 = Math.floor(Math.random() * config.maxNum) + 1;
    let num2 = Math.floor(Math.random() * config.maxNum) + 1;
    let answer;

    if (operator === "-") {
      if (num1 < num2) [num1, num2] = [num2, num1];
      answer = num1 - num2;
    } else if (operator === "*") {
      num1 = Math.floor(Math.random() * 9) + 2; // 2-10
      num2 = Math.floor(Math.random() * 9) + 2; // 2-10
      answer = num1 * num2;
    } else {
      answer = num1 + num2;
    }

    const problemString = `${num1} ${operator} ${num2} = ?`;
    const options = new Set<number>([answer]);
    while (options.size < GRID_SIZE) {
        const wrongAnswer = answer + (Math.floor(Math.random() * 21) - 10); // -10 to +10 offset
        if (wrongAnswer !== answer && wrongAnswer >= 0) {
            options.add(wrongAnswer);
        }
    }

    setProblem({ problemString, answer, options: shuffleArray(Array.from(options)) });
    setFeedback(null);
  }, [difficulty]);

  const resetGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION_S);
    setIsGameOver(false);
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
      setIsGameOver(true);
      updateGameStats({ gameId: 'mathDuel', didWin: score > 0, score });
    }
  }, [timeLeft, isGameOver, score]);

  const handleAnswerClick = (selectedAnswer: number) => {
    if (feedback) return;
    
    if (selectedAnswer === problem?.answer) {
      setScore(s => s + 1);
      setFeedback("correct");
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      setScore(s => Math.max(0, s - 1)); // Penalty for wrong answer
      setFeedback("incorrect");
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct answer was ${problem?.answer}` });
    }
    
    setTimeout(() => {
      generateProblem();
    }, 500);
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Swords size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Fast Math</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          Solve as many problems as you can in {GAME_DURATION_S} seconds!
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Score: {score}</span>
          <span>Time Left: {timeLeft}s</span>
        </div>
        <Progress value={(timeLeft / GAME_DURATION_S) * 100} className="w-full" />
        
        {isGameOver ? (
          <div className="text-center p-6 bg-blue-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-blue-700">Time's Up!</h2>
            <p className="text-lg text-blue-600 mt-1">Your final score is {score}.</p>
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </div>
        ) : problem && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-4xl font-bold text-foreground tracking-widest">{problem.problemString}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {problem.options.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  onClick={() => handleAnswerClick(option)}
                  className={cn("h-16 text-2xl font-bold",
                    feedback === 'correct' && option === problem.answer && 'bg-green-500 text-white',
                    feedback === 'incorrect' && option === problem.answer && 'bg-red-500 text-white animate-pulse'
                  )}
                  disabled={!!feedback}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
