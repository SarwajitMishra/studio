
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";
import { updateGameStats } from "@/lib/progress";

const QUESTIONS_PER_ROUND = 5;
const SEQUENCE_LENGTH = 5; 

const DIFFICULTY_CONFIG = {
    easy: { startRange: 10, diffRange: 3 },
    medium: { startRange: 20, diffRange: 5 },
    hard: { startRange: 50, diffRange: 10 },
};

interface MissingNumberProblem {
  id: string;
  displaySequence: (number | string)[]; 
  answer: number;
  description?: string; 
}

interface MissingNumberGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

export default function MissingNumberGame({ onBack, difficulty }: MissingNumberGameProps) {
  const [currentProblem, setCurrentProblem] = useState<MissingNumberProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const { toast } = useToast();

  const generateProblem = useCallback((): MissingNumberProblem => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const start = Math.floor(Math.random() * config.startRange) + 1;
    let diff = Math.floor(Math.random() * config.diffRange) + 1;
    if (Math.random() < 0.4) diff *= -1; // 40% chance of decreasing sequence

    const fullSequence: number[] = [];
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
      fullSequence.push(start + i * diff);
    }

    const missingIndex = Math.floor(Math.random() * (SEQUENCE_LENGTH - 2)) + 1;
    const answer = fullSequence[missingIndex];

    const displaySequence = fullSequence.map((num, idx) =>
      idx === missingIndex ? "_" : num
    );
    
    let description = diff > 0 
      ? `The numbers are increasing by ${diff}.`
      : `The numbers are decreasing by ${Math.abs(diff)}.`;

    return {
      id: `mn-${Date.now()}-${Math.random()}`,
      displaySequence,
      answer,
      description,
    };
  }, [difficulty]);

  const loadNewProblem = useCallback(() => {
    const newProblem = generateProblem();
    setCurrentProblem(newProblem);
    setUserAnswer("");
    setFeedback(null);
  }, [generateProblem]);

  const resetGame = useCallback(() => {
    if (questionsAnswered > 0 && !isGameOver) {
        updateGameStats({ gameId: 'missingNumber', didWin: false, score: score * 100 });
    }
    setScore(0);
    setQuestionsAnswered(0);
    setIsGameOver(false);
    loadNewProblem();
  }, [loadNewProblem, questionsAnswered, isGameOver, score]);

  useEffect(() => {
    resetGame();
  }, [resetGame, difficulty]);

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
    let currentFeedbackMsg = "";

    if (isCorrect) {
      setScore(prev => prev + 1);
      currentFeedbackMsg = "Correct!";
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      currentFeedbackMsg = `Not quite. The missing number was ${currentProblem.answer}. ${currentProblem.description || ''}`;
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct answer was ${currentProblem.answer}.` });
    }
    
    setFeedback(currentFeedbackMsg);
    const newQuestionsAnswered = questionsAnswered + 1;

    setTimeout(() => {
      setQuestionsAnswered(newQuestionsAnswered);
      if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
        setIsGameOver(true);
        const finalScore = isCorrect ? score + 1 : score;
        const didWin = finalScore === QUESTIONS_PER_ROUND;
        updateGameStats({ gameId: 'missingNumber', didWin, score: finalScore * 100 });
        setFeedback(isCorrect ? `Correct! Final Score: ${finalScore}/${QUESTIONS_PER_ROUND}` : `Not quite. The missing number was ${currentProblem.answer}. ${currentProblem.description || ''} Final Score: ${finalScore}/${QUESTIONS_PER_ROUND}`);
      } else {
        loadNewProblem();
      }
    }, isCorrect ? 1500 : 3000);
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Missing Number</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          Find the missing number. Score: {score}/{QUESTIONS_PER_ROUND} | Difficulty: <span className="capitalize">{difficulty}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGameOver ? (
          <div className="text-center p-6 bg-orange-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-orange-700">Round Over!</h2>
            <p className="text-lg text-orange-600 mt-1">{feedback || `Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </div>
        ) : currentProblem && (
          <>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-foreground tracking-wider">
                {currentProblem.displaySequence.map((item, index) => (
                  <span key={index}>
                    {item === "_" ? <span className="text-destructive font-black mx-1">_</span> : item}
                    {index < currentProblem.displaySequence.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
              {currentProblem.description && !feedback && (
                 <p className="text-sm text-muted-foreground mt-2">Hint: Look at the pattern!</p>
              )}
            </div>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <Label htmlFor="missingNumberAnswer" className="text-base font-medium flex items-center mb-1">
                  <Hash className="mr-2 h-5 w-5 text-muted-foreground" /> Missing Number:
                </Label>
                <Input
                  id="missingNumberAnswer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter the number"
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
