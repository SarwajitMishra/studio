
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListOrdered, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const QUESTIONS_PER_ROUND = 5;

interface SequenceProblem {
  id: string;
  sequence: number[]; 
  nextNumber: number; 
  description?: string; 
}

const SAMPLE_SEQUENCES: SequenceProblem[] = [
  { id: "s1", sequence: [2, 4, 6, 8], nextNumber: 10, description: "Add 2 to each number." },
  { id: "s2", sequence: [1, 3, 5, 7], nextNumber: 9, description: "Add 2 to each number (odd numbers)." },
  { id: "s3", sequence: [5, 10, 15, 20], nextNumber: 25, description: "Multiples of 5." },
  { id: "s4", sequence: [10, 9, 8, 7], nextNumber: 6, description: "Subtract 1 from each number." },
  { id: "s5", sequence: [3, 6, 9, 12], nextNumber: 15, description: "Multiples of 3." },
  { id: "s6", sequence: [1, 2, 4, 8], nextNumber: 16, description: "Multiply by 2 each time (powers of 2 starting from 2^0)." },
  { id: "s7", sequence: [1, 4, 9, 16], nextNumber: 25, description: "Square numbers (1x1, 2x2, 3x3...)." },
];

interface NumberSequenceGameProps {
  onBack: () => void;
}

export default function NumberSequenceGame({ onBack }: NumberSequenceGameProps) {
  const [currentSequence, setCurrentSequence] = useState<SequenceProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [usedSequenceIds, setUsedSequenceIds] = useState<string[]>([]);
  const { toast } = useToast();

  const loadNewSequence = useCallback(() => {
    let availableSequences = SAMPLE_SEQUENCES.filter(s => !usedSequenceIds.includes(s.id));
    if (availableSequences.length === 0) {
      setUsedSequenceIds([]); // Reset used IDs if all have been shown
      availableSequences = SAMPLE_SEQUENCES; 
    }
    const randomIndex = Math.floor(Math.random() * availableSequences.length);
    const newSequence = availableSequences[randomIndex];
    setCurrentSequence(newSequence);
    setUsedSequenceIds(prev => [...prev, newSequence.id]);
    setUserAnswer("");
    setFeedback(null);
  }, [usedSequenceIds]);

  const resetGame = useCallback(() => {
    setScore(0);
    setQuestionsAnswered(0);
    setIsGameOver(false);
    setUsedSequenceIds([]);
    loadNewSequence();
  }, [loadNewSequence]);

  useEffect(() => { 
    resetGame();
  }, [resetGame]);

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
          Find the next number in the sequence. Score: {score}/{QUESTIONS_PER_ROUND}
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

