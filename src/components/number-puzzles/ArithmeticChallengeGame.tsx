
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";

const QUESTIONS_PER_ROUND = 5;

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

  const resetGame = useCallback(() => {
    setScore(0);
    setQuestionsAnswered(0);
    setIsGameOver(false);
    generateProblem();
  }, [generateProblem]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleSubmitAnswer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProblem || isGameOver || feedback) return; 

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback("Please enter a valid number.");
      toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
      return;
    }

    const isCorrect = answerNum === currentProblem.answer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback("Correct!");
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      setFeedback(`Not quite. The answer was ${currentProblem.answer}.`);
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct answer was ${currentProblem.answer}.` });
    }

    const newQuestionsAnswered = questionsAnswered + 1;
    
    setTimeout(() => {
      setQuestionsAnswered(newQuestionsAnswered);
      if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
        setIsGameOver(true);
        setFeedback(isCorrect ? `Correct! Final Score: ${score + 1}/${QUESTIONS_PER_ROUND}` : `Not quite. The answer was ${currentProblem.answer}. Final Score: ${score}/${QUESTIONS_PER_ROUND}`);
      } else {
        generateProblem();
      }
    }, isCorrect ? 1000 : 2000);
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
          Solve {QUESTIONS_PER_ROUND} math problems. Score: {score}/{QUESTIONS_PER_ROUND} | Difficulty: <span className="capitalize">{difficulty}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGameOver ? (
          <div className="text-center p-6 bg-blue-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-blue-700">Round Over!</h2>
            <p className="text-lg text-blue-600 mt-1">{feedback || `Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </div>
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
