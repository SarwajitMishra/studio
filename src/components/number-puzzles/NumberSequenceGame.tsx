
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListOrdered, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";

const QUESTIONS_PER_ROUND = 5;

interface SequenceProblem {
  id: string;
  sequence: number[]; 
  nextNumber: number; 
  description?: string; 
}

interface NumberSequenceGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const generateSequenceProblem = (difficulty: Difficulty): SequenceProblem => {
    let start = 1, diff = 2, length = 4;
    let description = "Add 2 to each number.";
    const type = Math.random();

    switch (difficulty) {
        case 'easy':
            start = Math.floor(Math.random() * 10) + 1;
            diff = Math.floor(Math.random() * 3) + 2; // 2, 3, 4
            description = `Add ${diff} to each number.`;
            break;
        case 'medium':
            start = Math.floor(Math.random() * 20);
            if (type > 0.5) { // Subtraction
                diff = (Math.floor(Math.random() * 4) + 2) * -1; // -2, -3, -4, -5
                description = `Subtract ${Math.abs(diff)} from each number.`;
            } else { // Addition
                diff = Math.floor(Math.random() * 5) + 3; // 3, 4, 5, 6, 7
                description = `Add ${diff} to each number.`;
            }
            break;
        case 'hard':
            length = 5;
            start = Math.floor(Math.random() * 10);
            if (type > 0.6) { // Geometric
                diff = Math.floor(Math.random() * 2) + 2; // 2 or 3
                let seq = [start];
                for (let i = 1; i < length; i++) seq.push(seq[i-1] * diff);
                description = `Multiply by ${diff} each time.`
                return { id: `g-${Date.now()}`, sequence: seq.slice(0, length - 1), nextNumber: seq[length-1], description };
            } else { // Complex Arithmetic
                diff = Math.floor(Math.random() * 10) + 5;
                if (Math.random() > 0.5) diff *= -1;
                description = diff > 0 ? `Add ${diff}.` : `Subtract ${Math.abs(diff)}.`;
            }
            break;
    }

    const sequence = Array.from({length: length - 1}, (_, i) => start + i * diff);
    const nextNumber = start + (length-1) * diff;

    return { id: `a-${Date.now()}`, sequence, nextNumber, description };
};


export default function NumberSequenceGame({ onBack, difficulty }: NumberSequenceGameProps) {
  const [currentSequence, setCurrentSequence] = useState<SequenceProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const { toast } = useToast();

  const loadNewSequence = useCallback(() => {
    const newSequence = generateSequenceProblem(difficulty);
    setCurrentSequence(newSequence);
    setUserAnswer("");
    setFeedback(null);
  }, [difficulty]);

  const resetGame = useCallback(() => {
    setScore(0);
    setQuestionsAnswered(0);
    setIsGameOver(false);
    loadNewSequence();
  }, [loadNewSequence]);

  useEffect(() => { 
    resetGame();
  }, [resetGame, difficulty]);

  const handleSubmitAnswer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSequence || isGameOver || feedback) return;

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback("Please enter a valid number.");
      toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
      return;
    }

    const isCorrect = answerNum === currentSequence.nextNumber;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback("Correct!");
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      setFeedback(`Not quite. The next number was ${currentSequence.nextNumber}. ${currentSequence.description || ''}`);
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct answer was ${currentSequence.nextNumber}.` });
    }

    const newQuestionsAnswered = questionsAnswered + 1;

    setTimeout(() => {
      setQuestionsAnswered(newQuestionsAnswered);
      if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
        setIsGameOver(true);
        setFeedback(isCorrect ? `Correct! Final Score: ${score + 1}/${QUESTIONS_PER_ROUND}` : `Not quite. The next number was ${currentSequence.nextNumber}. ${currentSequence.description || ''} Final Score: ${score}/${QUESTIONS_PER_ROUND}`);
      } else {
        loadNewSequence();
      }
    }, isCorrect ? 1500 : 3000);
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ListOrdered size={28} className="text-primary" />
            <CardTitle className="text-2xl font-bold text-primary">Number Sequence</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>
        <CardDescription className="text-center text-md text-foreground/80 pt-2">
          Find the next number. Score: {score}/{QUESTIONS_PER_ROUND} | Difficulty: <span className="capitalize">{difficulty}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGameOver ? (
          <div className="text-center p-6 bg-purple-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-purple-700">Round Over!</h2>
            <p className="text-lg text-purple-600 mt-1">{feedback || `Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </div>
        ) : currentSequence && (
          <>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-foreground tracking-wider">
                {currentSequence.sequence.join(", ")} , <span className="text-destructive">?</span>
              </p>
              {currentSequence.description && !feedback && (
                 <p className="text-sm text-muted-foreground mt-2">Hint: {currentSequence.description}</p>
              )}
            </div>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <Label htmlFor="sequenceAnswer" className="text-base font-medium flex items-center mb-1">
                  <Hash className="mr-2 h-5 w-5 text-muted-foreground" /> Next Number:
                </Label>
                <Input
                  id="sequenceAnswer"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter the next number"
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
