
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sigma, Hash, RotateCcw, Award, ArrowLeft, CheckCircle, XCircle, Apple, Star, Heart, Smile, Cloud, Sun, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Difficulty } from "@/lib/constants";

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
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const { toast } = useToast();

  const [usedIconsInCurrentCycle, setUsedIconsInCurrentCycle] = useState<string[]>([]);

  const generateProblemInternal = useCallback((iconsToExclude: string[]): CountTheObjectsProblem => {
    let R_OBJECT_ICONS = OBJECT_ICONS.filter(icon => !iconsToExclude.includes(icon.name));

    if (R_OBJECT_ICONS.length === 0 && OBJECT_ICONS.length > 0) {
      R_OBJECT_ICONS = OBJECT_ICONS;
    }
    
    if (R_OBJECT_ICONS.length === 0) {
        const fallbackIcon = { name: "HelpCircle", Icon: HelpCircle, color: "text-gray-500" };
        console.warn("No icons available for problem generation (this should not happen if OBJECT_ICONS is populated). Using fallback.");
        return {
            id: `cto-fallback-${Date.now()}`,
            ObjectIcon: fallbackIcon.Icon,
            iconName: fallbackIcon.name,
            iconColor: fallbackIcon.color,
            count: 1,
        };
    }

    const selectedObject = R_OBJECT_ICONS[Math.floor(Math.random() * R_OBJECT_ICONS.length)];
    const config = DIFFICULTY_CONFIG[difficulty];
    const count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;

    return {
      id: `cto-${Date.now()}-${Math.random()}`,
      ObjectIcon: selectedObject.Icon,
      iconName: selectedObject.name,
      iconColor: selectedObject.color,
      count,
    };
  }, [difficulty]);


  const loadNewProblem = useCallback(() => {
    let iconsToFilter = usedIconsInCurrentCycle;
    let nextUsedIcons = [...usedIconsInCurrentCycle];

    if (usedIconsInCurrentCycle.length >= OBJECT_ICONS.length && OBJECT_ICONS.length > 0) {
      nextUsedIcons = [];
      iconsToFilter = []; 
    }

    const newProblem = generateProblemInternal(iconsToFilter);
    setCurrentProblem(newProblem);
    setUsedIconsInCurrentCycle([...nextUsedIcons, newProblem.iconName]);
    setUserAnswer("");
    setFeedback(null);
  }, [usedIconsInCurrentCycle, generateProblemInternal]);

  const resetGame = useCallback(() => {
    setScore(0);
    setQuestionsAnswered(0);
    setIsGameOver(false);
    setFeedback(null);
    setUserAnswer("");
    setUsedIconsInCurrentCycle([]);
    loadNewProblem();
  }, [loadNewProblem]);

  useEffect(() => {
    resetGame();
  }, [difficulty, resetGame]);


  const handleSubmitAnswer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProblem || isGameOver || feedback) return;

    const answerNum = parseInt(userAnswer, 10);
    if (isNaN(answerNum)) {
      setFeedback("Please enter a valid number.");
      toast({ variant: "destructive", title: "Invalid Input", description: "Your answer must be a number." });
      return;
    }

    const isCorrect = answerNum === currentProblem.count;
    let currentFeedbackMsg = "";

    if (isCorrect) {
      setScore(prev => prev + 1);
      currentFeedbackMsg = "Correct!";
      toast({ title: "Correct!", className: "bg-green-500 text-white" });
    } else {
      currentFeedbackMsg = `Not quite. There were ${currentProblem.count} ${currentProblem.iconName.toLowerCase()}s.`;
      toast({ variant: "destructive", title: "Incorrect!", description: `The correct count was ${currentProblem.count}.` });
    }
    
    setFeedback(currentFeedbackMsg);

    setTimeout(() => {
      const newQuestionsAnswered = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsAnswered);
      if (newQuestionsAnswered >= QUESTIONS_PER_ROUND) {
        setIsGameOver(true);
        setFeedback(isCorrect ? `Correct! Final Score: ${score + 1}/${QUESTIONS_PER_ROUND}` : `Not quite. There were ${currentProblem.count} ${currentProblem.iconName.toLowerCase()}s. Final Score: ${score}/${QUESTIONS_PER_ROUND}`);
      } else {
        loadNewProblem();
      }
    }, isCorrect ? 1500 : 3000);
  };

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
          How many objects do you see? Score: {score}/{QUESTIONS_PER_ROUND} | Difficulty: <span className="capitalize">{difficulty}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isGameOver ? (
          <div className="text-center p-6 bg-pink-100 rounded-lg shadow-inner">
            <Award className="mx-auto h-16 w-16 text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-pink-700">Round Over!</h2>
            <p className="text-lg text-pink-600 mt-1">{feedback || `Your final score is ${score}/${QUESTIONS_PER_ROUND}.`}</p>
            <Button onClick={resetGame} className="mt-6 w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          </div>
        ) : currentProblem && (
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
         {!currentProblem && !isGameOver && (
            <div className="text-center p-6">
                <HelpCircle size={48} className="mx-auto text-primary/50 mb-4"/>
                <p className="text-lg text-muted-foreground">Loading puzzle...</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
